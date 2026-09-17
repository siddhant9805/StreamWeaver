import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const safeUser = (user) => ({ id: user._id.toString(), name: user.name, email: user.email });

function validateCredentials({ email, password }) {
  if (!emailPattern.test(email || '')) return 'A valid email is required.';
  if (typeof password !== 'string' || password.length < 8) return 'Password must be at least 8 characters.';
  return null;
}

function issueToken(user, secret) {
  return jwt.sign({ sub: user._id.toString(), email: user.email }, secret, { expiresIn: '8h' });
}

export function authRouter({ jwtSecret }) {
  const router = Router();
  router.post('/register', async (req, res, next) => {
    try {
      const error = validateCredentials(req.body);
      if (error || !req.body.name?.trim()) return res.status(400).json({ error: error || 'Name is required.' });
      const exists = await User.exists({ email: req.body.email.toLowerCase() });
      if (exists) return res.status(409).json({ error: 'An account already exists for this email.' });
      const user = await User.create({ name: req.body.name, email: req.body.email, passwordHash: await bcrypt.hash(req.body.password, 12) });
      res.status(201).json({ token: issueToken(user, jwtSecret), user: safeUser(user) });
    } catch (error) { next(error); }
  });
  router.post('/login', async (req, res, next) => {
    try {
      const error = validateCredentials(req.body);
      if (error) return res.status(400).json({ error });
      const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+passwordHash');
      if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) return res.status(401).json({ error: 'Invalid email or password.' });
      res.json({ token: issueToken(user, jwtSecret), user: safeUser(user) });
    } catch (error) { next(error); }
  });
  return router;
}

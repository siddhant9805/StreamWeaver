import jwt from 'jsonwebtoken';

export function authenticate(jwtSecret) {
  return (req, res, next) => {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Authentication required.' });
    try {
      req.user = jwt.verify(token, jwtSecret);
      next();
    } catch {
      res.status(401).json({ error: 'Invalid or expired token.' });
    }
  };
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import { api, TOKEN_KEY, USER_KEY } from '../services/api';
import '../styles/Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault(); setError('');
    if (!email.trim() || !password) return setError('Email and password are required.');
    setLoading(true);
    try {
      const data = await api.post('/api/auth/login', { email: email.trim(), password }, { token: null });
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      navigate('/dashboard', { replace: true });
      window.location.reload();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="login-page">
      <div className="login-left"><div className="login-left-content">
        <div className="login-brand">StreamWeaver</div>
        <h1>Stream your data.<br />Transform with ease.</h1>
        <p>A no-code ETL platform for processing large CSV datasets efficiently.</p>
        <div className="login-features"><div><span>✓</span> Large Dataset Processing</div><div><span>✓</span> No-Code ETL Pipelines</div><div><span>✓</span> Real-Time Pipeline Monitoring</div></div>
      </div></div>
      <div className="login-right"><div className="login-card">
        <div className="login-icon"><FaSignInAlt /></div><h2>Welcome Back</h2><p className="login-subtitle">Login to your StreamWeaver account</p>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="login-field"><label>Email Address</label><div className="login-input-wrapper"><FaEnvelope className="login-input-icon" /><input type="email" value={email} placeholder="Enter your email" onChange={e=>setEmail(e.target.value)} /></div></div>
          <div className="login-field"><label>Password</label><div className="login-input-wrapper"><FaLock className="login-input-icon" /><input type={show?'text':'password'} value={password} placeholder="Enter your password" onChange={e=>setPassword(e.target.value)} /><button type="button" className="password-toggle" onClick={()=>setShow(!show)}>{show?<FaEyeSlash/>:<FaEye/>}</button></div></div>
          <button className="login-button" disabled={loading}><FaSignInAlt /><span>{loading?'Signing in…':'Login'}</span></button>
        </form>
        <div className="create-account-section"><span>Don't have an account?</span><button type="button" className="create-account-btn" onClick={()=>navigate('/register')}><FaUserPlus/><span>Create Account</span></button></div>
        <div className="login-footer">StreamWeaver • Secure Data Processing</div>
      </div></div>
    </div>
  );
}

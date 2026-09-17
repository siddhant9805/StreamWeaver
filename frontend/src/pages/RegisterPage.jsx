import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaUserPlus, FaCheckCircle } from 'react-icons/fa';
import { api, TOKEN_KEY, USER_KEY } from '../services/api';
import '../styles/Register.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form,setForm]=useState({name:'',email:'',password:'',confirmPassword:''});
  const [show,setShow]=useState(false); const [showConfirm,setShowConfirm]=useState(false);
  const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
  const valid=form.password.length>=8 && /[A-Z]/.test(form.password) && /[a-z]/.test(form.password) && /[0-9]/.test(form.password);

  async function submit(e){
    e.preventDefault(); setError('');
    if(!form.name.trim()||!form.email.trim()) return setError('Name and email are required.');
    if(!valid) return setError('Password must contain 8+ characters, uppercase, lowercase and a number.');
    if(form.password!==form.confirmPassword) return setError('Passwords do not match.');
    setLoading(true);
    try{
      const data=await api.post('/api/auth/register',{name:form.name.trim(),email:form.email.trim(),password:form.password},{token:null});
      localStorage.setItem(TOKEN_KEY,data.token); localStorage.setItem(USER_KEY,JSON.stringify(data.user));
      navigate('/dashboard',{replace:true}); window.location.reload();
    }catch(err){setError(err.message)} finally{setLoading(false)}
  }
  return <div className="register-page">
    <div className="register-left"><div className="register-brand">StreamWeaver</div><h1>Build your data<br/>pipeline with ease.</h1><p>Create your StreamWeaver account and start processing datasets efficiently.</p><div className="register-features"><div><FaCheckCircle/> Large Dataset Processing</div><div><FaCheckCircle/> No-Code ETL Pipelines</div><div><FaCheckCircle/> Real-Time Pipeline Monitoring</div></div></div>
    <div className="register-right"><div className="register-card"><div className="register-icon"><FaUserPlus/></div><h2>Create Account</h2><p className="register-subtitle">Join StreamWeaver today</p>{error&&<div className="register-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="register-field"><label>Full Name</label><div className="register-input-wrapper"><FaUser className="register-input-icon"/><input required value={form.name} placeholder="Enter your name" onChange={e=>setForm({...form,name:e.target.value})}/></div></div>
        <div className="register-field"><label>Email Address</label><div className="register-input-wrapper"><FaEnvelope className="register-input-icon"/><input required type="email" value={form.email} placeholder="Enter your email" onChange={e=>setForm({...form,email:e.target.value})}/></div></div>
        <div className="register-field"><label>Password</label><div className="register-input-wrapper"><FaLock className="register-input-icon"/><input required type={show?'text':'password'} value={form.password} placeholder="Create a password" onChange={e=>setForm({...form,password:e.target.value})}/><button type="button" className="password-eye" onClick={()=>setShow(!show)}>{show?<FaEyeSlash/>:<FaEye/>}</button></div></div>
        <div className="register-field"><label>Confirm Password</label><div className="register-input-wrapper"><FaLock className="register-input-icon"/><input required type={showConfirm?'text':'password'} value={form.confirmPassword} placeholder="Confirm password" onChange={e=>setForm({...form,confirmPassword:e.target.value})}/><button type="button" className="password-eye" onClick={()=>setShowConfirm(!showConfirm)}>{showConfirm?<FaEyeSlash/>:<FaEye/>}</button></div></div>
        <div className="password-rules"><div className={form.password.length>=8?'valid':''}><FaCheckCircle/> 8 or more characters</div><div className={/[A-Z]/.test(form.password)?'valid':''}><FaCheckCircle/> One uppercase letter</div><div className={/[a-z]/.test(form.password)?'valid':''}><FaCheckCircle/> One lowercase letter</div><div className={/[0-9]/.test(form.password)?'valid':''}><FaCheckCircle/> One number</div></div>
        <button className="register-button" disabled={loading}><FaUserPlus/> {loading?'Creating…':'Create Account'}</button>
      </form><div className="login-link">Already have an account? <button type="button" onClick={()=>navigate('/')}>Login</button></div>
    </div></div>
  </div>
}

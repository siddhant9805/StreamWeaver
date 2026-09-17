import React from 'react';
import { FaSearch, FaBell, FaUserCircle } from 'react-icons/fa';
import { USER_KEY } from '../services/api';
import '../styles/Navbar.css';

export default function Navbar(){
 const user=JSON.parse(localStorage.getItem(USER_KEY)||'null');
 return <header className="navbar"><div className="navbar-left"><div className="navbar-brand"><div className="brand-icon">SW</div><div className="brand-text"><h2>StreamWeaver</h2><span>ETL Platform</span></div></div></div><div className="navbar-search"><FaSearch className="search-icon"/><input placeholder="Search pipelines, datasets..."/></div><div className="navbar-right"><button className="notification-btn" type="button" title="Notifications"><FaBell/></button><div className="navbar-divider"/><div className="navbar-user"><div className="user-avatar"><FaUserCircle/></div><div className="user-details"><strong>{user?.name||'User'}</strong><span>Data Engineer</span></div></div></div></header>
}

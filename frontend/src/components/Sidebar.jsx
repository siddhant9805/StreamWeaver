import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaHome, FaCloudUploadAlt, FaDatabase, FaChartBar, FaHistory, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { TOKEN_KEY, USER_KEY } from '../services/api';
import '../styles/Sidebar.css';

export default function Sidebar(){
 const navigate=useNavigate();
 const logout=()=>{localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(USER_KEY);navigate('/',{replace:true});window.location.reload()};
 const links=[['/dashboard',FaHome,'Dashboard'],['/upload',FaCloudUploadAlt,'Upload Dataset'],['/pipelines',FaDatabase,'Pipelines'],['/analytics',FaChartBar,'Analytics'],['/history',FaHistory,'History'],['/settings',FaCog,'Settings']];
 return <aside className="sidebar"><div className="sidebar-logo"><h1>StreamWeaver</h1></div><nav className="sidebar-navigation">{links.map(([to,Icon,label])=><NavLink key={to} to={to} className={({isActive})=>`sidebar-link ${isActive?'active':''}`}><Icon/><span>{label}</span></NavLink>)}</nav><button className="sidebar-logout" onClick={logout}><FaSignOutAlt/><span>Logout</span></button></aside>
}

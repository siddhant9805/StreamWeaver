import React,{useEffect,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {FaFileAlt,FaDatabase,FaPlay,FaCheckCircle,FaCloudUploadAlt,FaArrowRight,FaServer} from 'react-icons/fa';
import {api,USER_KEY} from '../services/api';
import '../styles/Dashboard.css';

export default function Dashboard(){
 const nav=useNavigate(); const user=JSON.parse(localStorage.getItem(USER_KEY)||'null');
 const [pipelines,setPipelines]=useState([]),[uploads,setUploads]=useState([]),[runs,setRuns]=useState([]),[error,setError]=useState('');
 useEffect(()=>{Promise.all([api.get('/api/pipelines'),api.get('/api/etl/uploads'),api.get('/api/pipelines/runs/history')]).then(([p,u,r])=>{setPipelines(p.pipelines||[]);setUploads(u.uploads||[]);setRuns(r.runs||[])}).catch(e=>setError(e.message))},[]);
 const running=runs.filter(r=>r.status==='RUNNING').length, completed=runs.filter(r=>r.status==='SUCCESS').length, processed=runs.reduce((n,r)=>n+(r.processedRows||0),0);
 return <div className="dashboard-container"><div className="dashboard-header"><div className="dashboard-title"><h1>Welcome Back, {user?.name||'User'} 👋</h1><p>Monitor your ETL pipelines and process datasets.</p></div><button className="dashboard-upload-btn" onClick={()=>nav('/upload')}><FaCloudUploadAlt/> Upload New Dataset</button></div>{error&&<div className="error-message">⚠ {error}</div>}
 <div className="dashboard-stats"><div className="stat-card"><div className="stat-icon"><FaFileAlt/></div><div><h2>{uploads.length}</h2><p>Files Uploaded</p></div></div><div className="stat-card"><div className="stat-icon"><FaDatabase/></div><div><h2>{processed.toLocaleString()}</h2><p>Rows Processed</p></div></div><div className="stat-card"><div className="stat-icon"><FaPlay/></div><div><h2>{running}</h2><p>Running Jobs</p></div></div><div className="stat-card"><div className="stat-icon"><FaCheckCircle/></div><div><h2>{completed}</h2><p>Completed Jobs</p></div></div></div>
 <div className="dashboard-grid"><div className="dashboard-upload-card"><div className="dashboard-upload-icon"><FaCloudUploadAlt/></div><h2>Upload Dataset</h2><p>Upload a CSV and use it as the source for an ETL pipeline.</p><button className="dashboard-select-btn" onClick={()=>nav('/upload')}>Select File <FaArrowRight/></button></div><div className="system-status"><div className="system-status-header"><div><h2>Pipeline Workspace</h2><p>Build and manage MongoDB-backed ETL pipelines.</p></div><FaServer/></div><div className="status-row"><span>Saved Pipelines</span><strong>{pipelines.length}</strong></div><div className="status-row"><span>Pipeline Engine</span><span className="status-healthy">Ready</span></div><div className="status-row"><span>MongoDB Destination</span><span className="status-online">Connected</span></div><button className="pipeline-dashboard-btn" onClick={()=>nav('/pipelines')}>Open Pipeline Builder <FaArrowRight/></button></div></div></div>
}

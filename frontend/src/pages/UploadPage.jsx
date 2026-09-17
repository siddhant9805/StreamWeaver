import React,{useRef,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {FaCloudUploadAlt,FaFileCsv,FaCheckCircle,FaTimes} from 'react-icons/fa';
import {api} from '../services/api';
import Sidebar from '../components/Sidebar'; import Navbar from '../components/Navbar';
import VirtualizedCsvPreview from '../components/VirtualizedCsvPreview';
import '../styles/Upload.css'; import '../styles/VirtualizedPreview.css';

export default function UploadPage(){
 const navigate=useNavigate(), input=useRef(null);
 const [file,setFile]=useState(null),[drag,setDrag]=useState(false),[uploading,setUploading]=useState(false),[progress,setProgress]=useState(0),[jobId,setJobId]=useState(''),[error,setError]=useState(''),[preview,setPreview]=useState(null),[loadingPreview,setLoadingPreview]=useState(false);
 const choose=f=>{if(!f)return; if(!f.name.toLowerCase().endsWith('.csv')){setError('Only CSV files are supported by the current ETL engine.');return} setFile(f);setError('');setJobId('');setProgress(0);setPreview(null)};
 const loadPreview=async id=>{setLoadingPreview(true);try{const data=await api.get(`/api/etl/uploads/${id}/preview?limit=1000`);setPreview(data);const dataset={jobId:id,name:file.name,size:file.size,type:'CSV',uploadedAt:new Date().toISOString(),status:'Uploaded',columns:data.columns||[],previewRows:data.rows||[]};localStorage.setItem('streamweaverSelectedDataset',JSON.stringify(dataset))}catch(e){setError(`Preview unavailable: ${e.message}`)}finally{setLoadingPreview(false)}};
 const upload=async()=>{if(!file)return;setUploading(true);setError('');try{const data=await api.uploadCsv(file,setProgress);setJobId(data.jobId);setProgress(100);await loadPreview(data.jobId)}catch(e){setError(e.message)}finally{setUploading(false)}};
 const size=n=>n<1024?`${n} Bytes`:n<1048576?`${(n/1024).toFixed(2)} KB`:`${(n/1048576).toFixed(2)} MB`;
 return <div className="app-layout"><Sidebar/><div className="main-content"><Navbar/><div className="upload-page">
   <div className="upload-page-header"><div><h1>Upload Dataset</h1><p>Upload a CSV dataset to the StreamWeaver streaming ETL engine.</p></div><button className="back-btn" onClick={()=>navigate('/dashboard')}>Back to Dashboard</button></div>
   <div className={`upload-drop-zone ${drag?'dragging':''}`} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);choose(e.dataTransfer.files?.[0])}}>
     <FaCloudUploadAlt className="large-upload-icon"/><h2>Drag & Drop your CSV here</h2><p>or select a file from your computer</p><button type="button" className="select-file-btn" onClick={()=>input.current?.click()}>Select File</button><input ref={input} type="file" accept=".csv,text/csv" hidden onChange={e=>choose(e.target.files?.[0])}/><span className="supported-text">Supported format: CSV • max 10 GB • streamed upload</span>
   </div>
   {error&&<div className="error-message">⚠ {error}</div>}
   {file&&<div className="selected-file-card"><div className="file-information"><FaFileCsv className="file-type-icon"/><div><h3>{file.name}</h3><p>{size(file.size)}</p></div></div>{!uploading&&!jobId&&<button className="remove-file-btn" onClick={()=>setFile(null)}><FaTimes/></button>}</div>}
   {file&&!jobId&&<div className="upload-action-card"><div className="upload-progress"><div className="progress-header"><span>Uploading dataset...</span><span>{progress}%</span></div><div className="upload-progress-bar"><div className="upload-progress-value" style={{width:`${progress}%`}}/></div></div><button className="upload-submit-btn" onClick={upload} disabled={uploading}>{uploading?`Uploading ${progress}%`:'Upload Dataset'}</button></div>}
   {jobId&&<div className="success-card"><FaCheckCircle className="success-icon"/><div className="success-information"><h3>Dataset uploaded successfully!</h3><p>{file.name} is ready for pipeline processing.</p><small>Upload Job ID: {jobId}</small></div><button onClick={()=>navigate('/pipelines')}>Create Pipeline</button></div>}
   {jobId&&<div className="pipeline-card preview-card" style={{marginTop:22}}><div className="section-title"><span className="section-number">✓</span><div><h2>CSV Preview — first 1,000 rows</h2><p>{loadingPreview?'Preparing streamed preview…':`${preview?.rowCount||0} preview rows • ${preview?.columns?.length||0} columns. Only visible rows are rendered.`}</p></div></div>{preview&&<VirtualizedCsvPreview columns={preview.columns} rows={preview.rows}/>}</div>}
 </div></div></div>
}

import Sidebar from '../components/Sidebar'; import Navbar from '../components/Navbar'; import Dashboard from '../components/Dashboard'; import '../styles/Dashboard.css';
export default function DashboardPage(){return <div className="app-layout"><Sidebar/><div className="main-layout"><Navbar/><main className="main-content"><Dashboard/></main></div></div>}

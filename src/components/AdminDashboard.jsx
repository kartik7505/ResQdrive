import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Activity, AlertTriangle, ShieldCheck, LogIn, Clock, ChevronRight, XCircle 
} from 'lucide-react';
import { getAdminOverview, getAdminUsers, getAdminLoginHistory, getAdminErrors, getAdminActivity, checkSystemHealth, login, logout, register } from '../lib/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('resqdrive_token'));
  
  const [overview, setOverview] = useState(null);
  const [health, setHealth] = useState(null);
  const [users, setUsers] = useState([]);
  const [logins, setLogins] = useState([]);
  const [errors, setErrors] = useState([]);
  const [activity, setActivity] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setAuthError('');
    setIsSubmitting(true);
    try {
      if (isRegistering) {
        await register(email, password, displayName);
        setAuthError('Registration successful. You can now log in.');
        setIsRegistering(false);
      } else {
        const data = await login(email, password);
        if (data.user.role !== 'admin') {
          setAuthError('Access denied: Admins only');
          setIsSubmitting(false);
          return;
        }
        localStorage.setItem('resqdrive_token', data.token);
        setIsAuthenticated(true);
        fetchData();
      }
    } catch (err) {
      setAuthError(err.message || (isRegistering ? 'Registration failed' : 'Login failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {}
    localStorage.removeItem('resqdrive_token');
    setIsAuthenticated(false);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        setOverview(await getAdminOverview());
        setHealth(await checkSystemHealth());
      }
      else if (activeTab === 'users') setUsers(await getAdminUsers());
      else if (activeTab === 'logins') setLogins(await getAdminLoginHistory());
      else if (activeTab === 'errors') setErrors(await getAdminErrors());
      else if (activeTab === 'activity') setActivity(await getAdminActivity());
    } catch (err) {
      if (err.message === 'Forbidden' || err.message.includes('403') || err.message.includes('401')) {
        handleLogout();
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [activeTab, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 w-full max-w-md">
          <div className="flex items-center gap-3 justify-center mb-8">
            <ShieldCheck className="w-8 h-8 text-rose-500" />
            <h1 className="text-2xl font-bold text-white">{isRegistering ? 'Admin Registration' : 'Admin Login'}</h1>
          </div>
          {authError && <div className={`p-3 rounded-lg mb-4 text-sm text-center ${authError.includes('successful') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{authError}</div>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isRegistering && (
              <input 
                type="text" placeholder="Display Name" required
                value={displayName} onChange={e => setDisplayName(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500"
              />
            )}
            <input 
              type="email" placeholder="Email Address" required
              value={email} onChange={e => setEmail(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500"
            />
            <input 
              type="password" placeholder="Password (min 6 chars)" required minLength="6"
              value={password} onChange={e => setPassword(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500"
            />
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`text-white font-bold py-3 rounded-xl transition-colors mt-2 ${isSubmitting ? 'bg-slate-700 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-500'}`}
            >
              {isSubmitting ? 'Processing...' : (isRegistering ? 'Create Account' : 'Login to Admin')}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-slate-400">
            {isRegistering ? (
              <p>Already have an account? <button onClick={() => {setIsRegistering(false); setAuthError('');}} className="text-rose-400 hover:underline">Log in</button></p>
            ) : (
              <p>Don't have an admin account? <button onClick={() => {setIsRegistering(true); setAuthError('');}} className="text-rose-400 hover:underline">Register here</button></p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Activity },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'logins', name: 'Login History', icon: LogIn },
    { id: 'activity', name: 'Activity Feed', icon: Clock },
    { id: 'errors', name: 'Error Monitoring', icon: AlertTriangle }
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-900 text-slate-200">
      {/* Sidebar */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900/50 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10 text-white cursor-pointer" onClick={() => navigate('/')}>
          <ShieldCheck className="w-8 h-8 text-rose-500" />
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
        <nav className="flex-1 flex flex-col gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeTab === tab.id ? 'bg-rose-500/10 text-rose-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-medium">{tab.name}</span>
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} className="mt-8 flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-rose-400 transition-colors">
          <XCircle className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto h-screen">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-white capitalize">{activeTab.replace('-', ' ')}</h2>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-slate-700 border-t-rose-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'overview' && overview && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard title="Total Users" value={overview.totalUsers} icon={Users} color="text-blue-400" bg="bg-blue-500/10" />
                  <MetricCard title="New (7d)" value={overview.newMembersLast7Days} icon={Users} color="text-emerald-400" bg="bg-emerald-500/10" />
                  <MetricCard title="Active (30d)" value={overview.activeUsers30Days} icon={Activity} color="text-purple-400" bg="bg-purple-500/10" />
                  <MetricCard title="Errors (30d)" value={overview.errors30Days} icon={AlertTriangle} color="text-rose-400" bg="bg-rose-500/10" />
                  <MetricCard title="Logins (30d)" value={overview.logins30Days} icon={LogIn} color="text-amber-400" bg="bg-amber-500/10" />
                </div>
                
                {health && (
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                    <h3 className="text-xl font-bold mb-4">System Health</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex flex-col"><span className="text-sm text-slate-400">API Status</span><span className={`font-medium ${health.apiStatus === 'Operational' ? 'text-emerald-400' : 'text-rose-400'}`}>{health.apiStatus}</span></div>
                      <div className="flex flex-col"><span className="text-sm text-slate-400">Database</span><span className={`font-medium ${health.dbStatus === 'Operational' ? 'text-emerald-400' : 'text-rose-400'}`}>{health.dbStatus}</span></div>
                      <div className="flex flex-col"><span className="text-sm text-slate-400">Background Jobs</span><span className={`font-medium ${health.jobsStatus === 'Operational' ? 'text-emerald-400' : 'text-rose-400'}`}>{health.jobsStatus}</span></div>
                      <div className="flex flex-col"><span className="text-sm text-slate-400">Latency</span><span className="font-mono text-blue-400">{health.latency}</span></div>
                    </div>
                  </div>
                )}

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-200">
                  <strong>Important Caveats:</strong>
                  <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>Reported application errors do not capture every browser or device crash (e.g., hard OOM kills, strict adblockers).</li>
                    <li>An open session does not equate to a definitively online user at this exact second.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <DataTable 
                columns={['ID', 'Email', 'Display Name', 'Role', 'Joined', 'Last Login', 'Badge']}
                data={users.map(u => [
                  <span className="font-mono text-xs">{u.id.substring(0,8)}</span>,
                  u.email,
                  u.display_name || '-',
                  <span className={`px-2 py-1 text-xs rounded-full ${u.role==='admin'?'bg-rose-500/20 text-rose-400':'bg-slate-700 text-slate-300'}`}>{u.role}</span>,
                  new Date(u.created_at).toLocaleDateString(),
                  u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never',
                  u.is_new ? <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">New</span> : null
                ])}
              />
            )}

            {activeTab === 'logins' && (
              <DataTable 
                columns={['Time', 'User Email', 'Event', 'IP Address', 'Browser']}
                data={logins.map(l => [
                  <span className="text-xs">{new Date(l.created_at).toLocaleString()}</span>,
                  l.email || <span className="text-slate-500 font-mono text-xs">{l.user_id?.substring(0,8) || 'Unknown'}</span>,
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    l.event_type.includes('success') ? 'bg-emerald-500/20 text-emerald-400' : 
                    l.event_type.includes('fail') ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700 text-slate-300'
                  }`}>{l.event_type}</span>,
                  <span className="font-mono text-xs">{l.ip_address}</span>,
                  <span className="truncate max-w-[150px] inline-block" title={l.user_agent}>{l.user_agent || '-'}</span>
                ])}
              />
            )}

            {activeTab === 'errors' && (
              <DataTable 
                columns={['Count', 'Message', 'First Seen', 'Last Seen', 'Category']}
                data={Object.values(errors.reduce((acc, e) => {
                  if (!acc[e.message]) acc[e.message] = { count: 0, first: e.created_at, last: e.created_at, category: e.category, msg: e.message };
                  acc[e.message].count++;
                  if (new Date(e.created_at) < new Date(acc[e.message].first)) acc[e.message].first = e.created_at;
                  if (new Date(e.created_at) > new Date(acc[e.message].last)) acc[e.message].last = e.created_at;
                  return acc;
                }, {})).sort((a,b) => b.count - a.count).map(group => [
                  <span className="text-xs bg-rose-500/20 text-rose-400 px-2 py-1 rounded-full">{group.count}</span>,
                  <span className="truncate max-w-[300px] inline-block text-slate-300" title={group.msg}>{group.msg}</span>,
                  <span className="text-xs">{new Date(group.first).toLocaleString()}</span>,
                  <span className="text-xs">{new Date(group.last).toLocaleString()}</span>,
                  <span className="text-xs font-mono text-rose-400 bg-rose-500/10 px-2 py-1 rounded">{group.category}</span>
                ])}
              />
            )}

            {activeTab === 'activity' && (
              <DataTable 
                columns={['Time', 'User', 'Type', 'Path', 'Metadata']}
                data={activity.map(a => [
                  <span className="text-xs">{new Date(a.created_at).toLocaleString()}</span>,
                  a.email || <span className="text-slate-500 font-mono text-xs">Anonymous</span>,
                  <span className="text-xs font-medium text-blue-400">{a.event_type}</span>,
                  <span className="text-xs text-slate-500 font-mono">{a.path}</span>,
                  <span className="text-xs text-slate-500 truncate max-w-[150px] inline-block" title={a.metadata}>{a.metadata || '-'}</span>
                ])}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon: Icon, color, bg }) => (
  <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 flex flex-col justify-between">
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-slate-400 font-medium">{title}</h3>
      <div className={`p-2 rounded-lg ${bg}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
    <div className="text-3xl font-bold text-white">{value}</div>
  </div>
);

const DataTable = ({ columns, data }) => (
  <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-slate-800 text-slate-400 border-b border-slate-700">
          {columns.map((col, i) => (
            <th key={i} className="px-6 py-4 text-sm font-semibold">{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr><td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500">No data available</td></tr>
        ) : (
          data.map((row, i) => (
            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-6 py-4 whitespace-nowrap">{cell}</td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export default AdminDashboard;

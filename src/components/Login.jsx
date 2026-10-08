import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { login, register } from '../lib/api';

const Login = () => {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        await register(email, password, displayName);
        // Auto-login after register
        const data = await login(email, password);
        localStorage.setItem('resqdrive_token', data.token);
        navigate('/dashboard');
      } else {
        const data = await login(email, password);
        localStorage.setItem('resqdrive_token', data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 w-full max-w-md shadow-2xl">
        <div className="flex flex-col items-center gap-3 mb-8 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-rose-500 p-3 rounded-2xl shadow-lg shadow-rose-500/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">ResQdrive</h1>
          <p className="text-slate-400 text-sm">{isRegistering ? 'Create your driver account' : 'Sign in to your driver account'}</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl mb-6 text-sm text-center bg-rose-500/10 text-rose-400 border border-rose-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isRegistering && (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Display Name</label>
              <input 
                type="text" required
                value={displayName} onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                placeholder="John Doe"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
            <input 
              type="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
            <input 
              type="password" required minLength="6"
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full text-white font-bold py-3.5 rounded-xl transition-all mt-4 ${
              loading ? 'bg-slate-700 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/20 hover:shadow-rose-600/40'
            }`}
          >
            {loading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Sign In')}
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm text-slate-400">
          {isRegistering ? (
            <p>Already have an account? <button onClick={() => {setIsRegistering(false); setError('');}} className="text-rose-400 font-semibold hover:text-rose-300 transition-colors">Sign in</button></p>
          ) : (
            <p>Don't have an account? <button onClick={() => {setIsRegistering(true); setError('');}} className="text-rose-400 font-semibold hover:text-rose-300 transition-colors">Register here</button></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;

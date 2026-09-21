import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, MapPin, Camera, Mic, AlertTriangle, ShieldCheck } from 'lucide-react';
import useStore from '../store/useStore';

const Dashboard = () => {
  const { speed, coordinates, isCameraActive, isMicActive, systemStatus, triggerCrash } = useStore();
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen p-6 lg:p-12 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-rose-500" />
              ResQDrive
            </h1>
            <p className="text-slate-400 mt-1">Vehicle Telemetry & Safety System</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/profile')} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">Profile</button>
            <button onClick={() => navigate('/control')} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">Dispatch Center</button>
            <div className={`px-4 py-2 rounded-full font-medium text-sm border ${
              systemStatus === 'Normal' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              System: {systemStatus}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {/* Speed Widget */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden group hover:border-slate-600/50 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/50 pointer-events-none"></div>
            <Activity className="w-8 h-8 text-slate-400 mb-4 opacity-50" />
            <div className="text-6xl font-bold text-white tracking-tighter mb-2">
              {speed}
            </div>
            <div className="text-slate-400 font-medium tracking-wide">km/h</div>
          </div>

          {/* Location Widget */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-200">Location</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-slate-500 mb-1">LATITUDE</div>
                <div className="text-xl font-mono text-slate-300">{coordinates.lat.toFixed(4)}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">LONGITUDE</div>
                <div className="text-xl font-mono text-slate-300">{coordinates.lng.toFixed(4)}</div>
              </div>
            </div>
          </div>

          {/* Sensors Widget */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 flex flex-col justify-center">
            <h3 className="text-lg font-medium text-slate-200 mb-6">Cabin Sensors</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCameraActive ? 'bg-emerald-500/10' : 'bg-slate-700'}`}>
                    <Camera className={`w-5 h-5 ${isCameraActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  </div>
                  <span className="text-slate-300">Driver Camera</span>
                </div>
                <span className={`text-sm font-medium ${isCameraActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {isCameraActive ? 'ACTIVE' : 'OFF'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isMicActive ? 'bg-emerald-500/10' : 'bg-slate-700'}`}>
                    <Mic className={`w-5 h-5 ${isMicActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  </div>
                  <span className="text-slate-300">Voice Assistant</span>
                </div>
                <span className={`text-sm font-medium ${isMicActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {isMicActive ? 'LISTENING' : 'OFF'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-12">
          <button 
            onClick={triggerCrash}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-full font-semibold text-lg transition-all shadow-[0_0_40px_-10px_rgba(225,29,72,0.6)] hover:shadow-[0_0_60px_-10px_rgba(225,29,72,0.8)] scale-100 hover:scale-105 active:scale-95"
          >
            <AlertTriangle className="w-6 h-6" />
            <span>Simulate Crash</span>
            <div className="absolute inset-0 rounded-full border-2 border-white/20 group-hover:border-white/40 transition-colors"></div>
          </button>
        </div>
        
        <p className="text-center text-slate-500 mt-6 text-sm">
          Click to safely test the emergency response flow.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;

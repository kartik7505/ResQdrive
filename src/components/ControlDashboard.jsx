import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, MapPin, Clock, ArrowLeft, CheckCircle2, Navigation } from 'lucide-react';
import useStore from '../store/useStore';

const ControlDashboard = () => {
  const { incidents } = useStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-6 lg:p-12 bg-slate-950 flex flex-col">
      <header className="mb-10 flex justify-between items-center border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-600 rounded-xl flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Dispatch Control Center</h1>
            <p className="text-slate-400 text-sm">ResQDrive Emergency Response Node</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-white px-4 py-2 bg-slate-900 rounded-lg border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit Dispatch
        </button>
      </header>

      <div className="flex-1">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-xl font-semibold text-white">Active Incidents</h2>
          <div className="text-sm text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            {incidents.length} Active
          </div>
        </div>

        <div className="space-y-4">
          {incidents.map((incident) => (
            <div key={incident.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col lg:flex-row gap-6 lg:items-center justify-between hover:border-slate-700 transition-colors">
              
              <div className="flex items-start gap-4 flex-1">
                <div className="w-3 h-3 mt-1.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(225,29,72,1)] animate-pulse"></div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 text-xs font-bold rounded">
                      IMPACT: {incident.impactLevel.toUpperCase()}
                    </span>
                    <span className="text-slate-400 text-sm flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {incident.time}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Vehicle Collision Detected</h3>
                  <p className="text-slate-400 text-sm flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    {incident.location}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors">
                  <Navigation className="w-4 h-4" />
                  Route Unit
                </button>
                <button className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors">
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Resolved
                </button>
              </div>
              
            </div>
          ))}
          
          {incidents.length === 0 && (
            <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
              No active incidents at this time.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlDashboard;

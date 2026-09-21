import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, MapPin, Phone, Radio, ArrowLeft } from 'lucide-react';
import useStore from '../store/useStore';

const EmergencyState = () => {
  const { coordinates, profile } = useStore();
  const navigate = useNavigate();
  const [dispatchStatus, setDispatchStatus] = useState('Contacting Dispatch...');

  useEffect(() => {
    const timer1 = setTimeout(() => setDispatchStatus('Connecting to Emergency Services...'), 2000);
    const timer2 = setTimeout(() => setDispatchStatus('Services Dispatched! ETA: 4 mins'), 5000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="min-h-screen bg-rose-950/20 p-6 lg:p-12 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <button 
          onClick={() => navigate('/dashboard')}
          className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-slate-900 border border-rose-500/50 rounded-3xl p-8 shadow-[0_0_50px_-15px_rgba(225,29,72,0.3)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-rose-600"></div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center animate-pulse">
                <ShieldAlert className="w-8 h-8 text-rose-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">Emergency Escalated</h1>
                <p className="text-rose-400 font-medium flex items-center gap-2">
                  <Radio className="w-4 h-4 animate-pulse" />
                  {dispatchStatus}
                </p>
              </div>
            </div>
            
            <div className="bg-slate-800 px-6 py-3 rounded-xl border border-slate-700">
              <div className="text-sm text-slate-400 mb-1">IMPACT LEVEL</div>
              <div className="text-2xl font-bold text-rose-500">SEVERE</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Incident Location</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Latitude</span>
                  <span className="text-white font-mono">{coordinates.lat.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Longitude</span>
                  <span className="text-white font-mono">{coordinates.lng.toFixed(6)}</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-500/10 text-blue-400 rounded-lg text-sm border border-blue-500/20">
                Coordinates transmitted to first responders.
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-4">
                <Phone className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Emergency Contacts</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Primary Contact</div>
                  <div className="text-white font-medium">{profile.emergencyContact}</div>
                  <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                    <Radio className="w-3 h-3" /> Automated SMS Sent
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-700">
                  <div className="text-sm text-slate-400 mb-1">Medical Info Shared</div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="px-3 py-1 bg-slate-700 rounded-md text-sm text-white">Blood: {profile.bloodGroup}</span>
                    <span className="px-3 py-1 bg-slate-700 rounded-md text-sm text-white">{profile.name}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-800 text-center text-slate-500 text-sm">
            <p>Safety Notice: This is a hackathon prototype. No real emergency calls are being placed.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyState;

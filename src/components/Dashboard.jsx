import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, MapPin, Camera, Mic, AlertTriangle, ShieldCheck, Smartphone } from 'lucide-react';
import useStore from '../store/useStore';

const Dashboard = () => {
  const { speed, coordinates, locationStatus, startLocationTracking, isCameraActive, isMicActive, systemStatus, triggerCrash } = useStore();
  const navigate = useNavigate();
  
  const [isSensorActive, setIsSensorActive] = useState(false);
  const [sensorData, setSensorData] = useState({ x: 0, y: 0, z: 0, magnitude: 0 });

  const handleMotion = useCallback((event) => {
    if (!event.acceleration) return;
    const { x, y, z } = event.acceleration;
    if (x === null || y === null || z === null) return;
    
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    setSensorData({
      x: x.toFixed(2),
      y: y.toFixed(2),
      z: z.toFixed(2),
      magnitude: magnitude.toFixed(2)
    });
    
    // Trigger crash if acceleration magnitude > 20 m/s^2 (~2G, a hard stop/crash)
    if (magnitude > 20) {
      triggerCrash();
    }
  }, [triggerCrash]);

  const toggleCrashSensor = async () => {
    if (isSensorActive) {
      window.removeEventListener('devicemotion', handleMotion);
      setIsSensorActive(false);
      setSensorData({ x: 0, y: 0, z: 0, magnitude: 0 });
    } else {
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
          const permissionState = await DeviceMotionEvent.requestPermission();
          if (permissionState === 'granted') {
            window.addEventListener('devicemotion', handleMotion);
            setIsSensorActive(true);
          } else {
            alert('Permission to access device motion was denied.');
          }
        } catch (error) {
          console.error('Error requesting device motion permission:', error);
          alert('Could not start sensor. Ensure you are on a secure context (HTTPS) and a mobile device.');
        }
      } else {
        // Non-iOS 13+ devices or desktop
        window.addEventListener('devicemotion', handleMotion);
        setIsSensorActive(true);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (isSensorActive) {
        window.removeEventListener('devicemotion', handleMotion);
      }
    };
  }, [isSensorActive, handleMotion]);

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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${locationStatus === 'success' ? 'bg-blue-500/10' : 'bg-slate-700'}`}>
                  <MapPin className={`w-5 h-5 ${locationStatus === 'success' ? 'text-blue-400' : 'text-slate-400'}`} />
                </div>
                <h3 className="text-lg font-medium text-slate-200">Location</h3>
              </div>
              {locationStatus === 'idle' && (
                <button 
                  onClick={startLocationTracking}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Enable GPS
                </button>
              )}
            </div>

            {locationStatus === 'loading' ? (
              <div className="flex flex-col items-center justify-center py-4 text-slate-400">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <span className="text-sm">Acquiring signal...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {(locationStatus === 'denied' || locationStatus === 'unavailable') && (
                  <div className="px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-xs flex flex-col gap-1">
                    <span className="font-bold">⚠️ GPS {locationStatus === 'denied' ? 'Permission Denied' : 'Unavailable'}</span>
                    <span>Using simulated demo coordinates.</span>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-500 mb-1">LATITUDE</div>
                    <div className="text-lg font-mono text-slate-300">{coordinates.lat.toFixed(4)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 mb-1">LONGITUDE</div>
                    <div className="text-lg font-mono text-slate-300">{coordinates.lng.toFixed(4)}</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
                  <div className="text-xs text-slate-500">ACCURACY</div>
                  <div className={`text-xs font-mono font-medium ${coordinates.isDemo ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {coordinates.isDemo ? 'DEMO MODE' : `±${Math.round(coordinates.accuracy)} meters`}
                  </div>
                </div>
              </div>
            )}
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
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSensorActive ? 'bg-emerald-500/10' : 'bg-slate-700'}`}>
                    <Smartphone className={`w-5 h-5 ${isSensorActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  </div>
                  <span className="text-slate-300">G-Force Sensor</span>
                </div>
                <button 
                  onClick={toggleCrashSensor}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    isSensorActive 
                      ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' 
                      : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                  }`}
                >
                  {isSensorActive ? 'DISABLE' : 'ENABLE'}
                </button>
              </div>
              
              {isSensorActive && (
                <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/30 text-xs mt-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500">Acceleration (m/s²)</span>
                    <span className="font-mono text-emerald-400 font-semibold">{sensorData.magnitude}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 font-mono text-[10px] text-slate-400">
                    <div>X: {sensorData.x}</div>
                    <div>Y: {sensorData.y}</div>
                    <div>Z: {sensorData.z}</div>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500 text-center">
                    Shake device vigorously to trigger crash
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-12 gap-6">
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
          Click the button or use a mobile device and enable G-Force Sensor to safely test the emergency response flow.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;

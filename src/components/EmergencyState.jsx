import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, MapPin, Phone, Radio, ArrowLeft, RefreshCw, UserX, UserCheck } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import useStore from '../store/useStore';

// Fix Leaflet's default icon paths in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const accidentIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const getMarkerIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const nearbySampleMarkers = [
  { id: 1, type: 'Hospital', name: 'City General Hospital (Demo)', latOffset: 0.005, lngOffset: 0.003, color: 'blue' },
  { id: 2, type: 'Clinic', name: 'Sunrise Health Clinic (Demo)', latOffset: -0.004, lngOffset: 0.002, color: 'green' },
  { id: 3, type: 'Pharmacy', name: 'QuickMeds Pharmacy (Demo)', latOffset: 0.002, lngOffset: -0.004, color: 'orange' },
  { id: 4, type: 'Roadside Assistance', name: 'AutoFix Towing (Demo)', latOffset: -0.006, lngOffset: -0.003, color: 'violet' }
];

const EmergencyState = () => {
  const { coordinates, profile, driverStatus, resetDemo } = useStore();
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

  const handleReset = () => {
    resetDemo();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-rose-950/20 p-6 lg:p-12 flex flex-col items-center">
      <div className="w-full max-w-6xl">
        <button 
          onClick={() => navigate('/dashboard')}
          className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-slate-900 border border-rose-500/50 rounded-3xl p-8 shadow-[0_0_50px_-15px_rgba(225,29,72,0.3)] relative overflow-hidden mb-8">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Incident Map</h3>
              </div>
              
              <div className="flex-1 min-h-[300px] w-full rounded-xl overflow-hidden border border-slate-700 mb-6 z-0">
                <MapContainer 
                  center={[coordinates.lat, coordinates.lng]} 
                  zoom={13} 
                  style={{ height: '100%', minHeight: '300px', width: '100%', background: '#0f172a' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                    className="map-tiles-dark"
                  />
                  <Marker position={[coordinates.lat, coordinates.lng]} icon={accidentIcon}>
                    <Popup><div className="font-bold text-rose-600">Accident Location</div></Popup>
                  </Marker>
                  {nearbySampleMarkers.map(m => (
                    <Marker key={m.id} position={[coordinates.lat + m.latOffset, coordinates.lng + m.lngOffset]} icon={getMarkerIcon(m.color)}>
                      <Popup>
                        <div className="font-bold">{m.name}</div>
                        <div className="text-xs text-gray-500">{m.type}</div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>

              <div className="space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                <div className="flex justify-between">
                  <span className="text-slate-400">Time Detected</span>
                  <span className="text-white font-mono">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Latitude</span>
                  <span className="text-white font-mono">{coordinates.lat.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Longitude</span>
                  <span className="text-white font-mono">{coordinates.lng.toFixed(6)}</span>
                </div>
              </div>

              {coordinates.isDemo ? (
                <div className="mt-4 p-3 bg-amber-500/10 text-amber-400 rounded-lg text-sm border border-amber-500/20 font-medium">
                  ⚠️ Simulated Demo Location (Haldwani)
                </div>
              ) : (
                <div className="mt-4 p-3 bg-blue-500/10 text-blue-400 rounded-lg text-sm border border-blue-500/20 font-medium">
                  Real-time coordinates transmitted to first responders.
                  <div className="text-xs mt-1">Accuracy: ±{Math.round(coordinates.accuracy)} meters</div>
                </div>
              )}
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  {driverStatus === 'unresponsive' ? <UserX className="w-5 h-5 text-rose-500" /> : <UserCheck className="w-5 h-5 text-emerald-500" />}
                  <h3 className="text-lg font-semibold text-white">Driver Status</h3>
                </div>
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border ${driverStatus === 'unresponsive' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                    {driverStatus === 'unresponsive' ? 'UNRESPONSIVE TO PROMPT' : 'RESPONSIVE (REQUESTED HELP)'}
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <div className="flex items-center gap-3 mb-4">
                  <Phone className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-white">Emergency Contacts</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Primary Contact</div>
                    <div className="text-white font-medium">{profile.emergencyContact}</div>
                    <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                      <Radio className="w-3 h-3" /> Simulated Alert Sent
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-700">
                    <div className="text-sm text-slate-400 mb-1">Medical Info Shared</div>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="px-3 py-1 bg-slate-700 rounded-md text-sm text-white">{profile.name}</span>
                      <span className="px-3 py-1 bg-slate-700 rounded-md text-sm text-white">Blood: {profile.bloodGroup}</span>
                      {profile.allergies && profile.allergies.toLowerCase() !== 'none' && (
                        <span className="px-3 py-1 bg-rose-500/20 text-rose-400 rounded-md text-sm border border-rose-500/20">Allergies: {profile.allergies}</span>
                      )}
                      {profile.medicalInfo && profile.medicalInfo.toLowerCase() !== 'none' && (
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-md text-sm border border-amber-500/20">Med: {profile.medicalInfo}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-800 text-center text-slate-500 text-sm">
            <p>Safety Notice: This is a simulated prototype. No real emergency calls are being placed.</p>
          </div>
        </div>

        <div className="flex justify-center">
          <button 
            onClick={handleReset}
            className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-semibold transition-all border border-slate-700 hover:border-slate-600 shadow-xl"
          >
            <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            <span>Reset Demo</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default EmergencyState;

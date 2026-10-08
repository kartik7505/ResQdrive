import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, MapPin, Clock, ArrowLeft, CheckCircle2, Navigation, Phone, Car, Filter, Trash2, AlertCircle } from 'lucide-react';
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

const ControlDashboard = () => {
  const { incidents, coordinates, updateIncidentStatus, clearIncidents } = useStore();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filteredIncidents = incidents.filter(inc => {
    if (statusFilter !== 'All' && inc.status !== statusFilter) return false;
    if (severityFilter !== 'All' && inc.impactLevel !== severityFilter) return false;
    return true;
  });

  const displayIncident = incidents.find(i => i.id === selectedIncidentId) || incidents[0];
  const mapCenter = displayIncident 
    ? [displayIncident.lat, displayIncident.lng] 
    : [coordinates.lat, coordinates.lng];
  const mapKey = `${mapCenter[0]}-${mapCenter[1]}`; // Forces re-render on center change

  const handleClear = () => {
    clearIncidents();
    setShowClearConfirm(false);
    setSelectedIncidentId(null);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'New': return 'bg-rose-500 text-white';
      case 'Contacting Driver': return 'bg-amber-500 text-white';
      case 'Help Dispatched': return 'bg-blue-500 text-white';
      case 'Resolved': return 'bg-emerald-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="min-h-screen p-6 lg:p-12 bg-slate-950 flex flex-col">
      <header className="mb-8 flex justify-between items-center border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-600 rounded-xl flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Dispatch Control Center</h1>
            <p className="text-slate-400 text-sm">ResQDrive Emergency Response Node</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!showClearConfirm ? (
            <button 
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 text-slate-400 hover:text-rose-400 px-4 py-2 bg-slate-900 rounded-lg border border-slate-800 transition-colors text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Clear Demo Incidents
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg">
              <span className="text-xs text-rose-400 mr-2">Confirm clear?</span>
              <button onClick={handleClear} className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded">Yes</button>
              <button onClick={() => setShowClearConfirm(false)} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded">No</button>
            </div>
          )}
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-white px-4 py-2 bg-slate-900 rounded-lg border border-slate-800 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit Dispatch
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Side: Map & Coordinates */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-rose-500" />
                <h2 className="text-xl font-semibold text-white">Live Incident Map</h2>
              </div>
              {displayIncident && (
                <div className="text-sm text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  Viewing Incident: {displayIncident.id}
                </div>
              )}
            </div>
            
            <div className="flex-1 min-h-[400px] w-full rounded-xl overflow-hidden border border-slate-800 mb-6 z-0">
              <MapContainer 
                key={mapKey}
                center={mapCenter} 
                zoom={14} 
                style={{ height: '100%', minHeight: '400px', width: '100%', background: '#0f172a' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap'
                  className="map-tiles-dark"
                />
                
                {incidents.map(inc => (
                  <Marker key={inc.id} position={[inc.lat, inc.lng]} icon={accidentIcon}>
                    <Popup>
                      <div className="font-bold text-rose-600">Incident {inc.id}</div>
                      <div className="text-xs">Status: {inc.status}</div>
                      <div className="text-xs">Time: {inc.time}</div>
                    </Popup>
                  </Marker>
                ))}
                
                {displayIncident && nearbySampleMarkers.map(m => (
                  <Marker key={m.id} position={[displayIncident.lat + m.latOffset, displayIncident.lng + m.lngOffset]} icon={getMarkerIcon(m.color)}>
                    <Popup>
                      <div className="font-bold">{m.name}</div>
                      <div className="text-xs text-gray-500">{m.type}</div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex flex-wrap gap-6 w-full md:w-auto">
                <div>
                  <div className="text-xs text-slate-500 mb-1">LATITUDE</div>
                  <div className="text-white font-mono">{mapCenter[0].toFixed(6)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">LONGITUDE</div>
                  <div className="text-white font-mono">{mapCenter[1].toFixed(6)}</div>
                </div>
                {displayIncident && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">VEHICLE</div>
                    <div className="text-white font-mono">{displayIncident.vehicleNumber}</div>
                  </div>
                )}
              </div>
              
              {displayIncident?.isDemo ? (
                <div className="px-4 py-2 bg-amber-500/10 text-amber-400 rounded-lg text-sm border border-amber-500/20 font-medium whitespace-nowrap">
                  ⚠️ Demo Tracking Mode
                </div>
              ) : (
                <div className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-sm border border-blue-500/20 font-medium whitespace-nowrap">
                  Active Live Tracking
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Incident List */}
        <div className="flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                Incident Queue
              </h2>
              <div className="text-sm text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                {incidents.length} Total
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block">Status Filter</label>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="New">New</option>
                  <option value="Contacting Driver">Contacting Driver</option>
                  <option value="Help Dispatched">Help Dispatched</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block">Severity Filter</label>
                <select 
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="All">All Severities</option>
                  <option value="Severe">Severe</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4 overflow-y-auto pr-2 max-h-[700px] custom-scrollbar">
            {filteredIncidents.map((incident) => (
              <div 
                key={incident.id} 
                className={`bg-slate-900 border rounded-2xl p-5 flex flex-col gap-4 transition-colors ${selectedIncidentId === incident.id ? 'border-rose-500/50 shadow-[0_0_15px_-3px_rgba(225,29,72,0.2)]' : 'border-slate-800 hover:border-slate-700'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2.5 h-2.5 mt-2 rounded-full shadow-[0_0_10px_rgba(225,29,72,1)] ${incident.status !== 'Resolved' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500 shadow-emerald-500'}`}></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-0.5 text-xs font-bold rounded ${incident.impactLevel === 'Critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-orange-500/20 text-orange-400'}`}>
                        {incident.impactLevel.toUpperCase()}
                      </span>
                      <span className="text-slate-400 text-xs flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" /> {incident.time}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-base font-bold text-white">ID: {incident.id.slice(-6)}</h3>
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase ${getStatusColor(incident.status)}`}>
                        {incident.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 mt-3">
                      <p className="text-slate-400 text-xs flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        {incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}
                      </p>
                      <p className="text-slate-400 text-xs flex items-start gap-1.5">
                        <Car className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        Vehicle: {incident.vehicleNumber}
                      </p>
                      <p className="text-slate-400 text-xs flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        Driver: {incident.driverStatus}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
                  <button 
                    onClick={() => setSelectedIncidentId(incident.id)}
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                  >
                    <Navigation className="w-3.5 h-3.5 text-blue-400" />
                    Locate
                  </button>
                  <button 
                    onClick={() => updateIncidentStatus(incident.id, 'Contacting Driver')}
                    disabled={incident.status === 'Resolved'}
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    Contact
                  </button>
                  <button 
                    onClick={() => updateIncidentStatus(incident.id, 'Help Dispatched')}
                    disabled={incident.status === 'Resolved'}
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    Dispatch
                  </button>
                  <button 
                    onClick={() => updateIncidentStatus(incident.id, 'Resolved')}
                    disabled={incident.status === 'Resolved'}
                    className="py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Resolve
                  </button>
                </div>
                
              </div>
            ))}
            
            {filteredIncidents.length === 0 && (
              <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-2xl text-sm flex flex-col items-center gap-3 bg-slate-900/50">
                <CheckCircle2 className="w-10 h-10 text-slate-700" />
                <p>No incidents match the current filters.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ControlDashboard;

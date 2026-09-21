import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, Stethoscope, Cross, Wrench, Building2 } from 'lucide-react';
import useStore from '../store/useStore';
import L from 'leaflet';

// Fix Leaflet's default icon paths in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Mock Data for nearby help in New Delhi
const nearbyPlaces = [
  { id: 1, name: 'AIIMS New Delhi', type: 'Hospital', lat: 28.5659, lng: 77.2096, distance: '5.4 km' },
  { id: 2, name: 'Max Super Speciality Hospital', type: 'Clinic', lat: 28.5273, lng: 77.2183, distance: '9.6 km' },
  { id: 3, name: 'Apollo Pharmacy', type: 'Pharmacy', lat: 28.6200, lng: 77.2100, distance: '0.8 km' },
  { id: 4, name: 'NHAI Roadside Assistance', type: 'Roadside Assistance', lat: 28.6139, lng: 77.2300, distance: '2.1 km' },
];

const RecenterMap = ({ coordinates }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([coordinates.lat, coordinates.lng], 13);
  }, [coordinates, map]);
  return null;
};

const NearbyHelp = () => {
  const { coordinates } = useStore();
  const navigate = useNavigate();

  const getIconForType = (type) => {
    switch (type) {
      case 'Hospital': return <Building2 className="w-5 h-5 text-rose-500" />;
      case 'Clinic': return <Stethoscope className="w-5 h-5 text-blue-500" />;
      case 'Pharmacy': return <Cross className="w-5 h-5 text-emerald-500" />;
      case 'Roadside Assistance': return <Wrench className="w-5 h-5 text-amber-500" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen p-6 lg:p-12 flex flex-col">
      <header className="mb-6 flex justify-between items-center">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-white">Nearby Assistance</h1>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-slate-700 shadow-xl relative z-0">
          <MapContainer 
            center={[coordinates.lat, coordinates.lng]} 
            zoom={13} 
            style={{ height: '100%', minHeight: '500px', width: '100%', background: '#0f172a' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              className="map-tiles-dark"
            />
            
            {/* User Location */}
            <Marker position={[coordinates.lat, coordinates.lng]}>
              <Popup>
                <div className="text-slate-900 font-bold">Your Location</div>
              </Popup>
            </Marker>

            {/* Nearby Places */}
            {nearbyPlaces.map(place => (
              <Marker key={place.id} position={[place.lat, place.lng]}>
                <Popup>
                  <div className="text-slate-900 font-semibold">{place.name}</div>
                  <div className="text-slate-600 text-sm">{place.type}</div>
                </Popup>
              </Marker>
            ))}

            <RecenterMap coordinates={coordinates} />
          </MapContainer>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700 p-6 flex flex-col gap-4 overflow-y-auto">
          <h2 className="text-lg font-semibold text-white mb-2">Closest Options</h2>
          {nearbyPlaces.map(place => (
            <div key={place.id} className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer group">
              <div className="flex items-start gap-4">
                <div className="bg-slate-800 p-3 rounded-lg group-hover:scale-110 transition-transform">
                  {getIconForType(place.type)}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium">{place.name}</h3>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-slate-400">{place.type}</span>
                    <span className="text-sm font-semibold text-emerald-400">{place.distance}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NearbyHelp;

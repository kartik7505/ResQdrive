import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, Stethoscope, Cross, Wrench, Building2, Loader2 } from 'lucide-react';
import useStore from '../store/useStore';
import L from 'leaflet';

// Fix Leaflet's default icon paths in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return (R * c).toFixed(1);
};

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
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNearby = async () => {
      setLoading(true);
      try {
        const radius = 5000; // 5km
        const query = `
          [out:json];
          (
            node["amenity"="hospital"](around:${radius},${coordinates.lat},${coordinates.lng});
            node["amenity"="pharmacy"](around:${radius},${coordinates.lat},${coordinates.lng});
            node["amenity"="clinic"](around:${radius},${coordinates.lat},${coordinates.lng});
            node["shop"="car_repair"](around:${radius},${coordinates.lat},${coordinates.lng});
          );
          out body;
        `;
        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: query
        });
        const data = await response.json();
        
        const places = data.elements.map(el => {
          let type = 'Unknown';
          if (el.tags.amenity === 'hospital') type = 'Hospital';
          else if (el.tags.amenity === 'clinic') type = 'Clinic';
          else if (el.tags.amenity === 'pharmacy') type = 'Pharmacy';
          else if (el.tags.shop === 'car_repair') type = 'Roadside Assistance';
          
          return {
            id: el.id,
            name: el.tags.name || `Unnamed ${type}`,
            type: type,
            lat: el.lat,
            lng: el.lon,
            distanceVal: parseFloat(calculateDistance(coordinates.lat, coordinates.lng, el.lat, el.lon)),
            distance: calculateDistance(coordinates.lat, coordinates.lng, el.lat, el.lon) + ' km'
          };
        });
        
        // Sort by distance and take top 10
        places.sort((a, b) => a.distanceVal - b.distanceVal);
        setNearbyPlaces(places.slice(0, 10));
      } catch (err) {
        console.error("Failed to fetch nearby places:", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (coordinates.lat && coordinates.lng) {
      fetchNearby();
    }
  }, [coordinates.lat, coordinates.lng]);

  const getIconForType = (type) => {
    switch (type) {
      case 'Hospital': return <Building2 className="w-5 h-5 text-rose-500" />;
      case 'Clinic': return <Stethoscope className="w-5 h-5 text-blue-500" />;
      case 'Pharmacy': return <Cross className="w-5 h-5 text-emerald-500" />;
      case 'Roadside Assistance': return <Wrench className="w-5 h-5 text-amber-500" />;
      default: return <Building2 className="w-5 h-5 text-slate-500" />;
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
          <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            Closest Options
            {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
          </h2>
          
          {!loading && nearbyPlaces.length === 0 && (
            <div className="text-slate-400 text-center py-8">
              No facilities found within 5km of your location.
            </div>
          )}

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

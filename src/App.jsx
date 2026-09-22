import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import EmergencyState from './components/EmergencyState';
import NearbyHelp from './components/NearbyHelp';
import Profile from './components/Profile';
import ControlDashboard from './components/ControlDashboard';
import CrashAlertModal from './components/CrashAlertModal';
import Home from './components/Home';
import useStore from './store/useStore';

function App() {
  const setCoordinates = useStore((state) => state.setCoordinates);

  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting live location: ", error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0
        }
      );
      
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [setCoordinates]);

  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-rose-500/30">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/emergency" element={<EmergencyState />} />
          <Route path="/nearby" element={<NearbyHelp />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/control" element={<ControlDashboard />} />
        </Routes>
        <CrashAlertModal />
      </div>
    </Router>
  );
}

export default App;

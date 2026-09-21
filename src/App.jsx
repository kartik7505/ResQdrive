import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import EmergencyState from './components/EmergencyState';
import NearbyHelp from './components/NearbyHelp';
import Profile from './components/Profile';
import ControlDashboard from './components/ControlDashboard';
import CrashAlertModal from './components/CrashAlertModal';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-rose-500/30">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
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

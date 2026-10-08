import { create } from 'zustand';

const defaultProfile = {
  name: 'Demo User',
  age: '30',
  bloodGroup: 'O+',
  emergencyContactName: 'Demo Contact',
  emergencyContact: '555-0100',
  vehicleNumber: 'DM-00-XX-0000',
  allergies: 'None',
  medicalInfo: 'None'
};

const getInitialProfile = () => {
  const saved = localStorage.getItem('resqdrive_profile');
  return saved ? JSON.parse(saved) : defaultProfile;
};

const getInitialIncidents = () => {
  const saved = localStorage.getItem('resqdrive_incidents');
  return saved ? JSON.parse(saved) : [];
};

const saveIncidents = (incidents) => {
  localStorage.setItem('resqdrive_incidents', JSON.stringify(incidents));
};

const useStore = create((set) => ({
  speed: 65,
  isCameraActive: true,
  isMicActive: true,
  systemStatus: 'Normal',
  driverStatus: 'normal', // 'normal', 'responsive', 'unresponsive'
  
  // Geolocation states
  locationStatus: 'idle', // 'idle', 'loading', 'success', 'denied', 'unavailable'
  coordinates: { lat: 29.2183, lng: 79.5126, accuracy: 0, isDemo: true }, // Haldwani demo coordinates
  
  startLocationTracking: () => {
    set({ locationStatus: 'loading' });
    if (!('geolocation' in navigator)) {
      set({ locationStatus: 'unavailable', coordinates: { lat: 29.2183, lng: 79.5126, accuracy: 0, isDemo: true } });
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        set({ 
          locationStatus: 'success', 
          coordinates: { lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy, isDemo: false } 
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          set({ locationStatus: 'denied', coordinates: { lat: 29.2183, lng: 79.5126, accuracy: 0, isDemo: true } });
        } else {
          set({ locationStatus: 'unavailable', coordinates: { lat: 29.2183, lng: 79.5126, accuracy: 0, isDemo: true } });
        }
      },
      { enableHighAccuracy: true }
    );
  },

  crashAlertActive: false,
  crashState: null, // 'alert', 'emergency', 'okay'
  countdown: 20,
  
  setSpeed: (speed) => set({ speed }),
  setCoordinates: (coordinates) => set({ coordinates }),
  
  triggerCrash: () => set(() => ({ 
    crashAlertActive: true, 
    crashState: 'alert',
    countdown: 20,
    systemStatus: 'Collision Detected',
    driverStatus: 'normal'
  })),
  
  respondOkay: () => set({ 
    crashAlertActive: false, 
    crashState: 'okay',
    systemStatus: 'Normal',
    driverStatus: 'responsive'
  }),
  
  respondHelp: () => set((state) => {
    const newIncident = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      driverStatus: 'Responsive (Requested Help)',
      impactLevel: 'Severe',
      lat: state.coordinates.lat,
      lng: state.coordinates.lng,
      isDemo: state.coordinates.isDemo,
      vehicleNumber: state.profile.vehicleNumber,
      status: 'New'
    };
    const updated = [newIncident, ...state.incidents];
    saveIncidents(updated);
    return { 
      crashAlertActive: false, 
      crashState: 'emergency',
      systemStatus: 'Emergency Dispatched',
      driverStatus: 'responsive',
      incidents: updated
    };
  }),

  cancelAlarm: () => set({
    crashAlertActive: false,
    crashState: null,
    systemStatus: 'Normal',
    driverStatus: 'normal'
  }),
  
  setCountdown: (time) => set({ countdown: time }),
  
  endCountdown: () => set((state) => {
    const newIncident = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      driverStatus: 'Unresponsive to Prompt',
      impactLevel: 'Critical',
      lat: state.coordinates.lat,
      lng: state.coordinates.lng,
      isDemo: state.coordinates.isDemo,
      vehicleNumber: state.profile.vehicleNumber,
      status: 'New'
    };
    const updated = [newIncident, ...state.incidents];
    saveIncidents(updated);
    return {
      crashAlertActive: false,
      crashState: 'emergency',
      systemStatus: 'No Response - Emergency Dispatched',
      driverStatus: 'unresponsive',
      incidents: updated
    };
  }),

  resetDemo: () => set({
    speed: 65,
    systemStatus: 'Normal',
    driverStatus: 'normal',
    locationStatus: 'idle',
    coordinates: { lat: 29.2183, lng: 79.5126, accuracy: 0, isDemo: true },
    crashAlertActive: false,
    crashState: null,
    countdown: 20
  }),
  
  profile: getInitialProfile(),
  
  updateProfile: (newProfile) => set(() => {
    localStorage.setItem('resqdrive_profile', JSON.stringify(newProfile));
    return { profile: newProfile };
  }),
  
  deleteDemoData: () => set(() => {
    localStorage.removeItem('resqdrive_profile');
    return { profile: defaultProfile };
  }),
  
  incidents: getInitialIncidents(),
  
  updateIncidentStatus: (id, newStatus) => set((state) => {
    const updated = state.incidents.map(inc => inc.id === id ? { ...inc, status: newStatus } : inc);
    saveIncidents(updated);
    return { incidents: updated };
  }),
  
  clearIncidents: () => set(() => {
    localStorage.removeItem('resqdrive_incidents');
    return { incidents: [] };
  })
}));

export default useStore;

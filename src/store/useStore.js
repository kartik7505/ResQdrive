import { create } from 'zustand';

const useStore = create((set) => ({
  speed: 65,
  isCameraActive: true,
  isMicActive: true,
  systemStatus: 'Normal',
  coordinates: { lat: 28.6139, lng: 77.2090 },
  
  crashAlertActive: false,
  crashState: null, // 'alert', 'emergency', 'okay'
  countdown: 20,
  
  setSpeed: (speed) => set({ speed }),
  setCoordinates: (coordinates) => set({ coordinates }),
  
  triggerCrash: () => set({ 
    crashAlertActive: true, 
    crashState: 'alert',
    countdown: 20,
    systemStatus: 'Collision Detected'
  }),
  
  respondOkay: () => set({ 
    crashAlertActive: false, 
    crashState: 'okay',
    systemStatus: 'Normal'
  }),
  
  respondHelp: () => set({ 
    crashAlertActive: false, 
    crashState: 'emergency',
    systemStatus: 'Emergency Dispatched'
  }),
  
  setCountdown: (time) => set({ countdown: time }),
  
  endCountdown: () => set({
    crashAlertActive: false,
    crashState: 'emergency',
    systemStatus: 'No Response - Emergency Dispatched'
  }),
  
  profile: {
    name: 'Rahul Sharma',
    bloodGroup: 'B+',
    emergencyContact: '+91 98765 43210',
    vehicleNumber: 'DL-01-AB-1234'
  },
  
  incidents: [
    {
      id: '1',
      time: '10:42 AM',
      location: 'NH-48, Sector 15',
      state: 'Dispatched',
      impactLevel: 'High'
    }
  ],
  addIncident: (incident) => set((state) => ({ incidents: [incident, ...state.incidents] }))
}));

export default useStore;

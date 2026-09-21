import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Activity, Phone, Car, ArrowLeft, Save } from 'lucide-react';
import useStore from '../store/useStore';

const Profile = () => {
  const { profile } = useStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-6 lg:p-12 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <header className="mb-8 flex justify-between items-center">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-white">Emergency Profile</h1>
          <div className="w-20"></div> {/* Spacer for centering */}
        </header>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-xl">
          <p className="text-slate-400 mb-8 text-center">
            This information is securely shared with emergency responders during an incident.
          </p>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" /> Full Name
              </label>
              <input 
                type="text" 
                defaultValue={profile.name}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Blood Group
              </label>
              <select 
                defaultValue={profile.bloodGroup}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors appearance-none"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4" /> Emergency Contact Number
              </label>
              <input 
                type="tel" 
                defaultValue={profile.emergencyContact}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <Car className="w-4 h-4" /> Vehicle Number (License Plate)
              </label>
              <input 
                type="text" 
                defaultValue={profile.vehicleNumber}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors uppercase font-mono"
              />
            </div>

            <div className="pt-6 border-t border-slate-700">
              <button 
                type="submit"
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/50"
              >
                <Save className="w-5 h-5" />
                Save Profile Changes
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

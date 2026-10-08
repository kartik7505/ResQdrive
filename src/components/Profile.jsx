import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Activity, Phone, Car, ArrowLeft, Save, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import useStore from '../store/useStore';

const Profile = () => {
  const { profile, updateProfile, deleteDemoData } = useStore();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState(profile);
  const [saveStatus, setSaveStatus] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.age || !formData.emergencyContactName || !formData.emergencyContact || !formData.vehicleNumber) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }
    updateProfile(formData);
    setSaveStatus('success');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleDelete = () => {
    deleteDemoData();
    setShowConfirmDelete(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen p-6 lg:p-12 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <header className="mb-8 flex justify-between items-center">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-white">Emergency Profile</h1>
          <div className="w-20"></div>
        </header>

        {saveStatus === 'success' && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center gap-3 text-emerald-400 font-medium">
            <CheckCircle2 className="w-5 h-5" />
            Profile saved successfully to local storage!
          </div>
        )}
        
        {saveStatus === 'error' && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center gap-3 text-rose-400 font-medium">
            <AlertCircle className="w-5 h-5" />
            Please fill in all required fields.
          </div>
        )}

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-xl mb-8">
          <p className="text-slate-400 mb-8 text-center">
            This essential information is securely shared with emergency responders during a detected crash.
          </p>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" /> Full Name *
                </label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" /> Age *
                </label>
                <input 
                  type="number" 
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Blood Group */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Blood Group *
                </label>
                <select 
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
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
                  <option value="Unknown">Unknown</option>
                </select>
              </div>

              {/* Vehicle Number */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Car className="w-4 h-4" /> Vehicle Number *
                </label>
                <input 
                  type="text" 
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors uppercase font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Emergency Contact Name */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Contact Name *
                </label>
                <input 
                  type="text" 
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                />
              </div>

              {/* Emergency Contact Number */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Contact Number *
                </label>
                <input 
                  type="tel" 
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                />
              </div>
            </div>

            <div className="pt-4">
              <h3 className="text-lg font-semibold text-white mb-4">Medical Information (Optional)</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Allergies</label>
                  <input 
                    type="text" 
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    placeholder="e.g. Penicillin, Peanuts (or 'None')"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Important Medical Conditions</label>
                  <textarea 
                    name="medicalInfo"
                    value={formData.medicalInfo}
                    onChange={handleChange}
                    rows="3"
                    placeholder="e.g. Asthma, Diabetes (or 'None')"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors resize-none"
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-700 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <button 
                type="submit"
                className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/50"
              >
                <Save className="w-5 h-5" />
                Save Profile
              </button>
              
              {!showConfirmDelete ? (
                <button 
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="text-slate-500 hover:text-rose-400 text-sm font-medium transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Data
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-400">Are you sure?</span>
                  <button 
                    type="button"
                    onClick={handleDelete}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Yes, Delete
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowConfirmDelete(false)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

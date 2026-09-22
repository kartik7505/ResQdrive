import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, MapPin, Activity, PhoneCall, ChevronRight, Car } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl hover:border-rose-500/50 hover:bg-slate-800/80 transition-all group"
  >
    <div className="bg-rose-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
      <Icon className="text-rose-500 w-6 h-6" />
    </div>
    <h3 className="text-xl font-semibold text-slate-100 mb-2">{title}</h3>
    <p className="text-slate-400 leading-relaxed">{description}</p>
  </motion.div>
);

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 overflow-hidden relative">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-rose-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-6">
        <div className="flex items-center gap-2">
          <div className="bg-rose-500 p-2 rounded-lg">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">ResQdrive</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-full transition-colors border border-slate-700"
        >
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left: Content */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 text-rose-400 font-medium text-sm w-fit border border-rose-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              Intelligent Crash Detection Active
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
              Your Guardian <br /> on Every Journey.
            </h1>
            
            <p className="text-lg lg:text-xl text-slate-400 leading-relaxed max-w-xl">
              ResQdrive uses advanced sensors and real-time monitoring to detect accidents and automatically dispatch emergency services to your exact location.
            </p>
            
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="group relative px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-full overflow-hidden transition-all shadow-[0_0_40px_-10px_rgba(225,29,72,0.6)]"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                <span className="relative flex items-center gap-2">
                  Launch Dashboard <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              <button className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-full transition-all border border-slate-700">
                View Features
              </button>
            </div>
          </motion.div>

          {/* Right: Visual/Graphic */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative h-[400px] lg:h-[500px] rounded-3xl overflow-hidden border border-slate-700/50 bg-slate-800/30 backdrop-blur-3xl flex items-center justify-center"
          >
            {/* Animated radar rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute border border-rose-500/20 rounded-full"
                  initial={{ width: 100, height: 100, opacity: 1 }}
                  animate={{ width: 600, height: 600, opacity: 0 }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: i * 1.3,
                    ease: "linear"
                  }}
                />
              ))}
            </div>
            
            {/* Center Vehicle Icon */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 bg-slate-900 p-6 rounded-full border border-slate-700 shadow-2xl"
            >
              <Car className="w-16 h-16 text-slate-100" />
            </motion.div>
            
            {/* Floating Elements */}
            <motion.div 
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/4 left-1/4 bg-slate-800/80 backdrop-blur-md border border-slate-700 p-3 rounded-2xl flex items-center gap-3 shadow-xl"
            >
              <Activity className="w-5 h-5 text-emerald-400" />
              <div className="text-sm">
                <p className="text-slate-400 text-xs">Status</p>
                <p className="font-semibold text-emerald-400">Monitoring</p>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-1/4 right-1/4 bg-slate-800/80 backdrop-blur-md border border-slate-700 p-3 rounded-2xl flex items-center gap-3 shadow-xl"
            >
              <MapPin className="w-5 h-5 text-blue-400" />
              <div className="text-sm">
                <p className="text-slate-400 text-xs">Location</p>
                <p className="font-semibold text-blue-400">Tracked</p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Features Section */}
        <div className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Complete Peace of Mind</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Everything you need to ensure your safety on the road, packed into one powerful application.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard 
              icon={ShieldAlert}
              title="Crash Detection"
              description="Instantly detects impacts using advanced sensors and machine learning."
              delay={0.1}
            />
            <FeatureCard 
              icon={PhoneCall}
              title="Auto-Dispatch"
              description="Automatically alerts emergency services with your exact location and details."
              delay={0.2}
            />
            <FeatureCard 
              icon={MapPin}
              title="Live Tracking"
              description="Share your real-time journey safely with family and loved ones."
              delay={0.3}
            />
            <FeatureCard 
              icon={Activity}
              title="Vehicle Vitals"
              description="Monitor vehicle health and receive predictive maintenance alerts."
              delay={0.4}
            />
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} ResQdrive. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;

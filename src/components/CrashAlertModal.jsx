import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Mic, PhoneCall, CheckCircle } from 'lucide-react';
import useStore from '../store/useStore';

const CrashAlertModal = () => {
  const { 
    crashAlertActive, 
    countdown, 
    setCountdown, 
    respondOkay, 
    respondHelp, 
    endCountdown 
  } = useStore();
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    let timer;
    if (crashAlertActive && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (crashAlertActive && countdown === 0) {
      endCountdown();
      navigate('/emergency');
    }
    return () => clearInterval(timer);
  }, [crashAlertActive, countdown, setCountdown, endCountdown, navigate]);

  // Voice Prompt Simulation (Web Speech API)
  useEffect(() => {
    if (crashAlertActive) {
      const text = "Possible collision detected. Are you okay? Say I am okay, or need help.";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
        setIsListening(true);
        // Here we would initialize SpeechRecognition in a real app.
      };
      window.speechSynthesis.speak(utterance);
    } else {
      window.speechSynthesis.cancel();
      setIsListening(false);
    }
  }, [crashAlertActive]);

  const handleOkay = () => {
    window.speechSynthesis.cancel();
    respondOkay();
    navigate('/nearby');
  };

  const handleHelp = () => {
    window.speechSynthesis.cancel();
    respondHelp();
    navigate('/emergency');
  };

  return (
    <AnimatePresence>
      {crashAlertActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-rose-950/80 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-slate-900 border border-rose-500/30 rounded-3xl p-8 md:p-12 max-w-2xl w-full shadow-[0_0_100px_-20px_rgba(225,29,72,0.5)] overflow-hidden"
          >
            {/* Pulsing background effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-rose-500/10 blur-[100px] pointer-events-none animate-pulse"></div>

            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-24 h-24 bg-rose-500/20 rounded-full flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 rounded-full border-4 border-rose-500 border-t-transparent animate-spin"></div>
                <AlertTriangle className="w-12 h-12 text-rose-500" />
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Possible Collision Detected
              </h2>
              <p className="text-xl text-slate-300 mb-8">
                Are you okay? Emergency services will be contacted in
              </p>
              
              <div className="text-7xl font-bold text-rose-500 mb-8 font-mono">
                {countdown}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <button 
                  onClick={handleOkay}
                  className="flex-1 py-4 md:py-5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-lg md:text-xl transition-colors flex items-center justify-center gap-3 border border-slate-700 hover:border-slate-500"
                >
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                  I'M OKAY
                </button>
                <button 
                  onClick={handleHelp}
                  className="flex-1 py-4 md:py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-bold text-lg md:text-xl transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_-5px_rgba(225,29,72,0.5)] hover:shadow-[0_0_40px_-5px_rgba(225,29,72,0.8)]"
                >
                  <PhoneCall className="w-6 h-6" />
                  NEED HELP
                </button>
              </div>

              <div className="mt-8 flex items-center gap-3 text-slate-400 bg-slate-800/50 px-6 py-3 rounded-full">
                <Mic className={`w-5 h-5 ${isListening ? 'text-rose-400 animate-pulse' : ''}`} />
                <span>{isListening ? 'Listening for voice response...' : 'Initializing microphone...'}</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CrashAlertModal;

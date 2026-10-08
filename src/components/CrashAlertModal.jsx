import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Mic, PhoneCall, CheckCircle, XCircle, MicOff } from 'lucide-react';
import useStore from '../store/useStore';

const CrashAlertModal = () => {
  const {
    crashAlertActive,
    countdown,
    setCountdown,
    respondOkay,
    respondHelp,
    endCountdown,
    cancelAlarm
  } = useStore();
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [transcriptText, setTranscriptText] = useState("");
  const [speechError, setSpeechError] = useState(null);

  const recognitionRef = useRef(null);

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

  const handleOkay = useCallback(() => {
    window.speechSynthesis.cancel();
    if (recognitionRef.current) recognitionRef.current.abort();
    respondOkay();
    navigate('/nearby');
  }, [respondOkay, navigate]);

  const handleHelp = useCallback(() => {
    window.speechSynthesis.cancel();
    if (recognitionRef.current) recognitionRef.current.abort();
    respondHelp();
    navigate('/emergency');
  }, [respondHelp, navigate]);

  const handleCancel = useCallback(() => {
    window.speechSynthesis.cancel();
    if (recognitionRef.current) recognitionRef.current.abort();
    cancelAlarm();
  }, [cancelAlarm]);

  // Voice Prompt Simulation (Web Speech API)
  useEffect(() => {
    if (crashAlertActive) {
      setTranscriptText("");
      setSpeechError(null);
      setIsListening(false);

      const text = "Possible collision detected. Are you okay? Say I am okay, need help, or cancel.";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognitionRef.current = recognition;
          recognition.continuous = false;
          recognition.interimResults = true;

          recognition.onstart = () => {
            setIsListening(true);
          };

          recognition.onresult = (event) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript.toLowerCase();
            setTranscriptText(transcript);

            if (event.results[current].isFinal) {
              if (transcript.includes('okay') || transcript.includes("i'm ok") || transcript.includes('i am ok')) {
                setTimeout(handleOkay, 800);
              } else if (transcript.includes('help') || transcript.includes('emergency')) {
                setTimeout(handleHelp, 800);
              } else if (transcript.includes('cancel') || transcript.includes('false alarm')) {
                setTimeout(handleCancel, 800);
              }
            }
          };

          recognition.onerror = (event) => {
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
              setSpeechError("Microphone permission denied. Use buttons.");
            } else if (event.error !== 'aborted') {
              setSpeechError(`Voice error: ${event.error}. Use buttons.`);
            }
            setIsListening(false);
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          try {
            recognition.start();
          } catch (e) {
            console.error(e);
            setSpeechError("Speech recognition failed to start.");
          }
        } else {
          setSpeechError("Speech recognition not supported in this browser. Use buttons.");
        }
      };
      window.speechSynthesis.speak(utterance);
    } else {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.abort();
      setIsListening(false);
      setTranscriptText("");
      setSpeechError(null);
    }

    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, [crashAlertActive, handleOkay, handleHelp, handleCancel]);

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
            className="relative bg-slate-900 border border-rose-500/30 rounded-3xl p-8 md:p-12 max-w-2xl w-full shadow-[0_0_100px_-20px_rgba(225,29,72,0.5)] overflow-hidden flex flex-col"
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

              <div className="flex flex-col gap-4 w-full">
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
                <button
                  onClick={handleCancel}
                  className="w-full py-3 md:py-4 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white rounded-2xl font-bold text-md md:text-lg transition-colors flex items-center justify-center gap-2 border border-slate-700/50 hover:border-slate-600"
                >
                  <XCircle className="w-5 h-5" />
                  CANCEL FALSE ALARM
                </button>
              </div>

              <div className="mt-8 flex flex-col items-center gap-3 w-full min-h-[80px]">
                {speechError ? (
                  <div className="flex items-center gap-2 text-amber-400 bg-amber-400/10 px-6 py-3 rounded-2xl text-sm border border-amber-400/20 font-medium w-full justify-center">
                    <MicOff className="w-5 h-5" />
                    {speechError}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400 bg-slate-800/50 px-6 py-4 rounded-2xl w-full border border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <Mic className={`w-5 h-5 ${isListening ? 'text-rose-400 animate-pulse' : ''}`} />
                      <span>{isListening ? 'Listening for voice response...' : (transcriptText ? 'Processing...' : 'Initializing microphone...')}</span>
                    </div>
                    {transcriptText && (
                      <div className="text-white font-medium italic mt-2 text-lg">
                        "{transcriptText}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CrashAlertModal;

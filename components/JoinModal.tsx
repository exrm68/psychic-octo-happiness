import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, ShieldCheck, Zap } from 'lucide-react';

interface JoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: () => void;
}

const JoinModal: React.FC<JoinModalProps> = ({ isOpen, onClose, onJoin }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-[#111] border border-gold/30 w-full max-w-sm rounded-2xl p-6 relative shadow-[0_0_50px_rgba(255,215,0,0.1)]"
        >
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-white"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mb-4 border border-gold/20 animate-pulse-gold">
              <Send size={32} className="text-gold" />
            </div>

            <h2 className="text-xl font-serif font-black text-white mb-2">
              Unlock <span className="text-gold">Premium</span> Access
            </h2>
            
            <p className="text-gray-400 text-xs mb-6 leading-relaxed">
              To watch this content in 4K High Speed, please join our official Telegram channel. It takes only 2 seconds!
            </p>

            <div className="w-full space-y-3">
               <div className="flex items-center gap-3 text-xs text-gray-300 bg-white/5 p-2 rounded-lg">
                  <Zap size={14} className="text-yellow-400" />
                  <span>Super Fast Server Access</span>
               </div>
               <div className="flex items-center gap-3 text-xs text-gray-300 bg-white/5 p-2 rounded-lg">
                  <ShieldCheck size={14} className="text-green-400" />
                  <span>No Ads & Direct Links</span>
               </div>
            </div>

            <button
              onClick={onJoin}
              className="mt-6 w-full bg-gold text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#ffe033] active:scale-95 transition-all shadow-[0_0_20px_rgba(255,215,0,0.3)]"
            >
              <Send size={18} />
              JOIN CHANNEL NOW
            </button>
            
            <button onClick={onClose} className="mt-3 text-[10px] text-gray-500 hover:text-white underline">
              I'm already a member
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default JoinModal;
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Film, User, Shuffle, MessageSquarePlus, ShieldCheck, Settings } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSurprise: () => void;
  onOpenAdmin: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onSurprise, onOpenAdmin }) => {
  
  const handleCommunityClick = () => {
    window.open('https://t.me/cineflixrequestcontent', '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Glassmorphism Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-[280px] bg-[#0a0a0a]/95 backdrop-blur-2xl border-l border-white/10 z-[60] flex flex-col shadow-2xl"
          >
            {/* Header: User Profile */}
            <div className="p-6 pt-10 pb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2" />
                
                <div className="flex justify-between items-start relative z-10">
                   <div className="flex items-center gap-3">
                       <div className="w-12 h-12 rounded-full border-2 border-gold p-0.5">
                           <div className="w-full h-full rounded-full bg-gradient-to-tr from-gray-800 to-black flex items-center justify-center">
                               <User size={20} className="text-white" />
                           </div>
                       </div>
                       <div>
                           <h3 className="text-white font-bold text-sm">Guest Viewer</h3>
                           <span className="text-[10px] bg-gold/20 text-gold px-2 py-0.5 rounded border border-gold/20 font-bold uppercase tracking-wider">
                               VIP Access
                           </span>
                       </div>
                   </div>
                   <button onClick={onClose} className="bg-white/5 p-2 rounded-full text-gray-400 hover:text-white transition-colors">
                       <X size={18} />
                   </button>
                </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto px-4 space-y-2">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 mb-2">Actions</p>

                {/* Surprise Me Feature */}
                <button
                  onClick={() => { onSurprise(); onClose(); }}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20 text-purple-200 hover:border-purple-500/40 transition-all group"
                >
                  <Shuffle size={18} className="group-hover:rotate-180 transition-transform duration-500" /> 
                  <span>Surprise Me</span>
                </button>

                 <button
                  onClick={handleCommunityClick}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl text-gray-400 hover:bg-white/5 hover:text-gold transition-all duration-200"
                >
                  <MessageSquarePlus size={18} /> Request Content
                </button>
                
                {/* Admin Access */}
                <button
                  onClick={() => { onOpenAdmin(); onClose(); }}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl text-gray-400 hover:bg-white/5 hover:text-red-400 transition-all duration-200"
                >
                  <Settings size={18} /> Admin Panel
                </button>

                <div className="my-4 border-t border-white/5" />
                
                <div className="bg-[#111] p-4 rounded-xl border border-white/5">
                    <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                        <ShieldCheck size={14} className="text-green-500" /> Secure Streaming
                    </h4>
                    <p className="text-[10px] text-gray-500">
                        You are using the latest version of Cineflix Universe. All content is streamed securely via Telegram.
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5">
                <button 
                    onClick={() => window.open('https://t.me/your_channel', '_blank')}
                    className="w-full bg-[#111] border border-white/10 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#1a1a1a] transition-colors"
                >
                    <Send size={14} /> Join Channel
                </button>
                <div className="text-center mt-4 flex items-center justify-center gap-2 opacity-30">
                     <Film size={12} />
                     <span className="text-[9px] tracking-[0.2em] font-serif">CINEFLIX PRO</span>
                </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
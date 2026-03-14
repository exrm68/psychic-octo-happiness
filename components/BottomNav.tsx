import React from 'react';
import { Home, Search, Heart, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BottomNavProps {
  activeTab: string;
  isVisible: boolean;
  onTabChange: (tab: 'home' | 'search' | 'favorites' | 'profile') => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, isVisible, onTabChange }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
          <motion.div 
            initial={{ y: 100, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20, stiffness: 400, mass: 0.8 }}
            className="bg-[#0f0f0f]/80 backdrop-blur-2xl border border-white/10 rounded-full px-8 py-3.5 flex items-center gap-8 shadow-[0_20px_40px_rgba(0,0,0,0.6)] pointer-events-auto"
          >
            <button 
              onClick={() => onTabChange('home')}
              className={`relative flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'home' ? 'text-gold scale-110 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]' : 'text-gray-500 hover:text-white'}`}
            >
              <Home size={22} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
              {activeTab === 'home' && (
                <motion.div layoutId="nav-dot" className="absolute -bottom-2 w-1 h-1 bg-gold rounded-full shadow-[0_0_5px_#FFD700]" />
              )}
            </button>

            <button 
              onClick={() => onTabChange('search')}
              className={`relative flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'search' ? 'text-gold scale-110 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]' : 'text-gray-500 hover:text-white'}`}
            >
              <Search size={22} strokeWidth={activeTab === 'search' ? 2.5 : 2} />
              {activeTab === 'search' && (
                <motion.div layoutId="nav-dot" className="absolute -bottom-2 w-1 h-1 bg-gold rounded-full shadow-[0_0_5px_#FFD700]" />
              )}
            </button>

            <button 
              onClick={() => onTabChange('favorites')}
              className={`relative flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'favorites' ? 'text-gold scale-110 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]' : 'text-gray-500 hover:text-white'}`}
            >
              <Heart size={22} strokeWidth={activeTab === 'favorites' ? 2.5 : 2} />
              {activeTab === 'favorites' && (
                <motion.div layoutId="nav-dot" className="absolute -bottom-2 w-1 h-1 bg-gold rounded-full shadow-[0_0_5px_#FFD700]" />
              )}
            </button>

            <button 
              onClick={() => onTabChange('profile')}
              className={`relative flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'profile' ? 'text-gold scale-110 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]' : 'text-gray-500 hover:text-white'}`}
            >
              <User size={22} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
              {activeTab === 'profile' && (
                <motion.div layoutId="nav-dot" className="absolute -bottom-2 w-1 h-1 bg-gold rounded-full shadow-[0_0_5px_#FFD700]" />
              )}
            </button>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BottomNav;
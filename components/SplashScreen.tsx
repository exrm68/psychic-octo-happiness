import React from 'react';
import { motion } from 'framer-motion';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center font-brand overflow-hidden">
      
      {/* Background Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#111] to-black" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gold/10 rounded-full blur-[80px] animate-pulse" />

      {/* Logo Animation */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <h1 className="text-6xl md:text-8xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#ffd700] via-[#fff] to-[#ffd700] drop-shadow-[0_0_25px_rgba(255,215,0,0.4)]">
          CINEFLIX
        </h1>
        
        <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.5, duration: 1.5 }}
            className="h-0.5 bg-gold mt-2 shadow-[0_0_10px_#FFD700]"
        />
        
        <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="text-gray-400 text-[10px] tracking-[0.5em] mt-4 uppercase font-sans font-bold"
        >
            Universe Pro 2026
        </motion.p>
      </motion.div>

      {/* Bottom Loader */}
      <div className="absolute bottom-10">
         <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                    className="w-2 h-2 bg-gold rounded-full"
                />
            ))}
         </div>
      </div>
    </div>
  );
};

export default SplashScreen;
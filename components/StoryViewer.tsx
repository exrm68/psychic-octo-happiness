import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Play, Heart, Clock } from 'lucide-react';
import { Movie } from '../types';

interface StoryViewerProps {
  movie: Movie;
  onClose: () => void;
  onNavigateToMovie: (movie: Movie) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ movie, onClose, onNavigateToMovie, isFavorite, onToggleFavorite }) => {
  const [progress, setProgress] = useState(0);
  const [timeAgo, setTimeAgo] = useState('2h');

  // Auto-close logic
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          onClose(); 
          return 100;
        }
        return prev + 0.5;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onClose]);

  // Simulate "Live" 24h cycle
  useEffect(() => {
    // Generate a random "hours ago" based on current time to mimic a 24h cycle
    const currentHour = new Date().getHours();
    const fakeHoursAgo = Math.max(1, currentHour % 12); 
    setTimeAgo(`${fakeHoursAgo}h`);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      className="fixed inset-0 z-[60] bg-black flex flex-col font-sans"
    >
      {/* Story Content */}
      <div className="relative flex-1 overflow-hidden">
         <motion.img 
            src={movie.thumbnail} 
            alt="Story"
            className="w-full h-full object-cover"
            initial={{ scale: 1 }}
            animate={{ scale: 1.05 }}
            transition={{ duration: 10, ease: "linear" }}
         />
         
         {/* Vignette */}
         <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />

         {/* Header Controls */}
         <div className="absolute top-0 left-0 right-0 p-4 z-20 pt-8">
            {/* Progress Bars */}
            <div className="flex gap-1 mb-4">
               <div className="h-0.5 bg-white/20 flex-1 rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all duration-100 ease-linear shadow-[0_0_10px_white]" style={{ width: `${progress}%` }} />
               </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full border border-gold/50 p-0.5 bg-black/40 backdrop-blur">
                        <img src={movie.thumbnail} className="w-full h-full rounded-full object-cover" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-white drop-shadow-md tracking-wide">{movie.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-gray-200 font-medium opacity-90">{timeAgo} ago</span>
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                            <div className="flex items-center gap-1 bg-red-600/20 px-1.5 rounded border border-red-500/30">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                <span className="text-[9px] text-red-200 font-bold tracking-wider">LIVE</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} className="text-white drop-shadow-md" />
                    </button>
                </div>
            </div>
         </div>

         {/* Center Tap Area (Invisible) */}
         <div className="absolute inset-y-20 inset-x-0 z-10 flex">
             <div className="w-1/3 h-full" onClick={() => setProgress(0)} />
             <div className="w-1/3 h-full" onClick={() => {}} /> 
             <div className="w-1/3 h-full" onClick={() => setProgress(100)} />
         </div>

         {/* Footer Actions */}
         <div className="absolute bottom-0 left-0 right-0 p-6 z-20 pb-10 flex flex-col gap-6">
            <div className="flex flex-col items-center text-center space-y-3">
                 <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                    <Clock size={10} className="text-gold" />
                    <span className="text-gray-300 text-[10px] font-bold uppercase tracking-wide">
                        Story expires in {24 - parseInt(timeAgo)}h
                    </span>
                 </div>
                 
                 <p className="text-white text-lg font-serif font-bold leading-tight max-w-[85%] drop-shadow-xl">
                    Experience the thrill before it's gone.
                 </p>
            </div>

            <button 
                onClick={() => {
                    onClose();
                    onNavigateToMovie(movie);
                }}
                className="w-full bg-white text-black font-extrabold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-95"
            >
                <Play size={18} fill="black" />
                WATCH FULL MOVIE
            </button>
            
            <div className="flex justify-center items-center px-6">
                 {/* Heart Action */}
                <button 
                    onClick={() => onToggleFavorite(movie.id)}
                    className="group transition-transform active:scale-75 bg-white/10 p-3 rounded-full backdrop-blur-md border border-white/10 hover:bg-white/20"
                >
                    <Heart 
                        size={24} 
                        className={`stroke-[2px] transition-colors duration-300 ${isFavorite ? 'fill-red-500 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'text-white group-hover:text-red-400'}`} 
                    />
                </button>
            </div>
         </div>
      </div>
    </motion.div>
  );
};

export default StoryViewer;
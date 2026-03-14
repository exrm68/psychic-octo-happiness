import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { Movie } from '../types';

interface ContinueWatchingCardProps {
  movie: Movie;
  onClick: (movie: Movie) => void;
}

const ContinueWatchingCard: React.FC<ContinueWatchingCardProps> = ({ movie, onClick }) => {
  // Simulate a random progress bar width for visual effect
  const randomProgress = React.useMemo(() => Math.floor(Math.random() * (90 - 20 + 1)) + 20, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(movie)}
      className="relative shrink-0 w-[115px] md:w-[150px] aspect-video rounded-xl overflow-hidden cursor-pointer border border-white/10 group"
    >
      <img 
        src={movie.thumbnail} 
        alt={movie.title} 
        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
            <Play size={12} fill="white" className="ml-0.5 text-white" />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
        <div 
            className="h-full bg-gold shadow-[0_0_10px_rgba(255,215,0,0.5)]" 
            style={{ width: `${randomProgress}%` }}
        />
      </div>

      <div className="absolute bottom-2 left-2 right-2">
         <h4 className="text-[10px] font-bold text-white truncate drop-shadow-md">{movie.title}</h4>
      </div>
    </motion.div>
  );
};

export default ContinueWatchingCard;
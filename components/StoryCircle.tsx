import React from 'react';
import { motion } from 'framer-motion';
import { Movie } from '../types';

interface StoryCircleProps {
  movie: Movie;
  onClick: (movie: Movie) => void;
  index: number;
  storyBadge?: string; // from Firestore story doc
}

// Badge color/style based on type
const getBadgeStyle = (badge: string): string => {
  const b = badge.toUpperCase();
  if (b === 'HOT') return 'bg-gradient-to-r from-red-600 to-orange-500 text-white border-red-700';
  if (b === 'NEW') return 'bg-gradient-to-r from-emerald-500 to-green-400 text-white border-emerald-700';
  if (b === 'TOP') return 'bg-gradient-to-r from-gold to-yellow-400 text-black border-yellow-600';
  if (b === 'LIVE') return 'bg-gradient-to-r from-red-500 to-red-400 text-white border-red-700 animate-pulse';
  if (b.startsWith('#')) return 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white border-purple-700';
  return 'bg-gradient-to-r from-gold to-yellow-400 text-black border-yellow-600';
};

const StoryCircle: React.FC<StoryCircleProps> = ({ movie, onClick, index, storyBadge }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08 }}
      className="flex flex-col items-center gap-2 cursor-pointer group shrink-0"
      onClick={() => onClick(movie)}
    >
      {/* Gradient Ring Container */}
      <div className="relative w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-b from-[#ff0055] via-[#ff0055] to-gold group-hover:scale-105 transition-transform duration-300 shadow-[0_4px_14px_rgba(255,0,85,0.35)]">
        {/* Inner black border */}
        <div className="w-full h-full rounded-full bg-black p-[2.5px] overflow-hidden relative">
          <img
            src={movie.thumbnail}
            alt={movie.title}
            className="w-full h-full rounded-full object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity"
          />
          {/* Depth overlay */}
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors rounded-full" />
        </div>

        {/* Admin-controlled badge — only show if storyBadge is set */}
        {storyBadge && storyBadge.trim() !== '' && (
          <div
            className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[7px] font-black px-1.5 py-0.5 rounded-full border shadow-md whitespace-nowrap ${getBadgeStyle(storyBadge)}`}
            style={{ minWidth: '24px', textAlign: 'center' }}
          >
            {storyBadge.toUpperCase()}
          </div>
        )}
      </div>

      <span className="text-[9px] text-gray-300 w-14 truncate text-center font-medium group-hover:text-white transition-colors">
        {movie.title.split(' ')[0]}
      </span>
    </motion.div>
  );
};

export default StoryCircle;

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Play, Star, Heart } from 'lucide-react';
import { Movie } from '../types';

interface WatchlistProps {
  movies: Movie[];
  onRemove: (id: string) => void;
  onClick: (movie: Movie) => void;
}

const Watchlist: React.FC<WatchlistProps> = ({ movies, onRemove, onClick }) => {
  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
          <Heart size={32} className="text-gray-600" />
        </div>
        <h3 className="text-xl font-serif font-bold text-white mb-2">Your List is Empty</h3>
        <p className="text-gray-500 text-xs max-w-xs">
          Tap the heart icon on any movie to add it here for quick access later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">❤️</span>
          <h2 className="text-2xl font-serif font-bold text-white">My Collection</h2>
          <span className="text-xs font-bold text-gray-500 bg-white/10 px-2 py-0.5 rounded-full ml-auto">
            {movies.length} Items
          </span>
      </div>

      <AnimatePresence mode="popLayout">
        {movies.map((movie) => (
          <motion.div
            key={movie.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex gap-4 p-3 rounded-2xl bg-[#111] border border-white/5 shadow-lg group"
          >
            {/* Thumbnail */}
            <div 
                className="w-24 h-32 shrink-0 rounded-xl overflow-hidden relative cursor-pointer"
                onClick={() => onClick(movie)}
            >
                <img src={movie.thumbnail} alt={movie.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play fill="white" size={20} className="text-white" />
                </div>
            </div>

            {/* Info */}
            <div className="flex-1 py-1 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-white leading-tight mb-1 line-clamp-2" onClick={() => onClick(movie)}>
                            {movie.title}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] bg-gold text-black px-1.5 rounded font-bold">{movie.rating}</span>
                        <span className="text-[10px] text-gray-400">{movie.category}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                        {movie.description}
                    </p>
                </div>

                <div className="flex justify-end mt-2">
                    <button 
                        onClick={() => onRemove(movie.id)}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 active:scale-95 transition-transform"
                    >
                        <Trash2 size={12} /> Remove
                    </button>
                </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Watchlist;
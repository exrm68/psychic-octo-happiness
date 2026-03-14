import React, { useState } from 'react';
import { Search, X, ChevronLeft, Film } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Movie } from '../types';
import MovieTile from './MovieTile';

interface ExploreProps {
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onBack: () => void;
}

const Explore: React.FC<ExploreProps> = ({ movies, onMovieClick, favorites, onToggleFavorite, onBack }) => {
  const [query, setQuery] = useState('');
  
  // Suggestion Logic: Search by title, category, and year
  const filteredSuggestions = query 
    ? movies.filter(m => 
        m.title.toLowerCase().includes(query.toLowerCase()) ||
        m.category.toLowerCase().includes(query.toLowerCase()) ||
        (m.year && m.year.includes(query))
      ).slice(0, 8)
    : [];

  const handleSuggestionClick = (movie: Movie) => {
    // Directly open the movie details
    onMovieClick(movie);
  };

  return (
    <div className="pb-24 pt-4 min-h-screen bg-black">
       
       {/* Float Up Search Bar Container */}
       <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl pt-2 pb-4 -mx-4 px-4 border-b border-white/5 shadow-2xl">
           <div className="flex items-center gap-3">
               {/* Back Button */}
               <button 
                 onClick={onBack}
                 className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-all border border-white/10 text-white z-50"
               >
                   <ChevronLeft size={24} />
               </button>

               <motion.div 
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ type: "spring", stiffness: 300, damping: 25 }}
                 className="relative flex-1"
               >
                 <input 
                    type="text" 
                    placeholder="Search movies..." 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                    className="w-full bg-[#1a1a1a] text-white p-3.5 pl-10 pr-10 rounded-2xl border border-white/10 outline-none focus:border-gold/50 focus:bg-[#222] transition-all text-sm font-medium placeholder-gray-500 shadow-xl"
                 />
                 <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${query ? 'text-gold' : 'text-gray-400'}`} size={18} />
                 
                 {query && (
                     <button 
                        onClick={() => setQuery('')} 
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                     >
                         <X size={16} />
                     </button>
                 )}
               </motion.div>
           </div>
       </div>

       {/* Suggestions List (Only visible when typing) */}
       <AnimatePresence>
         {query && (
           <motion.div 
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             className="px-2 mt-4 space-y-2"
           >
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-2">Suggestions</h3>
              
              {filteredSuggestions.length > 0 ? (
                  filteredSuggestions.map((movie) => (
                      <motion.div
                        key={movie.id}
                        layoutId={`movie-${movie.id}`}
                        onClick={() => handleSuggestionClick(movie)}
                        className="flex items-center gap-4 p-3 rounded-xl bg-[#111] border border-white/5 active:scale-[0.98] transition-all cursor-pointer hover:bg-[#1a1a1a] hover:border-gold/20 group"
                      >
                          <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0">
                              <img src={movie.thumbnail} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                              <h4 className="text-sm font-bold text-white group-hover:text-gold transition-colors">{movie.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] bg-white/10 px-1.5 rounded text-gray-400">{movie.category}</span>
                                  <span className="text-[10px] text-gray-500 flex items-center gap-1"><Film size={10}/> {movie.year || '2024'}</span>
                              </div>
                          </div>
                          <ChevronLeft size={16} className="rotate-180 text-gray-600 group-hover:text-gold" />
                      </motion.div>
                  ))
              ) : (
                  <div className="text-center py-10 text-gray-500 text-xs">
                     No matches found for "{query}"
                  </div>
              )}
           </motion.div>
         )}
       </AnimatePresence>

       {/* Empty State (When not typing) - NO Random Recs */}
       {!query && (
           <div className="flex flex-col items-center justify-center pt-20 opacity-30">
               <Search size={48} className="mb-4" />
               <p className="text-sm font-medium">Type to search...</p>
           </div>
       )}
    </div>
  );
};

export default Explore;
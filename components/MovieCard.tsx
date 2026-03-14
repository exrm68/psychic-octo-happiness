import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Bookmark } from 'lucide-react';
import { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClick: (movie: Movie) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, isFavorite, onToggleFavorite, onClick }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.28 }}
      onClick={() => onClick(movie)}
      className="card-lift"
      style={{
        position: 'relative',
        aspectRatio: '2/3',
        borderRadius: '12px',
        overflow: 'hidden',
        background: '#111114',
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
      }}
    >
      {/* POSTER */}
      <img
        src={movie.thumbnail}
        alt={movie.title}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          objectPosition: 'center top',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
      />
      {!loaded && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, #1c1c20 0%, #111114 100%)',
        }} />
      )}

      {/* GRADIENT — সিনেমার নিচ ভালো দেখা যাবে, উপর clear */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 28%, rgba(0,0,0,0.08) 50%, transparent 68%)',
        zIndex: 1,
      }} />

      {/* TOP ICONS — ছোট, ghost */}
      <div style={{
        position: 'absolute', top: 7, left: 7, right: 7,
        display: 'flex', justifyContent: 'space-between',
        zIndex: 10,
      }}>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(movie.id); }}
          style={{
            width: 24, height: 24, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isFavorite ? 'rgba(239,68,68,0.85)' : 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(8px)',
            border: 'none', cursor: 'pointer',
          }}
        >
          <Heart size={10} style={{ color: '#fff', fill: isFavorite ? '#fff' : 'none' }} />
        </button>
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(8px)',
        }}>
          <Bookmark size={10} style={{ color: isFavorite ? '#FFD700' : 'rgba(255,255,255,0.65)', fill: isFavorite ? '#FFD700' : 'none' }} />
        </div>
      </div>

      {/* UPCOMING BADGE only — EXCL badge card এ নেই, শুধু detail page এ */}
      {movie.isUpcoming && (
        <div style={{ position: 'absolute', left: 0, bottom: 55, zIndex: 10 }}>
          <div style={{
            background: 'linear-gradient(90deg, #6D28D9, #A78BFA)',
            borderRadius: '0 10px 10px 0',
            padding: '3px 8px 3px 6px',
          }}>
            <span style={{ fontSize: '8px', fontWeight: 800, color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase' }}>SOON</span>
          </div>
        </div>
      )}

      {/* BOTTOM INFO */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '8px 9px 10px',
        zIndex: 10,
      }}>
        <h3 style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: '13px', fontWeight: 700,
          color: '#ffffff',
          lineHeight: '1.22',
          marginBottom: '4px',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          textShadow: '0 1px 8px rgba(0,0,0,0.95)',
          letterSpacing: '-0.01em',
        }}>
          {movie.title}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: '#FFD700', fontSize: '9.5px' }}>★</span>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '10px', fontWeight: 700, color: '#fff' }}>{movie.rating}</span>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '8px', margin: '0 1px' }}>•</span>
          <span style={{
            fontFamily: "'DM Sans',sans-serif",
            fontSize: '9px', color: 'rgba(255,255,255,0.45)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '62%',
          }}>
            {movie.category === 'Korean Drama' ? 'K-Drama' : movie.category}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default MovieCard;

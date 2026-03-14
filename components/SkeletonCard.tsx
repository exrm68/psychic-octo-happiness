import React from 'react';

const SkeletonCard: React.FC = () => {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-card border border-white/5 h-[240px] animate-pulse">
      <div className="w-full h-full bg-gray-900/50" />
      <div className="absolute bottom-0 w-full p-3 space-y-2 bg-gradient-to-t from-black to-transparent">
        <div className="h-3 bg-white/10 rounded w-3/4 mx-auto" />
        <div className="h-2 bg-white/10 rounded w-1/2 mx-auto" />
      </div>
    </div>
  );
};

export default SkeletonCard;
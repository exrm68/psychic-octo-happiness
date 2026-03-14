import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Zap, Send, Sparkles, TrendingUp, Award, Play, Film, Tv, Heart, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, doc, query, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';

import { Movie, Category, AppSettings, BannerItem, StoryItem } from './types';
import { CATEGORIES, BOT_USERNAME } from './constants';

import MovieTile from './components/MovieTile';
import Sidebar from './components/Sidebar';
import MovieDetails from './components/MovieDetails';
import Banner from './components/Banner';
import StoryCircle from './components/StoryCircle';
import TrendingRow from './components/TrendingRow';
import StoryViewer from './components/StoryViewer';
import BottomNav from './components/BottomNav';
import Explore from './components/Explore';
import Watchlist from './components/Watchlist';
import NoticeBar from './components/NoticeBar';
import SplashScreen from './components/SplashScreen';
import AdminPanel from './components/AdminPanel';
import ContinueWatchingCard from './components/ContinueWatchingCard';
import UserProfile from './components/UserProfile';

type Tab = 'home' | 'search' | 'favorites' | 'profile';

const App: React.FC = () => {
  // Loading State
  const [isLoading, setIsLoading] = useState(true);

  // State
  const [movies, setMovies] = useState<Movie[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [continueWatching, setContinueWatching] = useState<Array<{movieId: string, timestamp: number}>>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings>({
      botUsername: BOT_USERNAME,
      channelLink: 'https://t.me/cineflixrequestcontent'
  });
  
  // Banner & Stories from Firestore
  const [bannerItems, setBannerItems] = useState<BannerItem[]>([]);
  const [storyItems, setStoryItems] = useState<StoryItem[]>([]);
  
  // Navigation & Scroll State
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Admin Panel State
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Category State
  const [activeCategory, setActiveCategory] = useState<Category>('All');

  // Story State
  const [viewingStory, setViewingStory] = useState<Movie | null>(null);
  
  // Banner State
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Secret Admin Access Handler
  const handleLogoTap = () => {
    setTapCount(prev => prev + 1);
    
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    
    tapTimeoutRef.current = setTimeout(() => {
      setTapCount(0);
    }, 2000);
  };

  // Check for admin access (5-7 taps)
  useEffect(() => {
    if (tapCount >= 5 && tapCount <= 7) {
      setIsAdminOpen(true);
      setTapCount(0);
    }
  }, [tapCount]);

  // Initialize & Fetch Data
  useEffect(() => {
    // 1. Fetch ALL Movies — orderBy বাদ দিয়ে, যাতে createdAt নেই সেগুলোও আসে
    const q = collection(db, 'movies');
    
    const unsubscribeMovies = onSnapshot(q, (snapshot) => {
      const fetchedMovies = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as Movie[];
      
      // Duplicate fix
      const uniqueMap = new Map<string, Movie>();
      fetchedMovies.forEach(m => uniqueMap.set(m.id, m));
      let uniqueMovies = Array.from(uniqueMap.values());
      
      // Sort locally — createdAt আছে সেগুলো আগে, না থাকলে শেষে
      uniqueMovies.sort((a: any, b: any) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      
      setMovies(uniqueMovies);
    }, (error) => {
      console.warn("Firestore access failed:", error);
      setMovies([]);
    });

    // 2. Fetch Settings from Firestore
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'config'), (doc) => {
        if (doc.exists()) {
            const data = doc.data() as AppSettings;
            setAppSettings(data);

            // ✅ Dynamic Ad SDK Injection (Monetag OR Adsgram — never both)
            const existingMonetag = document.getElementById('monetag-ad-script');
            if (existingMonetag) existingMonetag.remove();
            const existingAdsgram = document.getElementById('adsgram-sdk-script');
            if (existingAdsgram) existingAdsgram.remove();

            const useAdsgram = !!(data.adEnabled && data.adsgramEnabled && data.adsgramBlockId);

            if (useAdsgram) {
              // ── Adsgram SDK ──────────────────────────────────────
              const script = document.createElement('script');
              script.id = 'adsgram-sdk-script';
              script.src = 'https://sad.adsgram.ai/js/sad.min.js';
              script.async = true;
              script.onload = () => {
                console.log('✅ Adsgram SDK loaded, blockId:', data.adsgramBlockId);
              };
              script.onerror = () => {
                console.warn('❌ Adsgram SDK failed to load');
              };
              document.head.appendChild(script);
            } else if (data.adEnabled && data.adZoneId) {
              // ── Monetag SDK ──────────────────────────────────────
              const script = document.createElement('script');
              script.id = 'monetag-ad-script';
              script.src = data.adScriptUrl || '//libtl.com/sdk.js';
              script.setAttribute('data-zone', data.adZoneId);
              script.setAttribute('data-sdk', `show_${data.adZoneId}`);
              script.async = true;
              script.onload = () => {
                console.log('✅ Monetag SDK loaded, zone:', data.adZoneId);
              };
              script.onerror = () => {
                console.warn('❌ Monetag SDK failed to load');
              };
              document.head.appendChild(script);
            }
        }
    }, (error) => {
       console.warn("Settings fetch failed:", error);
    });

    // 3. Fetch Banners from Firestore (Admin থেকে যোগ করা banners)
    const bannerQ = query(collection(db, 'banners'), orderBy('order', 'asc'));
    const unsubscribeBanners = onSnapshot(bannerQ, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BannerItem[];
      setBannerItems(items.filter(b => b.isActive));
    }, () => {});

    // 4. Fetch Stories from Firestore (Admin থেকে যোগ করা stories)
    const storyQ = query(collection(db, 'stories'), orderBy('order', 'asc'));
    const unsubscribeStories = onSnapshot(storyQ, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StoryItem[];
      setStoryItems(items);
    }, () => {});

    // 5. Handle Splash Screen - max 1.5s wait, then always show app
    const timer = setTimeout(() => {
        setIsLoading(false);
    }, 1500);

    // Hard failsafe - force show after 3s no matter what
    const hardTimer = setTimeout(() => {
        setIsLoading(false);
    }, 3000);

    // 6. Load Favorites & Continue Watching
    const savedFavs = localStorage.getItem('cine_favs');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    
    const savedContinue = localStorage.getItem('cine_continue');
    if (savedContinue) setContinueWatching(JSON.parse(savedContinue));

    // 7. Telegram Config
    // @ts-ignore
    if (window.Telegram?.WebApp) {
        // @ts-ignore
        window.Telegram.WebApp.expand();
        // @ts-ignore
        window.Telegram.WebApp.setHeaderColor('#000000');
        // @ts-ignore
        window.Telegram.WebApp.setBackgroundColor('#000000');
    }

    return () => {
      clearTimeout(timer);
      clearTimeout(hardTimer);
      unsubscribeMovies();
      unsubscribeSettings();
      unsubscribeBanners();
      unsubscribeStories();
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    };
  }, []);

  // Scroll Handling for Bottom Nav
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Always show at top
      if (currentScrollY < 50) {
        setIsNavVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Hide on scroll down, Show on scroll up
      if (currentScrollY > lastScrollY.current + 20) {
        setIsNavVisible(false);
      } else if (currentScrollY < lastScrollY.current - 20) {
        setIsNavVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Logic
  const handleMovieClick = (movie: Movie) => {
      // ✅ Add to continue watching
      addToContinueWatching(movie.id);
      setSelectedMovie(movie);
      // ✅ Complete referral on first video click
      if ((window as any).completeCinelixReferral) {
        (window as any).completeCinelixReferral();
      }
  };

  const handleStoryClick = (movie: Movie) => {
      setViewingStory(movie);
  };

  const handleSurpriseMe = () => {
      if (movies.length === 0) return;
      const randomMovie = movies[Math.floor(Math.random() * movies.length)];
      setSelectedMovie(randomMovie);
      // @ts-ignore
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
  };

  const toggleFavorite = (id: string) => {
    const newFavs = favorites.includes(id)
      ? favorites.filter((favId) => favId !== id)
      : [...favorites, id];
    
    setFavorites(newFavs);
    localStorage.setItem('cine_favs', JSON.stringify(newFavs));
    
    // @ts-ignore
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
  };

  // ✅ NEW: Add to continue watching
  const addToContinueWatching = (movieId: string) => {
    const updated = [
      { movieId, timestamp: Date.now() },
      ...continueWatching.filter(item => item.movieId !== movieId)
    ].slice(0, 10); // Keep only latest 10
    
    setContinueWatching(updated);
    localStorage.setItem('cine_continue', JSON.stringify(updated));
  };

  // Banner Logic - Admin থেকে banners collection প্রথমে চেক করে
  // যদি banners থাকে, ওটা ব্যবহার করবে; না থাকলে movies থেকে featured দেখাবে
  const bannerMovies = useMemo(() => {
    if (bannerItems.length > 0) {
      // bannerItems থেকে movieId দিয়ে movie object খুঁজে নাও
      return bannerItems
        .map(b => {
          const movie = movies.find(m => m.id === b.movieId);
          if (!movie) return null;
          // ✅ Custom banner image support: যদি BannerItem এ custom image থাকে, সেটা use করো
          return {
            ...movie,
            bannerThumbnail: b.image || movie.thumbnail // BannerItem এর image অথবা movie এর thumbnail
          };
        })
        .filter(Boolean) as Movie[];
    }
    // Fallback: Exclusive category বা high rating
    return movies.filter(m => m.category === 'Exclusive' || m.rating > 8.5).slice(0, 5);
  }, [bannerItems, movies]);

  // Top 10 Logic - isTop10 flag দিয়ে filter করে
  const top10Movies = useMemo(() => {
    const withFlag = movies
      .filter(m => m.isTop10)
      .sort((a, b) => (a.top10Position || 10) - (b.top10Position || 10));
    
    // যদি কোনো top10 flag না থাকে, rating দিয়ে fallback
    if (withFlag.length === 0) {
      return [...movies].sort((a, b) => b.rating - a.rating).slice(0, 10);
    }
    return withFlag;
  }, [movies]);

  // Stories Logic - Firestore stories collection থেকে (with badge support)
  const storyMoviesWithBadge = useMemo(() => {
    if (storyItems.length > 0) {
      return storyItems
        .map(s => {
          const movie = movies.find(m => m.id === s.movieId);
          if (!movie) return null;
          return { movie, storyBadge: s.storyBadge || '' };
        })
        .filter(Boolean) as { movie: Movie; storyBadge: string }[];
    }
    // Fallback: latest 4 movies, no badge
    return movies.slice(0, 4).map(movie => ({ movie, storyBadge: '' }));
  }, [storyItems, movies]);

  // backward compat
  const storyMovies = storyMoviesWithBadge.map(s => s.movie);

  const featuredMovies = bannerMovies; // backward compat

  useEffect(() => {
    if (featuredMovies.length === 0) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % featuredMovies.length);
    }, 6000); 
    return () => clearInterval(interval);
  }, [featuredMovies]);

  // ✅ Filter Logic - movies state বদলালে auto update হবে
  const displayedMovies = useMemo(() => {
    if (!movies || movies.length === 0) return [];
    
    let filtered = [...movies]; // always fresh copy
    
    if (activeCategory === 'All') {
      return filtered.slice(0, 30);
    } else if (activeCategory === 'Exclusive') {
      // Exclusive category OR isExclusive badge ওয়ালা সব দেখাবে
      return filtered.filter(m => 
        m.category === 'Exclusive' || m.isExclusive === true
      );
    } else if (activeCategory === 'Movies') {
      // শুধু Movies category এর single movies (episodes নেই)
      return filtered.filter(m => 
        m.category === 'Movies' || (m.category === 'Exclusive' && !m.episodes?.length)
      );
    } else if (activeCategory === 'Web Series') {
      // Web Series category OR episodes আছে এমন content
      return filtered.filter(m => 
        m.category === 'Web Series' || (m.episodes && m.episodes.length > 0)
      );
    } else if (activeCategory === 'K-Drama') {
      // K-Drama category OR Korean Drama (legacy support)
      return filtered.filter(m => 
        m.category === 'K-Drama' || m.category === 'Korean Drama'
      );
    } else {
      // Anime এবং অন্যান্য - exact category match
      return filtered.filter(m => m.category === activeCategory);
    }
  }, [movies, activeCategory]);

  const favMovies = useMemo(() => movies.filter(m => favorites.includes(m.id)), [movies, favorites]);

  // ✅ Continue Watching Movies
  const continueWatchingMovies = useMemo(() => {
      return continueWatching
        .map(item => movies.find(m => m.id === item.movieId))
        .filter((m): m is Movie => m !== undefined)
        .slice(0, 5);
  }, [continueWatching, movies]);

  // --- RENDER ---

  if (isLoading) {
      return <SplashScreen />;
  }

  return (
    <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 0.5 }}
        className="min-h-screen text-white font-sans selection:bg-gold selection:text-black pb-24" style={{background:"#0d0d10"}}
    >
      
      {/* --- HEADER --- */}
      {activeTab === 'home' && (
        <header className={`fixed top-0 inset-x-0 z-50 px-4 py-4 flex justify-between items-center transition-all duration-300 ${!isNavVisible ? 'bg-black/80 backdrop-blur-xl border-b border-white/5 py-3 shadow-lg' : 'bg-gradient-to-b from-black/90 to-transparent'}`}>
            {/* Logo - Secret Admin Access */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="font-brand text-4xl tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-gold via-[#fff] to-gold cursor-pointer drop-shadow-[0_2px_10px_rgba(255,215,0,0.3)] select-none"
              onClick={handleLogoTap}
            >
              CINEFLIX
            </motion.div>

            {/* Right Icons */}
            <div className="flex items-center gap-3">
                <button 
                  onClick={() => window.open(appSettings.channelLink || 'https://t.me/cineflixrequestcontent', '_blank')}
                  className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 active:scale-95 transition-all text-white hover:bg-[#0088cc] hover:border-[#0088cc]"
                >
                    <Send size={18} className="-ml-0.5 mt-0.5" />
                </button>

                <button 
                  onClick={handleSurpriseMe}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/10 to-purple-500/10 backdrop-blur-md flex items-center justify-center border border-gold/20 active:scale-95 transition-all text-gold animate-pulse-gold"
                >
                    <Sparkles size={18} />
                </button>
            </div>
        </header>
      )}

      {/* --- BANNER (FULL WIDTH) --- */}
      {activeTab === 'home' && featuredMovies.length > 0 && (
          <div className="relative z-0">
             <Banner 
                movie={featuredMovies[currentBannerIndex]} 
                onClick={handleMovieClick}
                onPlay={handleMovieClick}
                currentIndex={currentBannerIndex}
                totalBanners={featuredMovies.length}
                onDotClick={setCurrentBannerIndex}
             />
          </div>
      )}

      {/* --- CONTENT AREA --- */}
      <main className={`px-4 max-w-7xl mx-auto relative z-10 ${activeTab === 'home' ? '-mt-2' : 'pt-20'}`}>
        
        {/* HOME VIEW */}
        {activeTab === 'home' && (
            <>  
                {/* 1. Top 10 Trending - First (heading removed for cleaner look) */}
                <div className="mb-6">
                  <TrendingRow movies={top10Movies} onClick={handleMovieClick} />
                </div>

                {/* 2. Continue Watching - Below Top 10 */}
                {continueWatchingMovies.length > 0 && (
                  <div className="mb-7">
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <TrendingUp size={14} className="text-blue-400" />
                      <span className="text-xs font-bold text-gray-300 tracking-wider uppercase">Continue Watching</span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                      {continueWatchingMovies.map((movie) => (
                        <ContinueWatchingCard 
                          key={movie.id}
                          movie={movie}
                          onClick={handleMovieClick}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Story Circles - Firestore stories collection থেকে */}
                <div className="mb-7">
                    <div className="flex items-center gap-2 mb-3 px-1">
                        <Zap size={14} className="text-gold fill-gold animate-pulse" />
                        <span className="text-xs font-bold text-gray-300 tracking-wider uppercase">Latest Stories</span>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {storyMoviesWithBadge.slice(0, 8).map(({ movie, storyBadge }, index) => (
                            <StoryCircle 
                                key={movie.id} 
                                movie={movie} 
                                index={index} 
                                storyBadge={storyBadge}
                                onClick={handleStoryClick} 
                            />
                        ))}
                    </div>
                </div>

                {/* 4. Notice Bar - noticeChannelLink আলাদা, channelLink আলাদা */}
                <NoticeBar 
                  channelLink={appSettings.channelLink}
                  noticeChannelLink={appSettings.noticeChannelLink}
                />

                {/* Premium Category Filter */}
                <div className="sticky top-[60px] z-30 bg-black/95 backdrop-blur-xl -mx-4 px-4 py-4 mb-6 border-b border-white/5 shadow-2xl">
                   <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar px-1">
                       {CATEGORIES.map((cat) => {
                           const isActive = activeCategory === cat;
                           
                           // Category icons
                           const getCategoryIcon = () => {
                             switch(cat) {
                               case 'All': return <TrendingUp size={12} />;
                               case 'Exclusive': return <Award size={12} />;
                               case 'Movies': return <Film size={12} />;
                               case 'Web Series': return <Tv size={12} />;
                               case 'K-Drama': return <Heart size={12} />;
                               case 'Anime': return <Flame size={12} />;
                               default: return null;
                             }
                           };
                           
                           return (
                               <button
                                 key={cat}
                                 onClick={() => setActiveCategory(cat as Category)}
                                 className="relative px-5 py-2.5 rounded-xl text-[11px] font-bold tracking-wide transition-all shrink-0 overflow-hidden"
                               >
                                   {isActive && (
                                       <motion.div 
                                          layoutId="activeCategory"
                                          className="absolute inset-0 bg-gradient-to-r from-gold to-[#ffe55c] rounded-xl z-0"
                                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                       />
                                   )}
                                   <span className={`relative z-10 flex items-center gap-1.5 ${isActive ? 'text-black font-extrabold' : 'text-gray-400 font-medium'}`}>
                                       {getCategoryIcon()}
                                       {cat}
                                       {isActive && <Sparkles size={10} className="fill-black/20 text-black/40" />}
                                   </span>
                                   {!isActive && (
                                       <div className="absolute inset-0 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors" />
                                   )}
                               </button>
                           )
                       })}
                   </div>
                </div>

                {/* Filtered Grid */}
                <div className="pb-8">
                    <h3 className="mb-4 flex items-center gap-2" style={{fontFamily:"'Outfit',sans-serif",fontSize:'18px',fontWeight:700,color:'#fff',letterSpacing:'-0.01em'}}>
                        <span className="w-1 h-5 bg-gold rounded-full shadow-[0_0_10px_#FFD700]"></span>
                        {activeCategory === 'All' ? 'Just Added' : `${activeCategory} Collection`}
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-4">
                        <AnimatePresence mode="popLayout">
                            {displayedMovies.length > 0 ? (
                                displayedMovies.map((movie) => (
                                    <MovieTile
                                        key={movie.id}
                                        movie={movie}
                                        isFavorite={favorites.includes(movie.id)}
                                        onToggleFavorite={toggleFavorite}
                                        onClick={handleMovieClick}
                                    />
                                ))
                            ) : (
                                <div className="col-span-3 text-center py-10 text-gray-500 text-xs">
                                    {movies.length === 0 ? "Loading Content..." : "No content found."}
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </>
        )}

        {/* SEARCH / EXPLORE VIEW */}
        {activeTab === 'search' && (
             <Explore 
                movies={movies} 
                onMovieClick={handleMovieClick} 
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onBack={() => setActiveTab('home')}
             />
        )}

        {/* WATCHLIST VIEW */}
        {activeTab === 'favorites' && (
             <div className="pt-4">
                <Watchlist 
                    movies={favMovies} 
                    onRemove={toggleFavorite} 
                    onClick={handleMovieClick} 
                />
             </div>
        )}

      </main>

      {/* --- BOTTOM NAV --- */}
      <BottomNav 
        activeTab={activeTab} 
        isVisible={isNavVisible}
        onTabChange={setActiveTab} 
      />

      {/* --- PROFILE --- */}
      <AnimatePresence>
        {activeTab === 'profile' && (
          <UserProfile 
            onClose={() => setActiveTab('home')} 
            botUsername={appSettings.referralBotUsername || appSettings.botUsername}
          />
        )}
      </AnimatePresence>

      {/* --- OVERLAYS --- */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onSurprise={handleSurpriseMe}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      <AnimatePresence>
        {selectedMovie && (
          <MovieDetails 
            movie={selectedMovie} 
            onClose={() => setSelectedMovie(null)} 
            botUsername={appSettings.botUsername}
            channelLink={appSettings.channelLink}
            appSettings={appSettings}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingStory && (
            <StoryViewer 
                movie={viewingStory} 
                onClose={() => setViewingStory(null)} 
                isFavorite={favorites.includes(viewingStory.id)}
                onToggleFavorite={toggleFavorite}
                onNavigateToMovie={(m) => {
                    setViewingStory(null); 
                    setTimeout(() => setSelectedMovie(m), 300); 
                }}
            />
        )}
      </AnimatePresence>

      {/* Admin Panel */}
      {isAdminOpen && (
        <AdminPanel onClose={() => setIsAdminOpen(false)} />
      )}

    </motion.div>
  );
};

export default App;

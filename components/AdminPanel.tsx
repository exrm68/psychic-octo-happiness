import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Upload, LogOut, Trash2, Edit, Plus, Save, CheckCircle2,
  Film, Award, Layout, Image as ImageIcon, Settings as SettingsIcon,
  Star, List, TrendingUp, Bell, Users, Coins, BarChart2, Search,
  ChevronDown, ChevronUp, PlusCircle, MinusCircle, RefreshCw
} from 'lucide-react';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { 
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, 
  query, orderBy, setDoc, getDoc, writeBatch, limit, onSnapshot, where,
  increment, getCountFromServer
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Movie, Episode, AppSettings, StoryItem, BannerItem, SeasonInfo } from '../types';

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('content');
  const [user, setUser] = useState<User | null>(null);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Lists
  const [movieList, setMovieList] = useState<Movie[]>([]);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [stories, setStories] = useState<StoryItem[]>([]);

  // Upload Form
  const [contentType, setContentType] = useState<'movie' | 'series'>('movie');
  const [title, setTitle] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [category, setCategory] = useState('Exclusive');
  const [year, setYear] = useState('2024');
  const [rating, setRating] = useState('9.0');
  const [views, setViews] = useState(''); // ✅ Custom views
  const [description, setDescription] = useState('');
  const [movieCode, setMovieCode] = useState('');
  const [movieDownloadCode, setMovieDownloadCode] = useState('');
  const [isExclusive, setIsExclusive] = useState(false);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  
  // ✅ NEW: Premium Image Features
  const [detailBanner, setDetailBanner] = useState(''); // Separate detail page banner
  const [screenshots, setScreenshots] = useState<string[]>([]); // Array of screenshot URLs
  const [screenshotInput, setScreenshotInput] = useState(''); // Input for adding screenshots
  
  // ✅ Detailed Metadata Fields
  const [fileSize, setFileSize] = useState(''); // e.g., "2.5GB"
  const [duration, setDuration] = useState(''); // e.g., "2h 15m"
  const [audioLanguage, setAudioLanguage] = useState(''); // e.g., "Hindi Dual Audio + English DD+5.1"
  const [subtitles, setSubtitles] = useState(''); // e.g., "English, Hindi, Arabic"
  const [videoQuality, setVideoQuality] = useState(''); // e.g., "4K HDR"
  const [isUpcoming, setIsUpcoming] = useState(false);
  const [releaseDate, setReleaseDate] = useState('');
  // ✅ Per-movie Ad Count
  const [movieWatchAdCount, setMovieWatchAdCount] = useState(-1); // -1 = use default
  const [movieDownloadAdCount, setMovieDownloadAdCount] = useState(-1); // -1 = use default

  // Episode Form
  const [epTitle, setEpTitle] = useState('');
  const [epSeason, setEpSeason] = useState('1');
  const [epNumber, setEpNumber] = useState('1');
  const [epCode, setEpCode] = useState('');
  const [epDownloadCode, setEpDownloadCode] = useState('');
  const [epDuration, setEpDuration] = useState(''); // ✅ Episode duration
  
  // ✅ Episode Premium Features
  const [epThumbnail, setEpThumbnail] = useState(''); // Episode specific thumbnail
  const [epIsComingSoon, setEpIsComingSoon] = useState(false); // Coming soon lock
  
  // ✅ Episode Metadata
  const [epFileSize, setEpFileSize] = useState('');
  const [epAudioLanguage, setEpAudioLanguage] = useState('');
  const [epSubtitles, setEpSubtitles] = useState('');
  const [epQuality, setEpQuality] = useState('');
  const [epIsUpcoming, setEpIsUpcoming] = useState(false);
  const [epReleaseDate, setEpReleaseDate] = useState('');
  const [epWatchAdCount, setEpWatchAdCount] = useState(-1); // -1 = global default

  // ✅ Episode inline editing
  const [editingEpId, setEditingEpId] = useState<string | null>(null);
  const [editEpTitle, setEditEpTitle] = useState('');
  const [editEpCode, setEditEpCode] = useState('');
  const [editEpDownloadCode, setEditEpDownloadCode] = useState('');
  const [editEpThumbnail, setEditEpThumbnail] = useState('');
  const [editEpWatchAdCount, setEditEpWatchAdCount] = useState(-1); // -1 = global default

  // ✅ Season Lock Management
  const [seasons, setSeasons] = useState<SeasonInfo[]>([]);
  const [seasonLockInput, setSeasonLockInput] = useState(''); // season number input
  const [seasonLockReleaseDate, setSeasonLockReleaseDate] = useState('');
  const [seasonLockTitle, setSeasonLockTitle] = useState('');

  // ✅ Content search
  const [searchQuery, setSearchQuery] = useState('');

  // Editing
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Settings
  const [botUsername, setBotUsername] = useState('');
  const [appName, setAppName] = useState('');
  const [channelLink, setChannelLink] = useState('');
  const [noticeChannelLink, setNoticeChannelLink] = useState(''); // ✅ Notice REQ আলাদা channel
  const [noticeText, setNoticeText] = useState('');
  const [noticeEnabled, setNoticeEnabled] = useState(true);

  // ✅ Coin Settings
  const [coinWelcome, setCoinWelcome] = useState(50);
  const [coinDaily, setCoinDaily] = useState(5);
  const [coinPerRefer, setCoinPerRefer] = useState(100);
  const [coinMilestone5, setCoinMilestone5] = useState(50);
  const [coinMilestone10, setCoinMilestone10] = useState(150);
  const [coinMilestone20, setCoinMilestone20] = useState(400);
  const [coinMilestone50, setCoinMilestone50] = useState(1000);
  const [coinRate, setCoinRate] = useState(1000); // 1000 coin = 10 taka
  const [minWithdraw, setMinWithdraw] = useState(50);

  // ✅ Ad Settings
  const [adEnabled, setAdEnabled] = useState(false);
  const [adZoneId, setAdZoneId] = useState('');
  const [adScriptUrl, setAdScriptUrl] = useState('//libtl.com/sdk.js');
  // ✅ Adsgram Settings
  const [adsgramEnabled, setAdsgramEnabled] = useState(false);
  const [adsgramBlockId, setAdsgramBlockId] = useState('');
  const [defaultWatchAdCount, setDefaultWatchAdCount] = useState(0);
  const [defaultDownloadAdCount, setDefaultDownloadAdCount] = useState(0);
  const [tutorialChannelLink, setTutorialChannelLink] = useState('');
  // ✅ Referral Bot Settings (আলাদা bot for referral links)
  const [referralBotUsername, setReferralBotUsername] = useState('');
  const [referralAppName, setReferralAppName] = useState('');
  // ✅ Ads-Free Coin System
  const [adsFreeEnabled, setAdsFreeEnabled] = useState(false);
  const [adsFreeCoinsPerContent, setAdsFreeCoinsPerContent] = useState(200);
  
  // ✅ Dynamic categories based on content type
  const movieCategories = ['Exclusive', 'Movies', 'Anime'];
  const seriesCategories = ['Exclusive', 'Web Series', 'K-Drama', 'Anime'];
  const categories = contentType === 'movie' ? movieCategories : seriesCategories;

  // Top 10 State
  const [top10Movies, setTop10Movies] = useState<Movie[]>([]);

  // TMDB Search State
  const TMDB_API_KEY = 'b445400ff2b0b33483ea4974026293e3';
  const [tmdbQuery, setTmdbQuery] = useState('');
  const [tmdbResults, setTmdbResults] = useState<any[]>([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [tmdbError, setTmdbError] = useState('');
  const [showTmdbResults, setShowTmdbResults] = useState(false);
  
  
  // Story Badge State (for adding badge when adding story)
  const [storyBadgeInput, setStoryBadgeInput] = useState('');
  const [editingStoryBadge, setEditingStoryBadge] = useState<string | null>(null);
  const [editingStoryBadgeValue, setEditingStoryBadgeValue] = useState('');

  // ✅ FIX: Banner edit states - moved outside map loop
  const [bannerEditStates, setBannerEditStates] = useState<Record<string, { isEditing: boolean; newImageUrl: string }>>({});


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // TMDB Search Function
  const handleTmdbSearch = async () => {
    if (!tmdbQuery.trim()) return;
    setTmdbLoading(true);
    setTmdbError('');
    setTmdbResults([]);
    setShowTmdbResults(true);
    try {
      const type = contentType === 'movie' ? 'movie' : 'tv';
      const res = await fetch(
        `https://api.themoviedb.org/3/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(tmdbQuery)}&language=en-US&page=1`
      );
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        setTmdbResults(data.results.slice(0, 6));
      } else {
        setTmdbError('কোনো result পাওয়া যায়নি। অন্য নাম দিয়ে try করুন।');
      }
    } catch (err) {
      setTmdbError('Network error। Internet connection চেক করুন।');
    }
    setTmdbLoading(false);
  };

  // TMDB Select — poster + backdrop auto fill
  const handleTmdbSelect = async (item: any) => {
    const type = contentType === 'movie' ? 'movie' : 'tv';
    const name = item.title || item.name || '';
    const releaseYear = (item.release_date || item.first_air_date || '').substring(0, 4);
    const overview = item.overview || '';
    const voteAvg = item.vote_average ? parseFloat(item.vote_average.toFixed(1)) : 9.0;

    // Poster (2:3) — thumbnail
    const posterUrl = item.poster_path
      ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
      : '';

    // Backdrop (16:9) — detail banner
    let backdropUrl = item.backdrop_path
      ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
      : '';

    // If no backdrop from search, fetch detail
    if (!backdropUrl && item.id) {
      try {
        const detailRes = await fetch(
          `https://api.themoviedb.org/3/${type}/${item.id}?api_key=${TMDB_API_KEY}`
        );
        const detail = await detailRes.json();
        if (detail.backdrop_path) {
          backdropUrl = `https://image.tmdb.org/t/p/w1280${detail.backdrop_path}`;
        }
      } catch (_) {}
    }

    // Auto-fill form
    setTitle(name);
    if (posterUrl) setThumbnail(posterUrl);
    if (backdropUrl) setDetailBanner(backdropUrl);
    if (releaseYear) setYear(releaseYear);
    if (overview) setDescription(overview);
    setRating(voteAvg.toString());

    setShowTmdbResults(false);
    setTmdbQuery('');
    showSuccess('✅ TMDB থেকে info fill হয়েছে! Telegram Code দিন।');
  };

  // ========== FETCH DATA ==========
  const fetchMovies = async () => {
    try {
      // ✅ createdAt ছাড়া docs-ও আনার জন্য orderBy বাদ দিয়ে সব fetch
      const snapshot = await getDocs(collection(db, "movies"));
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Movie[];
      // Sort locally: createdAt আছে সেগুলো আগে, না থাকলে শেষে
      list.sort((a: any, b: any) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      setMovieList(list);
      
      // Filter Top 10
      const top10 = list.filter(m => m.isTop10).sort((a, b) => 
        (a.top10Position || 10) - (b.top10Position || 10)
      );
      setTop10Movies(top10);
    } catch (e) {
      console.error("Error:", e);
    }
  };

  const fetchBanners = async () => {
    try {
      const q = query(collection(db, "banners"), orderBy("order", "asc"));
      const snapshot = await getDocs(q);
      setBanners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BannerItem[]);
    } catch (e) {
      console.error("Error:", e);
    }
  };

  const fetchStories = async () => {
    try {
      const q = query(collection(db, "stories"), orderBy("order", "asc"));
      const snapshot = await getDocs(q);
      setStories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StoryItem[]);
    } catch (e) {
      console.error("Error:", e);
    }
  };

  const fetchSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'config');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBotUsername(data.botUsername || '');
        setAppName(data.appName || '');
        setChannelLink(data.channelLink || '');
        setNoticeChannelLink(data.noticeChannelLink || '');
        setNoticeText(data.noticeText || '');
        setNoticeEnabled(data.noticeEnabled !== false);
        // ✅ Ad Settings
        setAdEnabled(data.adEnabled || false);
        setAdZoneId(data.adZoneId || '');
        setAdScriptUrl(data.adScriptUrl || '//libtl.com/sdk.js');
        // ✅ Adsgram
        setAdsgramEnabled(data.adsgramEnabled || false);
        setAdsgramBlockId(data.adsgramBlockId || '');
        setDefaultWatchAdCount(data.defaultWatchAdCount ?? 0);
        setDefaultDownloadAdCount(data.defaultDownloadAdCount ?? 0);
        setTutorialChannelLink(data.tutorialChannelLink || '');
        setReferralBotUsername((data.referralBotUsername || '').replace('@','').trim());
        setReferralAppName((data.referralAppName || '').replace('/','').trim());
        setAdsFreeEnabled(data.adsFreeEnabled || false);
        setAdsFreeCoinsPerContent(data.adsFreeCoinsPerContent ?? 200);
        // ✅ Coin Settings
        setCoinWelcome(data.coinWelcome ?? 50);
        setCoinDaily(data.coinDaily ?? 5);
        setCoinPerRefer(data.coinPerRefer ?? 100);
        setCoinMilestone5(data.coinMilestone5 ?? 50);
        setCoinMilestone10(data.coinMilestone10 ?? 150);
        setCoinMilestone20(data.coinMilestone20 ?? 400);
        setCoinMilestone50(data.coinMilestone50 ?? 1000);
        setCoinRate(data.coinRate ?? 1000);
        setMinWithdraw(data.minWithdraw ?? 50);
      }
    } catch (e) {
      console.error("Error:", e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMovies();
      if (activeTab === 'banners') fetchBanners();
      if (activeTab === 'stories') fetchStories();
      if (activeTab === 'settings') fetchSettings();
    }
  }, [user, activeTab]);

  // ========== LOGIN ==========
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showSuccess('✅ Login Successful!');
    } catch (err: any) {
      alert('❌ Invalid credentials');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    onClose();
  };

  // ========== CONTENT MANAGEMENT ==========
  const addEpisode = () => {
    if (!epTitle || (!epCode && !epIsUpcoming)) {
      alert('⚠️ Episode Title and Watch Code required (unless upcoming)!');
      return;
    }

    const newEp: Episode = {
      id: `ep_${Date.now()}`,
      season: parseInt(epSeason) || 1,
      number: parseInt(epNumber) || 1,
      title: epTitle,
      duration: epDuration || '45m', // ✅ Use user input, fallback to 45m
      telegramCode: epCode || 'TBA',
      ...(epDownloadCode && { downloadCode: epDownloadCode }),
      
      // ✅ Premium Features
      ...(epThumbnail && { thumbnail: epThumbnail }),
      ...(epIsComingSoon && { isComingSoon: epIsComingSoon }),
      
      // ✅ Metadata
      ...(epFileSize && { fileSize: epFileSize }),
      ...(epAudioLanguage && { audioLanguage: epAudioLanguage }),
      ...(epSubtitles && { subtitles: epSubtitles }),
      ...(epQuality && { quality: epQuality }),
      ...(epIsUpcoming && { isUpcoming: epIsUpcoming }),
      ...(epReleaseDate && { releaseDate: epReleaseDate }),
      ...(epWatchAdCount >= 0 ? { watchAdCount: epWatchAdCount } : {}),
    };

    setEpisodes([...episodes, newEp]);
    setEpTitle('');
    setEpNumber(String(parseInt(epNumber) + 1));
    setEpCode('');
    setEpDownloadCode('');
    setEpDuration(''); // ✅ Reset duration
    setEpThumbnail('');
    setEpIsComingSoon(false);
    setEpWatchAdCount(-1);
    setEpFileSize('');
    setEpAudioLanguage('');
    setEpSubtitles('');
    setEpQuality('');
    setEpIsUpcoming(false);
    setEpReleaseDate('');
    showSuccess(`✅ Episode ${newEp.number} added!`);
  };

  const handlePublish = async () => {
    if (!title || !thumbnail) {
      alert('⚠️ Title and Thumbnail required!');
      return;
    }

    if (contentType === 'movie' && !movieCode) {
      alert('⚠️ Movie Code required!');
      return;
    }

    if (contentType === 'series' && episodes.length === 0) {
      alert('⚠️ Add at least one episode!');
      return;
    }

    setLoading(true);
    try {
      const movieData: any = {
        title,
        thumbnail,
        category,
        rating: parseFloat(rating) || 9.0,
        views: views || '0',  // ✅ custom views, default 0
        year,
        description,
        isExclusive: isExclusive, // ✅ Exclusive badge flag
        createdAt: serverTimestamp(),
        
        // ✅ Premium Image Features (optional)
        ...(detailBanner && { detailBanner }),
        ...(screenshots.length > 0 && { screenshots }),
        
        // ✅ Metadata fields (optional)
        ...(fileSize && { fileSize }),
        ...(duration && { duration }),
        ...(audioLanguage && { audioLanguage }),
        ...(subtitles && { subtitles }),
        ...(videoQuality && { videoQuality }),
        ...(isUpcoming && { isUpcoming }),
        ...(releaseDate && { releaseDate }),
        // ✅ Per-movie Ad Count (-1 = use default from settings)
        ...(movieWatchAdCount >= 0 && { watchAdCount: movieWatchAdCount }),
        ...(movieDownloadAdCount >= 0 && { downloadAdCount: movieDownloadAdCount }),
      };

      if (contentType === 'movie') {
        movieData.telegramCode = movieCode;
        if (movieDownloadCode) movieData.downloadCode = movieDownloadCode; // ✅ আলাদা download code
      } else {
        movieData.episodes = episodes.sort((a, b) => {
          if (a.season !== b.season) return a.season - b.season;
          return a.number - b.number;
        });
        // ✅ Include season lock info
        if (seasons.length > 0) {
          movieData.seasons = seasons;
        }
      }

      if (isEditing && editId) {
        await updateDoc(doc(db, 'movies', editId), movieData);
        showSuccess('✅ Updated!');
      } else {
        await addDoc(collection(db, 'movies'), movieData);
        showSuccess('✅ Published!');
      }

      resetForm();
      fetchMovies();
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    }
    setLoading(false);
  };

  const handleEdit = (movie: Movie) => {
    setTitle(movie.title);
    setThumbnail(movie.thumbnail);
    setCategory(movie.category);
    setYear(movie.year || '2024');
    setRating(movie.rating?.toString() || '9.0');
    setViews(movie.views || '');  // ✅ custom views
    setDescription(movie.description || '');
    
    // ✅ Load Premium Image Fields
    setDetailBanner(movie.detailBanner || '');
    setScreenshots(movie.screenshots || []);
    
    // ✅ Load Metadata
    setFileSize(movie.fileSize || '');
    setDuration(movie.duration || '');
    setAudioLanguage(movie.audioLanguage || '');
    setSubtitles(movie.subtitles || '');
    setVideoQuality(movie.videoQuality || '');
    setIsUpcoming(movie.isUpcoming || false);
    setReleaseDate(movie.releaseDate || '');

    if (movie.episodes && movie.episodes.length > 0) {
      setContentType('series');
      setEpisodes(movie.episodes);
      setMovieCode('');
      setMovieDownloadCode('');
    } else {
      setContentType('movie');
      setMovieCode(movie.telegramCode || '');
      setMovieDownloadCode(movie.downloadCode || '');
      setEpisodes([]);
    }
    setIsExclusive(movie.isExclusive || false);
    setEditingEpId(null); // ✅ reset episode edit
    setSeasons(movie.seasons || []); // ✅ load season locks
    // ✅ Load Ad Count
    setMovieWatchAdCount(movie.watchAdCount ?? -1);
    setMovieDownloadAdCount(movie.downloadAdCount ?? -1);
    setIsEditing(true);
    setEditId(movie.id);
    setActiveTab('upload');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('এই content টি delete করবেন?')) return;
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'movies', id));
      showSuccess('✅ Deleted!');
      fetchMovies();
    } catch (err: any) {
      console.error('Delete error:', err);
      const code = err?.code || '';
      let msg = '❌ Delete failed!\n\n';
      if (code === 'permission-denied') {
        msg += '🔒 PERMISSION DENIED!\n\nFirestore Rules block করছে।\nSettings → "Firestore Fix" দেখুন।';
      } else if (code === 'unauthenticated') {
        msg += '🔑 Login করা নেই বা session expired।\nAdmin প্যানেল বন্ধ করে আবার login করুন।';
      } else {
        msg += `Error: ${err.message}`;
      }
      alert(msg);
    }
    setLoading(false);
  };

  const handleDeleteAll = async () => {
    if (!confirm(`⚠️ সব ${movieList.length}টি content DELETE করবেন?\n\nএটি undone করা যাবে না!`)) return;
    if (!confirm('আবার confirm করুন — সব content সত্যিই delete হবে?')) return;
    
    setLoading(true);
    let successCount = 0;
    let failCount = 0;
    
    for (const movie of movieList) {
      try {
        await deleteDoc(doc(db, 'movies', movie.id));
        successCount++;
      } catch (err: any) {
        failCount++;
        console.error('Bulk delete error for', movie.id, err);
      }
    }
    
    if (failCount > 0) {
      alert(`⚠️ ${successCount} deleted, ${failCount} failed.\n\nPermission error হলে Settings → Firestore Fix দেখুন।`);
    } else {
      showSuccess(`✅ সব ${successCount}টি content deleted!`);
    }
    fetchMovies();
    setLoading(false);
  };

  const testFirestoreConnection = async () => {
    setLoading(true);
    try {
      // Try to read
      const testQ = query(collection(db, 'movies'), limit(1));
      const snap = await getDocs(testQ);
      
      // Try to write a test doc
      const testRef = await addDoc(collection(db, '_test_'), { t: Date.now() });
      await deleteDoc(testRef);
      
      alert(`✅ Firestore সংযোগ ঠিক আছে!\n\n📊 Movies found: ${movieList.length}\n✍️ Write permission: OK\n🗑️ Delete permission: OK`);
    } catch (err: any) {
      const code = err?.code || '';
      let msg = '❌ Firestore Problem!\n\n';
      if (code === 'permission-denied') {
        msg += '🔒 Rules blocked করছে!\n\nFirebase Console → Firestore → Rules এ যান এবং নিচের rules দিন:\n\nrules_version = \'2\';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if request.auth != null;\n    }\n  }\n}';
      } else {
        msg += err.message;
      }
      alert(msg);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setTitle('');
    setThumbnail('');
    setCategory('Exclusive');
    setYear('2024');
    setRating('9.0');
    setViews('');
    setDescription('');
    setMovieCode('');
    setMovieDownloadCode('');
    setIsExclusive(false);
    setEpisodes([]);
    setContentType('movie');
    setIsEditing(false);
    setEditId(null);
    setEditingEpId(null);
    
    // ✅ Reset premium image fields
    setDetailBanner('');
    setScreenshots([]);
    setScreenshotInput('');
    
    // ✅ Reset metadata fields
    setFileSize('');
    setDuration('');
    setAudioLanguage('');
    setSubtitles('');
    setVideoQuality('');
    setIsUpcoming(false);
    setReleaseDate('');
    
    // ✅ Reset season locks
    setSeasons([]);
    setSeasonLockInput('');
    setSeasonLockReleaseDate('');
    setSeasonLockTitle('');
  };

  // ========== TOP 10 MANAGEMENT ==========
  const toggleTop10 = async (movieId: string, currentStatus: boolean) => {
    try {
      if (!currentStatus) {
        // Add to Top 10
        const nextPosition = top10Movies.length + 1;
        if (nextPosition > 10) {
          alert('⚠️ Top 10 is full! Remove one first.');
          return;
        }
        await updateDoc(doc(db, 'movies', movieId), {
          isTop10: true,
          top10Position: nextPosition
        });
        showSuccess('✅ Added to Top 10!');
      } else {
        // Remove from Top 10
        await updateDoc(doc(db, 'movies', movieId), {
          isTop10: false,
          top10Position: null
        });
        showSuccess('✅ Removed from Top 10!');
      }
      fetchMovies();
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    }
  };

  const updateTop10Position = async (movieId: string, newPosition: number) => {
    if (newPosition < 1 || newPosition > 10) {
      alert('⚠️ Position must be 1-10!');
      return;
    }

    try {
      await updateDoc(doc(db, 'movies', movieId), {
        top10Position: newPosition
      });
      showSuccess('✅ Position updated!');
      fetchMovies();
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    }
  };

  // ========== BANNER MANAGEMENT ==========
  const handleAddBanner = async (movieId: string) => {
    const movie = movieList.find(m => m.id === movieId);
    if (!movie) return;

    setLoading(true);
    try {
      // thumbnail (poster) first - same as collection cards show
      const bannerImage = movie.thumbnail;
      await addDoc(collection(db, 'banners'), {
        title: movie.title,
        image: bannerImage,
        movieId: movie.id,
        order: banners.length + 1,
        isActive: true,
        createdAt: serverTimestamp()
      });
      showSuccess('✅ Banner added!');
      fetchBanners();
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    }
    setLoading(false);
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Delete banner?')) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'banners', id));
      // ✅ Immediately update local state to prevent black screen
      setBanners(prev => prev.filter(b => b.id !== id));
      showSuccess('✅ Deleted!');
      await fetchBanners();
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    }
    setLoading(false);
  };

  const handleUpdateBannerImage = async (bannerId: string, newImageUrl: string) => {
    setLoading(true);
    try {
      const banner = banners.find(b => b.id === bannerId);
      if (!banner) return;
      
      // যদি URL খালি থাকে, তাহলে movie এর main thumbnail (poster) use করবে
      let finalImage = newImageUrl.trim();
      if (!finalImage && banner.movieId) {
        const movie = movieList.find(m => m.id === banner.movieId);
        if (movie) {
          // Use thumbnail (poster) - same as collection cards
          finalImage = movie.thumbnail;
        }
      }
      
      if (!finalImage) {
        alert('❌ Banner image পাওয়া যায়নি!');
        setLoading(false);
        return;
      }
      
      await updateDoc(doc(db, 'banners', bannerId), {
        image: finalImage
      });
      showSuccess(newImageUrl.trim() ? '✅ Custom banner image updated!' : '✅ Reverted to main thumbnail!');
      fetchBanners();
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    }
    setLoading(false);
  };

  // ========== STORY MANAGEMENT ==========
  const handleAddStory = async (movieId: string, badge?: string) => {
    const movie = movieList.find(m => m.id === movieId);
    if (!movie) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'stories'), {
        image: movie.thumbnail,
        movieId: movie.id,
        order: stories.length + 1,
        createdAt: serverTimestamp(),
        ...(badge && badge.trim() !== '' && { storyBadge: badge.trim() })
      });
      showSuccess('✅ Story added!');
      setStoryBadgeInput('');
      fetchStories();
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    }
    setLoading(false);
  };

  const handleUpdateStoryBadge = async (storyId: string, badge: string) => {
    try {
      await updateDoc(doc(db, 'stories', storyId), { storyBadge: badge });
      showSuccess('✅ Badge updated!');
      setEditingStoryBadge(null);
      fetchStories();
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    }
  };

  const handleDeleteStory = async (id: string) => {
    if (!confirm('Delete story?')) return;
    try {
      await deleteDoc(doc(db, 'stories', id));
      showSuccess('✅ Deleted!');
      fetchStories();
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    }
  };

  // ========== SETTINGS ==========
  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'config'), {
        botUsername: botUsername.replace('@', '').trim(),
        appName: appName.replace('/', '').trim(),
        channelLink,
        noticeChannelLink,
        noticeText,
        noticeEnabled,
        // ✅ Ad Settings
        adEnabled,
        adZoneId,
        adScriptUrl,
        // ✅ Adsgram
        adsgramEnabled,
        adsgramBlockId,
        defaultWatchAdCount,
        defaultDownloadAdCount,
        tutorialChannelLink,
        // ✅ Coin Settings
        coinWelcome, coinDaily, coinPerRefer,
        coinMilestone5, coinMilestone10, coinMilestone20, coinMilestone50,
        coinRate, minWithdraw,
        // ✅ Referral Bot
        referralBotUsername: referralBotUsername.replace('@','').trim(),
        referralAppName: referralAppName.replace('/','').trim(),
        // ✅ Ads-Free
        adsFreeEnabled,
        adsFreeCoinsPerContent,
      });
      showSuccess('✅ Settings saved!');
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    }
    setLoading(false);
  };

  // ========== LOGIN UI ==========
  if (!user) {
    return (
      <div className="fixed inset-0 bg-[#0d0d10] z-50 flex items-center justify-center p-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <button onClick={onClose} className="absolute top-5 right-5 p-2.5 bg-white/10 rounded-full">
            <X size={20} className="text-white" />
          </button>
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <Film size={28} className="text-amber-400" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">CINEFLIX Admin</h2>
            <p className="text-zinc-500 text-sm mt-1">Secret access panel</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <div className="bg-[#1a1a1d] border border-white/5 rounded-[18px] p-4 focus-within:border-amber-500/30 transition-colors">
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">Email</p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cineflix.com"
                className="w-full bg-transparent text-white text-sm outline-none placeholder:text-zinc-700"
              />
            </div>
            <div className="bg-[#1a1a1d] border border-white/5 rounded-[18px] p-4 focus-within:border-amber-500/30 transition-colors">
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">Password</p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent text-white text-sm outline-none placeholder:text-zinc-700"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black py-4 rounded-[18px] font-black text-sm flex items-center justify-center gap-2 mt-2"
            >
              {loading
                ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full" />
                : '🔐 Login'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ========== MAIN ADMIN UI ==========
  return (
    <div className="fixed inset-0 bg-[#0d0d10] z-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-[#0d0d10]/80 backdrop-blur-xl border-b border-white/5 px-4 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[12px] bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center">
              <Film size={17} className="text-amber-400" />
            </div>
            <h1 className="text-base font-black text-white tracking-tight">CINEFLIX Admin</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-[12px] text-zinc-400 hover:text-white transition-colors text-xs font-bold border border-white/5">
              <LogOut size={14} />
              Logout
            </button>
            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-[12px] transition-colors border border-white/5">
              <X size={18} className="text-zinc-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-[70px] left-4 right-4 z-[60] bg-emerald-500/20 text-emerald-50 border border-emerald-500/30 backdrop-blur-xl px-4 py-3 rounded-2xl text-sm font-bold shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="bg-[#0d0d10] border-b border-white/5 px-4 flex gap-1 overflow-x-auto no-scrollbar py-2">
        {[
          { id: 'dashboard', icon: BarChart2, label: 'Dashboard' },
          { id: 'upload', icon: Upload, label: 'Upload' },
          { id: 'content', icon: Film, label: 'Content' },
          { id: 'top10', icon: Award, label: 'Top 10' },
          { id: 'banners', icon: Layout, label: 'Banners' },
          { id: 'stories', icon: ImageIcon, label: 'Stories' },
          { id: 'users', icon: Users, label: 'Users' },
          { id: 'withdrawals', icon: TrendingUp, label: 'Payments' },
          { id: 'settings', icon: SettingsIcon, label: 'Settings' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] transition-all whitespace-nowrap text-xs font-bold ${
              activeTab === tab.id
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                : 'text-zinc-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-6xl mx-auto">
          
          {/* UPLOAD TAB */}
          {activeTab === 'upload' && (
            <div className="space-y-4 py-2">
              <h2 className="text-lg font-black text-white tracking-tight">
                {isEditing ? '✏️ Edit Content' : '➕ Upload New Content'}
              </h2>

              {/* Type Toggle */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setContentType('movie'); setEpisodes([]); }}
                  className={`p-5 rounded-[20px] border-2 transition ${
                    contentType === 'movie'
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-white/5 bg-[#1a1a1d]'
                  }`}
                >
                  <Film className="mx-auto mb-2 text-amber-400" size={28} />
                  <div className="font-bold text-white text-sm">Single Movie</div>
                </button>
                <button
                  onClick={() => { setContentType('series'); setMovieCode(''); }}
                  className={`p-5 rounded-[20px] border-2 transition ${
                    contentType === 'series'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/5 bg-[#1a1a1d]'
                  }`}
                >
                  <List className="mx-auto mb-2 text-blue-400" size={28} />
                  <div className="font-bold text-white text-sm">Series</div>
                </button>
              </div>

              {/* TMDB Auto Search Box */}
              <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-blue-400 text-lg">🎬</span>
                  <span className="text-blue-300 font-bold text-sm">TMDB Auto Search</span>
                  <span className="text-[10px] text-zinc-500 bg-blue-900/30 px-2 py-0.5 rounded-full">মুভির নাম দিলে poster + info আসবে</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tmdbQuery}
                    onChange={(e) => setTmdbQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleTmdbSearch(); }}
                    placeholder={contentType === 'movie' ? 'Movie name লিখো... (e.g. Jawan, Avatar)' : 'Series name লিখো... (e.g. Squid Game)'}
                    className="flex-1 px-4 py-2.5 bg-[#1a1a1d]/80 border border-blue-500/30 rounded-lg text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-blue-400"
                  />
                  <button
                    type="button"
                    onClick={handleTmdbSearch}
                    disabled={tmdbLoading}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2 shrink-0"
                  >
                    {tmdbLoading ? (
                      <span className="animate-spin">⏳</span>
                    ) : (
                      <span>🔍 Search</span>
                    )}
                  </button>
                </div>

                {/* Error */}
                {tmdbError && (
                  <p className="text-red-400 text-xs bg-red-900/20 px-3 py-2 rounded-lg border border-red-500/20">{tmdbError}</p>
                )}

                {/* Results */}
                {showTmdbResults && tmdbResults.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <p className="text-[11px] text-zinc-400">যেটা চাও সেটায় tap করো — সব auto fill হবে:</p>
                    {tmdbResults.map((item) => {
                      const name = item.title || item.name || 'Unknown';
                      const year = (item.release_date || item.first_air_date || '').substring(0, 4);
                      const rating = item.vote_average?.toFixed(1) || '?';
                      const poster = item.poster_path
                        ? `https://image.tmdb.org/t/p/w92${item.poster_path}`
                        : null;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleTmdbSelect(item)}
                          className="flex items-center gap-3 bg-[#1a1a1d]/80 hover:bg-blue-900/30 border border-white/5 hover:border-blue-500/30 rounded-lg p-2.5 cursor-pointer transition-all active:scale-98"
                        >
                          {poster ? (
                            <img src={poster} alt={name} className="w-10 h-14 object-cover rounded-md shrink-0 border border-white/10" />
                          ) : (
                            <div className="w-10 h-14 bg-[#242427] rounded-md shrink-0 flex items-center justify-center text-zinc-600 text-xs">🎬</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-bold truncate">{name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {year && <span className="text-[10px] text-zinc-400">{year}</span>}
                              <span className="text-[10px] text-gold">★ {rating}</span>
                            </div>
                            {item.overview && (
                              <p className="text-[10px] text-zinc-500 truncate mt-0.5">{item.overview}</p>
                            )}
                          </div>
                          <span className="text-blue-400 text-xs shrink-0">Tap →</span>
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => { setShowTmdbResults(false); setTmdbResults([]); }}
                      className="w-full text-zinc-500 text-xs py-1 hover:text-zinc-300 transition-colors"
                    >
                      ✕ Close results
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-4 text-[10px] text-zinc-600">
                  <span>✅ Thumbnail (2:3 poster) auto fill</span>
                  <span>✅ Detail Banner (16:9) auto fill</span>
                  <span>✅ HD quality</span>
                </div>
              </div>

              {/* Form */}
              <div className="bg-[#1a1a1d] rounded-[20px] p-4 space-y-3 border border-white/5">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title *"
                  className="w-full px-4 py-3 bg-[#0d0d10] border border-white/5 rounded-[14px] text-white text-sm outline-none focus:border-amber-500/30 transition-colors placeholder:text-zinc-700"
                />
                
                <input
                  type="text"
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  placeholder="Thumbnail URL * (Poster: 2:3 ratio, e.g. 400×600)"
                  className="w-full px-4 py-3 bg-[#0d0d10] border border-white/5 rounded-[14px] text-white text-sm outline-none focus:border-amber-500/30 transition-colors placeholder:text-zinc-700"
                />
                {thumbnail && (
                  <img src={thumbnail} alt="Preview" className="h-32 rounded-lg object-cover" />
                )}

                <div className="grid grid-cols-3 gap-4">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="px-4 py-3 bg-[#0d0d10] border border-white/5 rounded-[14px] text-white text-sm outline-none focus:border-amber-500/30 transition-colors appearance-none"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="Year (2024)"
                    className="px-4 py-3 bg-[#0d0d10] border border-white/5 rounded-[14px] text-white text-sm outline-none focus:border-amber-500/30 transition-colors appearance-none"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    placeholder="Rating (9.0)"
                    className="px-4 py-3 bg-[#0d0d10] border border-white/5 rounded-[14px] text-white text-sm outline-none focus:border-amber-500/30 transition-colors appearance-none"
                  />
                </div>

                {/* ✅ Views field */}
                <input
                  type="text"
                  value={views}
                  onChange={(e) => setViews(e.target.value)}
                  placeholder="👁️ Views (যেমন: 1.2M, 500K, 25K) — খালি রাখলে 0"
                  className="w-full px-4 py-3 bg-[#0d0d10] border border-white/5 rounded-[14px] text-white text-sm outline-none focus:border-amber-500/30 transition-colors placeholder:text-zinc-700"
                />

                {/* ✅ Exclusive Badge Toggle */}
                <div
                  onClick={() => setIsExclusive(!isExclusive)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    isExclusive
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-white/10 bg-[#1a1a1d]'
                  }`}
                >
                  <div>
                    <div className="font-bold text-white text-sm">⭐ EXCLUSIVE Badge</div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      চালু করলে thumbnail এ EXCL badge দেখাবে। Category পরিবর্তন হবে না।
                    </div>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-all ${isExclusive ? 'bg-yellow-500' : 'bg-white/10'} relative`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isExclusive ? 'right-1' : 'left-1'}`} />
                  </div>
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description"
                  rows={3}
                  className="w-full px-4 py-3 bg-[#0d0d10] border border-white/5 rounded-[14px] text-white text-sm outline-none focus:border-amber-500/30 transition-colors placeholder:text-zinc-700"
                />

                {/* ✅ PREMIUM IMAGE FEATURES (OPTIONAL) */}
                <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-purple-300 font-bold text-sm mb-2">
                    <ImageIcon size={16} />
                    <span>🎨 Premium Images (Optional)</span>
                  </div>
                  
                  <div>
                    <label className="text-xs text-purple-300 font-semibold mb-1 block">Detail Page Banner (16:9 — landscape ছবি)</label>
                    <input
                      type="text"
                      value={detailBanner}
                      onChange={(e) => setDetailBanner(e.target.value)}
                      placeholder="https://i.ibb.co/... (16:9 ratio, e.g. 1280×720)"
                      className="w-full px-4 py-2 bg-[#1a1a1d]/80 border border-purple-500/20 rounded-lg text-white text-sm"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">না দিলে thumbnail ব্যবহার হবে। দিলে detail page এ বড় banner দেখাবে।</p>
                  </div>
                  {detailBanner && (
                    <div className="relative">
                      <img 
                        src={detailBanner} 
                        alt="Detail Banner Preview" 
                        className="h-32 w-full rounded-lg object-cover border border-purple-500/30"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling!.style.display = 'flex';
                        }}
                      />
                      <div className="hidden h-32 w-full rounded-lg bg-red-900/20 border border-red-500/30 items-center justify-center text-red-400 text-xs flex-col gap-1">
                        <span>❌ Image load failed</span>
                        <span className="text-zinc-500">URL টি সঠিক কিনা চেক করুন</span>
                      </div>
                      <div className="absolute top-1 right-1 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-full">Detail Banner Preview ✓</div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={screenshotInput}
                        onChange={(e) => setScreenshotInput(e.target.value)}
                        placeholder="Screenshot URL — 16:9 ratio (1280×720) recommended"
                        className="flex-1 px-4 py-2 bg-[#1a1a1d]/80 border border-purple-500/20 rounded-lg text-white text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (screenshotInput && screenshots.length < 8) {
                            setScreenshots([...screenshots, screenshotInput]);
                            setScreenshotInput('');
                          }
                        }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
                      >
                        Add
                      </button>
                    </div>
                    {screenshots.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {screenshots.map((ss, idx) => (
                          <div key={idx} className="relative group">
                            <img src={ss} alt={`Screenshot ${idx + 1}`} className="h-16 w-full object-cover rounded" />
                            <button
                              type="button"
                              onClick={() => setScreenshots(screenshots.filter((_, i) => i !== idx))}
                              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ✅ ENHANCED METADATA (OPTIONAL) */}
                <div className="bg-gradient-to-r from-blue-900/20 to-green-900/20 border border-blue-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-blue-300 font-bold text-sm mb-2">
                    <SettingsIcon size={16} />
                    <span>📊 Enhanced Metadata (Optional)</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={fileSize}
                      onChange={(e) => setFileSize(e.target.value)}
                      placeholder="File Size (e.g., 2.5GB)"
                      className="px-4 py-2 bg-[#1a1a1d]/80 border border-blue-500/20 rounded-lg text-white text-sm"
                    />
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="Duration (e.g., 2h 15m)"
                      className="px-4 py-2 bg-[#1a1a1d]/80 border border-blue-500/20 rounded-lg text-white text-sm"
                    />
                  </div>
                  
                  <input
                    type="text"
                    value={audioLanguage}
                    onChange={(e) => setAudioLanguage(e.target.value)}
                    placeholder="Audio (e.g., Hindi Dual Audio + English DD+5.1)"
                    className="w-full px-4 py-2 bg-[#1a1a1d]/80 border border-blue-500/20 rounded-lg text-white text-sm"
                  />
                  
                  <input
                    type="text"
                    value={subtitles}
                    onChange={(e) => setSubtitles(e.target.value)}
                    placeholder="Subtitles (e.g., English, Hindi, Arabic)"
                    className="w-full px-4 py-2 bg-[#1a1a1d]/80 border border-blue-500/20 rounded-lg text-white text-sm"
                  />
                  
                  <input
                    type="text"
                    value={videoQuality}
                    onChange={(e) => setVideoQuality(e.target.value)}
                    placeholder="Video Quality (e.g., 4K HDR, 1080p BluRay)"
                    className="w-full px-4 py-2 bg-[#1a1a1d]/80 border border-blue-500/20 rounded-lg text-white text-sm"
                  />
                </div>

                {contentType === 'movie' && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={movieCode}
                      onChange={(e) => setMovieCode(e.target.value)}
                      placeholder="🎬 Watch/Stream Code (Telegram Video ID) *"
                      className="w-full px-4 py-3 bg-[#0d0d10] border border-white/5 rounded-[14px] text-white text-sm outline-none focus:border-amber-500/30 transition-colors placeholder:text-zinc-700"
                    />
                    <div className="relative">
                      <input
                        type="text"
                        value={movieDownloadCode}
                        onChange={(e) => setMovieDownloadCode(e.target.value)}
                        placeholder="⬇️ Download Code (আলাদা রাখতে চাইলে দিন, না দিলে Watch Code ব্যবহার হবে)"
                        className="w-full px-4 py-3 bg-[#1a1a1d] border border-green-700/50 rounded-lg text-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-500 font-bold">Optional</span>
                    </div>
                    <p className="text-xs text-zinc-500 px-1">
                      💡 Watch Code = Bot এ stream হবে। Download Code = আলাদা file/bot থেকে download হবে।
                    </p>
                  </div>
                )}

                {contentType === 'series' && (
                  <div className="bg-[#0d0d10] rounded-[14px] border border-white/5 p-4 space-y-3">
                    <div className="font-bold text-white mb-2">Add Episodes</div>
                    <div className="grid grid-cols-4 gap-2">
                      <input
                        type="number"
                        value={epSeason}
                        onChange={(e) => setEpSeason(e.target.value)}
                        placeholder="Season"
                        className="px-3 py-2 bg-[#242427] border border-white/10 rounded text-white text-sm"
                      />
                      <input
                        type="number"
                        value={epNumber}
                        onChange={(e) => setEpNumber(e.target.value)}
                        placeholder="Ep #"
                        className="px-3 py-2 bg-[#242427] border border-white/10 rounded text-white text-sm"
                      />
                      <input
                        type="text"
                        value={epTitle}
                        onChange={(e) => setEpTitle(e.target.value)}
                        placeholder="Title"
                        className="col-span-2 px-3 py-2 bg-[#242427] border border-white/10 rounded text-white text-sm"
                      />
                    </div>
                    <input
                      type="text"
                      value={epCode}
                      onChange={(e) => setEpCode(e.target.value)}
                      placeholder="🎬 Watch Code (Telegram Video ID) *"
                      className="w-full px-3 py-2 bg-[#242427] border border-white/10 rounded text-white text-sm"
                    />
                    <input
                      type="text"
                      value={epDownloadCode}
                      onChange={(e) => setEpDownloadCode(e.target.value)}
                      placeholder="⬇️ Download Code (আলাদা থাকলে দিন - Optional)"
                      className="w-full px-3 py-2 bg-[#242427] border border-green-700/40 rounded text-white text-sm"
                    />
                    
                    <input
                      type="text"
                      value={epDuration}
                      onChange={(e) => setEpDuration(e.target.value)}
                      placeholder="⏱️ Duration (e.g., 45m, 1h 30m, 2h 15m) - Optional"
                      className="w-full px-3 py-2 bg-[#242427] border border-blue-700/40 rounded text-white text-sm"
                    />

                    <div className="bg-[#242427]/60 border border-yellow-700/30 rounded-lg p-3 space-y-1.5">
                      <p className="text-xs text-yellow-400 font-bold">🔒 Ad Count (এই Episode এর জন্য)</p>
                      <div className="flex items-center gap-3">
                        <input
                          type="number" min={-1} max={10}
                          value={epWatchAdCount}
                          onChange={(e) => setEpWatchAdCount(Number(e.target.value))}
                          className="w-20 px-2 py-1.5 bg-[#1a1a1d] border border-yellow-700/40 rounded text-white text-sm text-center font-bold"
                        />
                        <p className="text-xs text-zinc-500 flex-1">
                          {epWatchAdCount === -1 ? '-1 = Global default ব্যবহার হবে' : `${epWatchAdCount} টি Ad দেখতে হবে (0 = Free)`}
                        </p>
                      </div>
                    </div>
                    
                    {/* ✅ Episode Premium Features */}
                    <div className="border-t border-white/10 pt-3 mt-2 space-y-2">
                      <div className="text-xs text-purple-300 font-semibold">🎨 Premium (Optional)</div>
                      
                      <input
                        type="text"
                        value={epThumbnail}
                        onChange={(e) => setEpThumbnail(e.target.value)}
                        placeholder="Episode Thumbnail — 16:9 ratio (1280×720) recommended"
                        className="w-full px-3 py-2 bg-[#242427] border border-purple-500/30 rounded text-white text-sm"
                      />
                      {epThumbnail && (
                        <img src={epThumbnail} alt="Episode Preview" className="h-16 w-28 object-cover rounded" />
                      )}
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="epComingSoon"
                          checked={epIsComingSoon}
                          onChange={(e) => setEpIsComingSoon(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <label htmlFor="epComingSoon" className="text-xs text-yellow-300 cursor-pointer">
                          🔒 Coming Soon (Lock করতে চাইলে)
                        </label>
                      </div>
                      
                      {epIsComingSoon && (
                        <input
                          type="text"
                          value={epReleaseDate}
                          onChange={(e) => setEpReleaseDate(e.target.value)}
                          placeholder="Release Date (e.g., Feb 20, 2026)"
                          className="w-full px-3 py-2 bg-[#242427] border border-yellow-500/30 rounded text-white text-sm"
                        />
                      )}
                      
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={epFileSize}
                          onChange={(e) => setEpFileSize(e.target.value)}
                          placeholder="Size (450MB)"
                          className="px-3 py-2 bg-[#242427] border border-white/10 rounded text-white text-xs"
                        />
                        <input
                          type="text"
                          value={epQuality}
                          onChange={(e) => setEpQuality(e.target.value)}
                          placeholder="Quality (1080p)"
                          className="px-3 py-2 bg-[#242427] border border-white/10 rounded text-white text-xs"
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={addEpisode}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium"
                    >
                      <Plus size={18} className="inline mr-2" />
                      Add Episode
                    </button>

                    {/* ✅ NEW: Season Lock Management */}
                    <div className="border-t border-white/10 pt-4 mt-2">
                      <div className="flex items-center gap-2 text-yellow-300 font-bold text-sm mb-3">
                        <span>🔒</span>
                        <span>Season Lock / Coming Soon</span>
                      </div>
                      <p className="text-xs text-zinc-500 mb-3">
                        পুরো সিজন lock করতে পারবেন — Coming Soon দেখাবে, ভিতরে এপিসোড দেখাবে না।
                      </p>
                      
                      {/* Add season lock form */}
                      <div className="space-y-2 mb-3">
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="number"
                            value={seasonLockInput}
                            onChange={(e) => setSeasonLockInput(e.target.value)}
                            placeholder="Season #"
                            min="1"
                            className="px-3 py-2 bg-[#242427] border border-yellow-500/30 rounded text-white text-sm"
                          />
                          <input
                            type="text"
                            value={seasonLockTitle}
                            onChange={(e) => setSeasonLockTitle(e.target.value)}
                            placeholder="Title (e.g. Part 2)"
                            className="col-span-2 px-3 py-2 bg-[#242427] border border-yellow-500/30 rounded text-white text-sm"
                          />
                        </div>
                        <input
                          type="text"
                          value={seasonLockReleaseDate}
                          onChange={(e) => setSeasonLockReleaseDate(e.target.value)}
                          placeholder="Release Date (e.g. March 2026) - Optional"
                          className="w-full px-3 py-2 bg-[#242427] border border-yellow-500/20 rounded text-white text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const num = parseInt(seasonLockInput);
                            if (!num || num < 1) { alert('Season number দিন!'); return; }
                            const exists = seasons.find(s => s.season === num);
                            if (exists) { alert('এই season ইতিমধ্যে আছে!'); return; }
                            setSeasons([...seasons, {
                              season: num,
                              isLocked: true,
                              isComingSoon: true,
                              ...(seasonLockReleaseDate && { releaseDate: seasonLockReleaseDate }),
                              ...(seasonLockTitle && { title: seasonLockTitle }),
                            }]);
                            setSeasonLockInput('');
                            setSeasonLockReleaseDate('');
                            setSeasonLockTitle('');
                          }}
                          className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-2 rounded text-sm"
                        >
                          + Lock Season
                        </button>
                      </div>
                      
                      {/* Locked seasons list */}
                      {seasons.length > 0 && (
                        <div className="space-y-1.5">
                          {seasons.map((s, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-2.5">
                              <div>
                                <span className="text-yellow-300 text-xs font-bold">
                                  🔒 {s.title ? `${s.title} (S${s.season})` : `Season ${s.season}`}
                                </span>
                                {s.releaseDate && (
                                  <span className="text-zinc-400 text-[10px] ml-2">• {s.releaseDate}</span>
                                )}
                                <div className="text-[9px] text-zinc-500 mt-0.5">COMING SOON লক করা</div>
                              </div>
                              <button
                                type="button"
                                onClick={async () => {
                                  const newSeasons = seasons.filter((_, i) => i !== idx);
                                  setSeasons(newSeasons);
                                  // ✅ Instantly save to Firebase if editing
                                  if (isEditing && editId) {
                                    try {
                                      await updateDoc(doc(db, 'movies', editId), {
                                        seasons: newSeasons
                                      });
                                      showSuccess('✅ Season lock removed!');
                                    } catch (err: any) {
                                      alert('❌ Remove failed: ' + err.message);
                                    }
                                  }
                                }}
                                className="bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-red-500/30 transition-all"
                              >
                                🗑 Remove
                              </button>
                            </div>
                          ))}
                          {isEditing && (
                            <p className="text-[10px] text-green-400 text-center">✅ Remove করলে সাথে সাথে Firebase এ save হবে</p>
                          )}
                        </div>
                      )}
                    </div>

                    {episodes.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <div className="text-sm text-zinc-400">Episodes ({episodes.length})</div>
                        {episodes.map(ep => (
                          <div key={ep.id} className="bg-[#242427] rounded p-2 flex items-center gap-2 text-sm">
                            {ep.thumbnail && (
                              <img src={ep.thumbnail} alt="" className="w-12 h-8 object-cover rounded" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-white truncate">S{ep.season}E{ep.number}: {ep.title}</span>
                                {ep.downloadCode && (
                                  <span className="text-xs text-green-400 shrink-0">⬇</span>
                                )}
                                {ep.isComingSoon && (
                                  <span className="text-xs text-yellow-400 shrink-0">🔒</span>
                                )}
                              </div>
                              {(ep.fileSize || ep.quality) && (
                                <div className="text-xs text-zinc-500 mt-0.5">
                                  {ep.fileSize && <span>{ep.fileSize}</span>}
                                  {ep.fileSize && ep.quality && <span> • </span>}
                                  {ep.quality && <span>{ep.quality}</span>}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => setEpisodes(episodes.filter(e => e.id !== ep.id))}
                              className="text-red-500 hover:text-red-400 shrink-0"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ✅ Per-Movie Ad Count */}
                <div className="bg-[#1a1a1d] rounded-[18px] border border-white/5 p-4 space-y-3 border border-blue-700/30">
                  <h4 className="text-sm font-bold text-blue-400">🎯 এই Movie র Ad Lock (Adsgram)</h4>
                  <p className="text-xs text-zinc-500">-1 দিলে Settings এর Default ব্যবহার হবে। 0 = Free.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">▶️ Watch করতে কতটা Ad?</label>
                      <input
                        type="number"
                        min={-1}
                        max={10}
                        value={movieWatchAdCount}
                        onChange={(e) => setMovieWatchAdCount(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#1a1a1d] border border-blue-700/40 rounded-lg text-white text-center font-bold text-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">⬇️ Download করতে কতটা Ad?</label>
                      <input
                        type="number"
                        min={-1}
                        max={10}
                        value={movieDownloadAdCount}
                        onChange={(e) => setMovieDownloadAdCount(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#1a1a1d] border border-blue-700/40 rounded-lg text-white text-center font-bold text-lg"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePublish}
                  disabled={loading}
                  className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-red-700 disabled:opacity-50"
                >
                  <Save size={20} className="inline mr-2" />
                  {loading ? 'Processing...' : isEditing ? 'Update' : 'Publish'}
                </button>
              </div>
            </div>
          )}

          {/* CONTENT TAB */}
          {activeTab === 'content' && (() => {
            const filteredList = searchQuery.trim()
              ? movieList.filter(m =>
                  m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  m.category.toLowerCase().includes(searchQuery.toLowerCase())
                )
              : movieList;

            return (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-lg font-black text-white tracking-tight">📚 All Content ({movieList.length})</h2>
                {movieList.length > 0 && (
                  <button
                    onClick={handleDeleteAll}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-red-800 hover:bg-red-700 border border-red-600 rounded-lg text-white text-sm font-bold transition-all disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                    Delete All ({movieList.length})
                  </button>
                )}
              </div>

              {/* ✅ Search Box */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 সিরিজ বা মুভির নাম লিখুন..."
                  className="w-full px-4 py-3 pl-10 bg-[#242427] border border-white/10 rounded-lg text-white placeholder:text-zinc-700 focus:border-red-500 outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-lg"
                  >×</button>
                )}
              </div>

              {filteredList.length === 0 && searchQuery && (
                <div className="text-center py-8 text-zinc-500">কোনো content পাওয়া যায়নি</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredList.map(movie => (
                  <div key={movie.id} className="bg-[#1a1a1d] rounded-[16px] border border-white/5 p-4 border border-white/10">
                    <div className="flex gap-4">
                      <img
                        src={movie.thumbnail}
                        alt={movie.title}
                        className="w-20 h-30 object-cover rounded shrink-0"
                        style={{height: '120px'}}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold mb-1 truncate">{movie.title}</h3>
                        <div className="flex flex-wrap gap-1 text-xs mb-2">
                          <span className="px-2 py-0.5 bg-white/10 rounded text-zinc-300">{movie.category}</span>
                          <span className="px-2 py-0.5 bg-yellow-600 rounded text-white">⭐ {movie.rating}</span>
                          {movie.episodes && <span className="px-2 py-0.5 bg-blue-600 rounded text-white">{movie.episodes.length} Eps</span>}
                          {movie.isTop10 && <span className="px-2 py-0.5 bg-red-600 rounded text-white">Top10</span>}
                          {movie.downloadCode && <span className="px-2 py-0.5 bg-green-700 rounded text-white">⬇DL</span>}
                          {movie.views && <span className="px-2 py-0.5 bg-white/15 rounded text-zinc-300">👁 {movie.views}</span>}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(movie)}
                            className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs"
                          >
                            <Edit size={12} className="inline mr-1" />Edit
                          </button>
                          <button
                            onClick={() => handleDelete(movie.id)}
                            className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-white text-xs"
                          >
                            <Trash2 size={12} className="inline mr-1" />Delete
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ✅ Episode inline edit - সিরিজ হলে এপিসোড দেখাবে */}
                    {movie.episodes && movie.episodes.length > 0 && (
                      <div className="mt-3 border-t border-white/10 pt-3">
                        <div className="text-xs text-zinc-400 mb-2 font-bold">📋 Episodes (ক্লিক করে edit করুন)</div>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {movie.episodes.map(ep => (
                            <div key={ep.id}>
                              {editingEpId === ep.id ? (
                                // ✅ Edit mode
                                <div className="bg-[#1a1a1d] rounded p-2 space-y-2">
                                  <div className="text-xs text-yellow-400 font-bold">S{ep.season}E{ep.number}: Edit করছেন</div>
                                  <input
                                    type="text"
                                    value={editEpTitle}
                                    onChange={e => setEditEpTitle(e.target.value)}
                                    placeholder="Episode Title"
                                    className="w-full px-2 py-1.5 bg-[#242427] border border-white/10 rounded text-white text-xs"
                                  />
                                  <input
                                    type="text"
                                    value={editEpThumbnail}
                                    onChange={e => setEditEpThumbnail(e.target.value)}
                                    placeholder="🖼️ Episode Thumbnail URL (Optional)"
                                    className="w-full px-2 py-1.5 bg-[#242427] border border-purple-700/40 rounded text-white text-xs"
                                  />
                                  {editEpThumbnail && (
                                    <div className="relative">
                                      <img src={editEpThumbnail} alt="Preview" className="w-full h-20 object-cover rounded border border-purple-500/20" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                      <div className="absolute top-1 right-1 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-full">Preview</div>
                                    </div>
                                  )}
                                  <input
                                    type="text"
                                    value={editEpCode}
                                    onChange={e => setEditEpCode(e.target.value)}
                                    placeholder="🎬 Watch Code"
                                    className="w-full px-2 py-1.5 bg-[#242427] border border-white/10 rounded text-white text-xs"
                                  />
                                  <input
                                    type="text"
                                    value={editEpDownloadCode}
                                    onChange={e => setEditEpDownloadCode(e.target.value)}
                                    placeholder="⬇️ Download Code (Optional)"
                                    className="w-full px-2 py-1.5 bg-[#242427] border border-green-700/40 rounded text-white text-xs"
                                  />
                                  <div className="bg-[#242427]/80 border border-yellow-700/30 rounded p-2 space-y-1">
                                    <p className="text-[10px] text-yellow-400 font-bold">🔒 Ad Count (এই Episode)</p>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="number" min={-1} max={10}
                                        value={editEpWatchAdCount}
                                        onChange={e => setEditEpWatchAdCount(Number(e.target.value))}
                                        className="w-20 px-2 py-1 bg-[#1a1a1d] border border-yellow-700/40 rounded text-white text-xs text-center font-bold"
                                      />
                                      <p className="text-[10px] text-zinc-500">{editEpWatchAdCount === -1 ? '← -1 = Global default ব্যবহার হবে' : `← ${editEpWatchAdCount} টি Ad দেখতে হবে`}</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={async () => {
                                        // Save episode edit with thumbnail
                                        const updatedEps = movie.episodes!.map(e =>
                                          e.id === ep.id
                                            ? { 
                                                ...e, 
                                                title: editEpTitle, 
                                                telegramCode: editEpCode, 
                                                ...(editEpDownloadCode ? { downloadCode: editEpDownloadCode } : { downloadCode: undefined }),
                                                ...(editEpThumbnail ? { thumbnail: editEpThumbnail } : {}),
                                                ...(editEpWatchAdCount >= 0 ? { watchAdCount: editEpWatchAdCount } : { watchAdCount: undefined })
                                              }
                                            : e
                                        );
                                        try {
                                          await updateDoc(doc(db, 'movies', movie.id), { episodes: updatedEps });
                                          showSuccess('✅ Episode updated!');
                                          setEditingEpId(null);
                                          fetchMovies();
                                        } catch(e) { alert('❌ Error saving'); }
                                      }}
                                      className="flex-1 px-2 py-1.5 bg-green-600 hover:bg-green-700 rounded text-white text-xs font-bold"
                                    >
                                      <Save size={12} className="inline mr-1" />Save
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (!confirm('Delete this episode?')) return;
                                        // Delete episode
                                        const updatedEps = movie.episodes!.filter(e => e.id !== ep.id);
                                        try {
                                          await updateDoc(doc(db, 'movies', movie.id), { episodes: updatedEps });
                                          showSuccess('✅ Episode deleted!');
                                          setEditingEpId(null);
                                          fetchMovies();
                                        } catch(e) { alert('❌ Error deleting'); }
                                      }}
                                      className="px-2 py-1.5 bg-red-600 hover:bg-red-700 rounded text-white text-xs font-bold"
                                      title="Delete Episode"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                    <button
                                      onClick={() => setEditingEpId(null)}
                                      className="px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded text-white text-xs"
                                    >Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                // Normal view
                                <div
                                  className="flex items-center justify-between bg-[#1a1a1d]/60 rounded px-2 py-1.5 cursor-pointer hover:bg-[#1a1a1d] group"
                                  onClick={() => {
                                    setEditingEpId(ep.id);
                                    setEditEpTitle(ep.title);
                                    setEditEpCode(ep.telegramCode);
                                    setEditEpDownloadCode(ep.downloadCode || '');
                                    setEditEpThumbnail(ep.thumbnail || '');
                                    setEditEpWatchAdCount(ep.watchAdCount ?? -1);
                                  }}
                                >
                                  <span className="text-xs text-zinc-300">
                                    S{ep.season}E{ep.number}: {ep.title}
                                    {ep.downloadCode && <span className="ml-1 text-green-400">⬇</span>}
                                  </span>
                                  <span className="text-[10px] text-zinc-500 group-hover:text-yellow-400">✏️ Edit</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            );
          })()}

          {/* TOP 10 TAB */}
          {activeTab === 'top10' && (
            <div className="space-y-6">
              <h2 className="text-lg font-black text-white tracking-tight">🏆 Top 10 Management</h2>

              {/* Current Top 10 */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Current Top 10 ({top10Movies.length}/10)</h3>
                <div className="space-y-3">
                  {top10Movies.map(movie => (
                    <div key={movie.id} className="bg-gradient-to-r from-yellow-900/30 to-gray-800 rounded-lg p-4 border border-yellow-700/30">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          #{movie.top10Position}
                        </div>
                        <img src={movie.thumbnail} alt={movie.title} className="w-16 h-24 object-cover rounded" />
                        <div className="flex-1">
                          <h4 className="text-white font-bold">{movie.title}</h4>
                          <p className="text-zinc-400 text-sm">{movie.category} • {movie.year}</p>
                          <div className="flex gap-2 mt-2">
                            <input
                              type="number"
                              min="1"
                              max="10"
                              defaultValue={movie.top10Position}
                              onBlur={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val)) updateTop10Position(movie.id, val);
                              }}
                              className="w-20 px-2 py-1 bg-[#1a1a1d] border border-white/10 rounded text-white text-sm"
                            />
                            <button
                              onClick={() => toggleTop10(movie.id, true)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add to Top 10 */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Add to Top 10</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {movieList.filter(m => !m.isTop10).map(movie => (
                    <div key={movie.id} className="bg-[#1a1a1d] rounded-[16px] border border-white/5 p-3 flex items-center gap-3">
                      <img src={movie.thumbnail} alt={movie.title} className="w-16 h-24 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium text-sm truncate">{movie.title}</h4>
                        <p className="text-zinc-400 text-xs">{movie.category}</p>
                      </div>
                      <button
                        onClick={() => toggleTop10(movie.id, false)}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-white text-sm font-medium"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* BANNERS TAB */}
          {activeTab === 'banners' && (
            <div className="space-y-6">
              <h2 className="text-lg font-black text-white tracking-tight">🖼️ Banner Management</h2>

              <div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Current Banners ({banners.length})
                </h3>
                <p className="text-sm text-zinc-400 mb-4">
                  এইগুলো home page এ বড় banner হিসেবে rotate করবে। Last added banner প্রথমে দেখাবে।
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {banners.map(banner => {
                    const movie = movieList.find(m => m.id === banner.movieId);
                    const editState = bannerEditStates[banner.id] || { isEditing: false, newImageUrl: banner.image };
                    
                    return (
                      <div key={banner.id} className="bg-[#1a1a1d] rounded-[16px] border border-white/5 overflow-hidden border border-white/10">
                        <div className="relative">
                          <img src={banner.image} alt={banner.title} className="w-full h-40 object-cover" />
                          {/* Show if using custom URL or main thumbnail */}
                          {banner.image === (movie?.detailBanner || movie?.thumbnail) ? (
                            <div className="absolute top-2 left-2 bg-blue-600/90 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                              Using Main Thumbnail
                            </div>
                          ) : (
                            <div className="absolute top-2 left-2 bg-purple-600/90 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                              Custom Banner URL
                            </div>
                          )}
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-white font-bold">{banner.title}</h4>
                              <p className="text-zinc-400 text-sm">Order: #{banner.order}</p>
                              {movie && (
                                <p className="text-blue-400 text-xs mt-1">
                                  → {movie.title} {movie.episodes ? `(${movie.episodes.length} episodes)` : ''}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setBannerEditStates(prev => ({
                                  ...prev,
                                  [banner.id]: { isEditing: !editState.isEditing, newImageUrl: editState.newImageUrl || banner.image }
                                }))}
                                className="p-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
                                title="Edit Banner Image"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteBanner(banner.id)}
                                className="p-2 bg-red-600 hover:bg-red-700 rounded text-white"
                                title="Delete Banner"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                          
                          {/* Inline Edit Banner Image */}
                          {editState.isEditing && (
                            <div className="bg-[#1a1a1d]/50 border border-blue-500/30 rounded-lg p-3 space-y-3">
                              <div>
                                <label className="text-xs text-blue-300 font-semibold block mb-2">
                                  🖼️ Custom Banner Image URL (16:9)
                                </label>
                                <div className="bg-[#242427]/50 rounded p-2 mb-2 space-y-1 text-[10px]">
                                  <div className="flex items-start gap-2 text-zinc-400">
                                    <span className="text-green-400">✓</span>
                                    <span><strong className="text-white">URL দিন:</strong> Custom image home banner এ দেখাবে</span>
                                  </div>
                                  <div className="flex items-start gap-2 text-zinc-400">
                                    <span className="text-green-400">✓</span>
                                    <span><strong className="text-white">খালি করে Save:</strong> Movie এর main thumbnail ফিরে আসবে</span>
                                  </div>
                                </div>
                              </div>
                              <input
                                type="text"
                                value={editState.newImageUrl}
                                onChange={(e) => setBannerEditStates(prev => ({
                                  ...prev,
                                  [banner.id]: { ...editState, newImageUrl: e.target.value }
                                }))}
                                placeholder="https://i.ibb.co/banner.jpg অথবা খালি রাখুন"
                                className="w-full px-3 py-2 bg-[#242427] border border-white/10 rounded text-white text-sm"
                              />
                              {editState.newImageUrl && editState.newImageUrl !== banner.image && (
                                <div className="relative">
                                  <img 
                                    src={editState.newImageUrl} 
                                    alt="Preview" 
                                    className="w-full h-24 object-cover rounded border border-blue-500/20"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                  <div className="absolute top-1 right-1 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-full">
                                    Preview ✓
                                  </div>
                                </div>
                              )}
                              {!editState.newImageUrl && (
                                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-2 text-yellow-300 text-[10px]">
                                  ⚠️ খালি রাখলে "{movie?.title}" এর main thumbnail use হবে
                                </div>
                              )}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    handleUpdateBannerImage(banner.id, editState.newImageUrl);
                                    setBannerEditStates(prev => ({
                                      ...prev,
                                      [banner.id]: { isEditing: false, newImageUrl: editState.newImageUrl }
                                    }));
                                  }}
                                  disabled={loading}
                                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-white/10 disabled:cursor-not-allowed rounded text-white text-sm font-medium"
                                >
                                  {editState.newImageUrl ? 'Save Custom URL' : 'Remove Custom (Use Main Thumbnail)'}
                                </button>
                                <button
                                  onClick={() => setBannerEditStates(prev => ({
                                    ...prev,
                                    [banner.id]: { isEditing: false, newImageUrl: banner.image }
                                  }))}
                                  className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded text-white text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-3">Add Banner (Content থেকে select করুন)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {movieList.map(movie => (
                    <div key={movie.id} className="bg-[#1a1a1d] rounded-[16px] border border-white/5 p-3 flex items-center gap-3">
                      <img src={movie.thumbnail} alt={movie.title} className="w-20 h-12 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate">{movie.title}</h4>
                        <p className="text-zinc-400 text-xs">{movie.category}</p>
                      </div>
                      <button
                        onClick={() => handleAddBanner(movie.id)}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-medium shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STORIES TAB */}
          {activeTab === 'stories' && (
            <div className="space-y-6">
              <h2 className="text-lg font-black text-white tracking-tight">📸 Instagram Stories</h2>

              {/* Current Stories */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Current Stories ({stories.length})</h3>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {stories.map(story => {
                    const storyMovie = movieList.find(m => m.id === story.movieId);
                    return (
                      <div key={story.id} className="flex-shrink-0 text-center relative w-24">
                        <div className="relative inline-block">
                          <img 
                            src={story.image} 
                            alt="Story" 
                            className="w-20 h-20 rounded-full object-cover border-4 border-pink-500"
                          />
                          {/* Show current badge */}
                          {(story as any).storyBadge && (
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[8px] font-black px-2 py-0.5 rounded-full border border-yellow-700 whitespace-nowrap">
                              {(story as any).storyBadge}
                            </div>
                          )}
                          <button
                            onClick={() => handleDeleteStory(story.id)}
                            className="absolute -top-1 -right-1 bg-red-600 rounded-full p-1 z-10"
                          >
                            <X size={12} className="text-white" />
                          </button>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-2 truncate">{storyMovie?.title || 'Story'}</p>
                        
                        {/* Badge edit inline */}
                        {editingStoryBadge === story.id ? (
                          <div className="mt-1 flex flex-col gap-1">
                            <input
                              type="text"
                              value={editingStoryBadgeValue}
                              onChange={e => setEditingStoryBadgeValue(e.target.value)}
                              placeholder="#1 / NEW"
                              className="w-full px-1.5 py-1 bg-[#242427] border border-yellow-600 rounded text-white text-[9px]"
                            />
                            <div className="flex gap-1">
                              <button onClick={() => handleUpdateStoryBadge(story.id, editingStoryBadgeValue)} className="flex-1 bg-yellow-500 text-black text-[9px] font-bold py-0.5 rounded">Save</button>
                              <button onClick={() => setEditingStoryBadge(null)} className="flex-1 bg-white/10 text-white text-[9px] py-0.5 rounded">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingStoryBadge(story.id); setEditingStoryBadgeValue((story as any).storyBadge || ''); }}
                            className="mt-1 w-full text-[9px] bg-[#242427] border border-white/10 text-yellow-400 py-0.5 rounded hover:bg-white/10"
                          >
                            {(story as any).storyBadge ? '✏️ Badge' : '+ Badge'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Badge Preset Quick-Select Info */}
              <div className="bg-[#242427]/60 border border-yellow-600/30 rounded-xl p-4">
                <p className="text-yellow-400 text-sm font-bold mb-2">🏷️ Badge Guide</p>
                <p className="text-zinc-400 text-xs mb-3">Each story can have one badge shown below the ring. Available options:</p>
                <div className="flex flex-wrap gap-2">
                  {['NEW', 'HOT', '#1', '#2', '#3', '#4', '#5', 'TOP', 'LIVE'].map(b => (
                    <span key={b} className="bg-white/10 border border-yellow-500/40 text-yellow-400 text-[10px] font-black px-2.5 py-1 rounded-full cursor-default">{b}</span>
                  ))}
                </div>
              </div>

              {/* Add Story Section */}
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Add Story (Select from content)</h3>
                
                {/* Badge input for new story */}
                <div className="mb-4">
                  <label className="block text-sm text-zinc-400 mb-1">🏷️ Badge for new story (optional)</label>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {['NEW', 'HOT', '#1', '#2', '#3', 'TOP', 'LIVE'].map(b => (
                      <button
                        key={b}
                        onClick={() => setStoryBadgeInput(b)}
                        className={`text-[10px] font-black px-3 py-1.5 rounded-lg border transition-all ${storyBadgeInput === b ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-[#242427] text-zinc-300 border-white/10 hover:border-yellow-500'}`}
                      >
                        {b}
                      </button>
                    ))}
                    <button
                      onClick={() => setStoryBadgeInput('')}
                      className="text-[10px] px-3 py-1.5 rounded-lg bg-[#242427] text-zinc-500 border border-white/10 hover:bg-white/10"
                    >
                      No Badge
                    </button>
                  </div>
                  <input
                    type="text"
                    value={storyBadgeInput}
                    onChange={e => setStoryBadgeInput(e.target.value)}
                    placeholder="Or type custom badge..."
                    className="w-full px-3 py-2 bg-[#1a1a1d] border border-white/10 rounded-lg text-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {movieList.map(movie => (
                    <div key={movie.id} className="bg-[#1a1a1d] rounded-[16px] border border-white/5 p-3 text-center">
                      <img src={movie.thumbnail} alt={movie.title} className="w-full h-40 object-cover rounded mb-2" />
                      <h4 className="text-white text-sm font-medium truncate mb-2">{movie.title}</h4>
                      <button
                        onClick={() => handleAddStory(movie.id, storyBadgeInput)}
                        disabled={loading}
                        className="w-full px-3 py-2 bg-pink-600 hover:bg-pink-700 rounded text-white text-sm font-medium"
                      >
                        {storyBadgeInput ? `Add + "${storyBadgeInput}"` : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <DashboardPanel />
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <UsersPanel />
          )}

          {/* WITHDRAWALS TAB */}
          {activeTab === 'withdrawals' && (
            <WithdrawalsPanel />
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-lg font-black text-white tracking-tight">⚙️ App Settings</h2>
              
              {/* ── MONETAG SECTION ── */}
              <div className={`bg-[#1a1a1d] rounded-[18px] border border-white/5 p-6 space-y-4 border-2 transition-all ${!adsgramEnabled && adEnabled ? 'border-yellow-500/40' : 'border-transparent'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-yellow-400">💰 Monetag</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Rewarded Interstitial ads</p>
                  </div>
                  <button
                    onClick={() => { setAdEnabled(!adEnabled); if (!adEnabled) setAdsgramEnabled(false); }}
                    className={`relative w-12 h-6 rounded-full transition-all ${adEnabled && !adsgramEnabled ? 'bg-yellow-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${adEnabled && !adsgramEnabled ? 'left-6' : 'left-0.5'}`} />
                  </button>
                </div>

                {adEnabled && !adsgramEnabled ? (
                  <div className="space-y-3">
                    <div className="bg-yellow-950/30 border border-yellow-700/30 rounded-lg px-3 py-2">
                      <p className="text-xs text-yellow-300 font-bold">✅ Monetag চালু আছে</p>
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">📌 Zone ID</label>
                      <input
                        type="text"
                        value={adZoneId}
                        onChange={(e) => setAdZoneId(e.target.value)}
                        placeholder="যেমন: 10697357"
                        className="w-full px-4 py-3 bg-[#1a1a1d] border border-yellow-700/40 rounded-[14px] text-white font-mono text-sm outline-none focus:border-amber-500/30 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">🔗 Script URL <span className="text-zinc-600">(Optional)</span></label>
                      <input
                        type="text"
                        value={adScriptUrl}
                        onChange={(e) => setAdScriptUrl(e.target.value)}
                        placeholder="//libtl.com/sdk.js"
                        className="w-full px-4 py-3 bg-[#1a1a1d] border border-white/10 rounded-[14px] text-white font-mono text-sm outline-none focus:border-amber-500/30 transition-colors"
                      />
                    </div>
                    {adZoneId && (
                      <div className="bg-green-950/30 border border-green-700/20 rounded-lg p-2 text-[10px] text-green-400">
                        ✅ Zone ID set: <span className="font-mono font-bold">{adZoneId}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-[#1a1a1d]/60 rounded-lg p-3">
                    <p className="text-xs text-zinc-600">
                      {adsgramEnabled ? '⚠️ Adsgram চালু থাকায় Monetag বন্ধ আছে' : '💡 Toggle চালু করলে Monetag activate হবে'}
                    </p>
                  </div>
                )}
              </div>

              {/* ── ADSGRAM SECTION ── */}
              <div className={`bg-[#1a1a1d] rounded-[18px] border border-white/5 p-6 space-y-4 border-2 transition-all ${adsgramEnabled ? 'border-green-500/40' : 'border-transparent'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-green-400">🎯 Adsgram</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Reward ads for Telegram Mini Apps</p>
                  </div>
                  <button
                    onClick={() => { setAdsgramEnabled(!adsgramEnabled); if (!adsgramEnabled) setAdEnabled(true); }}
                    className={`relative w-12 h-6 rounded-full transition-all ${adsgramEnabled ? 'bg-green-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${adsgramEnabled ? 'left-6' : 'left-0.5'}`} />
                  </button>
                </div>

                {adsgramEnabled ? (
                  <div className="space-y-3">
                    <div className="bg-green-950/30 border border-green-700/30 rounded-lg px-3 py-2">
                      <p className="text-xs text-green-300 font-bold">✅ Adsgram চালু — Monetag বন্ধ</p>
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">🆔 Block ID</label>
                      <input
                        type="text"
                        value={adsgramBlockId}
                        onChange={(e) => setAdsgramBlockId(e.target.value)}
                        placeholder="যেমন: 24717"
                        className="w-full px-4 py-3 bg-[#1a1a1d] border border-green-700/40 rounded-[14px] text-white font-mono text-sm outline-none focus:border-amber-500/30 transition-colors"
                      />
                    </div>
                    {adsgramBlockId
                      ? <div className="bg-green-950/30 border border-green-700/20 rounded-lg p-2 text-[10px] text-green-400">✅ Block ID set: <span className="font-mono font-bold">{adsgramBlockId}</span></div>
                      : <p className="text-xs text-yellow-400">⚠️ Adsgram Dashboard থেকে Block ID নিন</p>
                    }
                  </div>
                ) : (
                  <div className="bg-[#1a1a1d]/60 rounded-lg p-3">
                    <p className="text-xs text-zinc-600">💡 Toggle চালু করলে Adsgram activate হবে, Monetag বন্ধ হবে</p>
                  </div>
                )}
              </div>

              {/* ── AD LOCK SYSTEM ── */}
              <div className="bg-[#1a1a1d] rounded-[20px] p-4 space-y-3 border border-white/5">
                <h3 className="text-lg font-bold text-blue-400">🔒 Ad Lock System</h3>
                <p className="text-xs text-zinc-400">Watch ও Download এ কতটি ad দেখলে unlock হবে সেটা set করুন।</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">▶️ Watch Ad Count</label>
                    <p className="text-xs text-zinc-500 mb-1">Watch করতে কতটা ad</p>
                    <input type="number" min={0} max={10} value={defaultWatchAdCount} onChange={(e) => setDefaultWatchAdCount(Number(e.target.value))} className="w-full px-4 py-3 bg-[#1a1a1d] border border-blue-700/40 rounded-lg text-white text-center font-bold text-xl" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">⬇️ Download Ad Count</label>
                    <p className="text-xs text-zinc-500 mb-1">Download করতে কতটা ad</p>
                    <input type="number" min={0} max={10} value={defaultDownloadAdCount} onChange={(e) => setDefaultDownloadAdCount(Number(e.target.value))} className="w-full px-4 py-3 bg-[#1a1a1d] border border-blue-700/40 rounded-lg text-white text-center font-bold text-xl" />
                  </div>
                </div>

                <div className="bg-blue-950/40 border border-blue-700/30 rounded-lg p-3 text-xs text-blue-300 space-y-1">
                  <p>💡 <strong>0</strong> = Free (কোনো ad লাগবে না)</p>
                  <p>💡 <strong>1-5</strong> = সেই সংখ্যক ad দেখার পর unlock হবে</p>
                  <p>💡 প্রতিটা Movie তে আলাদা count — Upload/Edit এ set করুন</p>
                </div>

                {/* Tutorial Channel Link */}
                <div className="bg-purple-950/40 border border-purple-700/30 rounded-lg p-4 space-y-2">
                  <p className="text-sm text-purple-300 font-bold">📺 Tutorial Channel Link</p>
                  <p className="text-xs text-zinc-500">Lock screen এ "কিভাবে unlock করবেন?" button এ এই channel link যাবে।</p>
                  <input
                    type="text"
                    value={tutorialChannelLink}
                    onChange={(e) => setTutorialChannelLink(e.target.value)}
                    placeholder="https://t.me/yourchannel"
                    className="w-full px-3 py-2 bg-[#1a1a1d] border border-purple-700/30 rounded-lg text-white text-sm font-mono"
                  />
                  {tutorialChannelLink && (
                    <p className="text-xs text-green-400">✅ Tutorial link set — lock screen এ দেখাবে</p>
                  )}
                </div>
              </div>

              {/* Bot & Channel Settings */}
              <div className="bg-[#1a1a1d] rounded-[20px] p-4 space-y-4 border border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-[10px] bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-base">⚙️</span>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Bot & Channel</h3>
                    <p className="text-zinc-600 text-[10px]">App এর bot, channel এবং link settings</p>
                  </div>
                </div>

                {/* Video Bot — for watch/download deeplinks */}
                <div className="bg-[#0d0d10] rounded-[16px] p-4 border border-white/5 space-y-3">
                  <p className="text-zinc-400 text-[11px] font-black uppercase tracking-widest">🎬 Video Bot (Watch / Download)</p>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Bot Username <span className="text-zinc-600">(@ ছাড়া)</span></label>
                    <input type="text" value={botUsername} onChange={(e) => setBotUsername(e.target.value.replace('@','').trim())}
                      placeholder="CineFlix_bot"
                      className="w-full px-4 py-3 bg-[#1a1a1d] border border-white/5 rounded-[12px] text-white text-sm outline-none focus:border-blue-500/30 transition-colors placeholder:text-zinc-700" />
                    <p className="text-zinc-600 text-[10px] mt-1">Movie watch/download এ Telegram deeplink এই bot দিয়ে হবে</p>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Mini App Name <span className="text-zinc-600">(Optional)</span></label>
                    <input type="text" value={appName} onChange={(e) => setAppName(e.target.value.replace('/','').replace('@','').trim())}
                      placeholder="app"
                      className="w-full px-4 py-3 bg-[#1a1a1d] border border-white/5 rounded-[12px] text-white text-sm outline-none focus:border-blue-500/30 transition-colors placeholder:text-zinc-700" />
                    <p className="text-zinc-600 text-[10px] mt-1">BotFather এ যে App Name দিয়েছ — খালি রাখলেও চলবে</p>
                  </div>
                </div>

                {/* Referral Bot — for referral links */}
                <div className="bg-[#0d0d10] rounded-[16px] p-4 border border-indigo-500/20 space-y-3">
                  <p className="text-indigo-400 text-[11px] font-black uppercase tracking-widest">🔗 Referral Bot (User Invite Link)</p>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Referral Bot Username <span className="text-zinc-600">(@ ছাড়া)</span></label>
                    <input type="text" value={referralBotUsername} onChange={(e) => setReferralBotUsername(e.target.value.replace('@','').trim())}
                      placeholder="CineFlix_bot"
                      className="w-full px-4 py-3 bg-[#1a1a1d] border border-indigo-500/20 rounded-[12px] text-white text-sm outline-none focus:border-indigo-500/40 transition-colors placeholder:text-zinc-700" />
                    <p className="text-zinc-600 text-[10px] mt-1">User দের referral link এ এই bot বসবে</p>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Referral App Name <span className="text-zinc-600">(Optional)</span></label>
                    <input type="text" value={referralAppName} onChange={(e) => setReferralAppName(e.target.value.replace('/','').replace('@','').trim())}
                      placeholder="app"
                      className="w-full px-4 py-3 bg-[#1a1a1d] border border-indigo-500/20 rounded-[12px] text-white text-sm outline-none focus:border-indigo-500/40 transition-colors placeholder:text-zinc-700" />
                    <p className="text-zinc-600 text-[10px] mt-1">খালি রাখলে: t.me/BOT?startapp=ref_... | দিলে: t.me/BOT/APP?startapp=ref_...</p>
                  </div>
                  {referralBotUsername && (
                    <div className="bg-indigo-500/10 rounded-[10px] p-3 border border-indigo-500/20">
                      <p className="text-indigo-300 text-[10px] font-bold">Preview:</p>
                      <p className="text-white text-xs font-mono mt-1 break-all">
                        https://t.me/{referralBotUsername}{referralAppName ? `/${referralAppName}` : ''}?startapp=ref_CIN123456
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">📢 Telegram Channel Link</label>
                  <p className="text-xs text-zinc-500 mb-2">Header এর Send আইকন এবং MovieDetails Telegram বাটনে এই link যাবে</p>
                  <input type="text" value={channelLink} onChange={(e) => setChannelLink(e.target.value)} placeholder="https://t.me/yourchannel" className="w-full px-4 py-3 bg-[#0d0d10] border border-white/5 rounded-[14px] text-white text-sm outline-none focus:border-amber-500/30 transition-colors placeholder:text-zinc-700" />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">🔔 Notice REQ Channel Link</label>
                  <p className="text-xs text-zinc-500 mb-2">Notice bar এর REQ বাটনে যাবে — খালি রাখলে উপরের Channel Link ব্যবহার হবে</p>
                  <input type="text" value={noticeChannelLink} onChange={(e) => setNoticeChannelLink(e.target.value)} placeholder="https://t.me/yourRequestChannel (Optional)" className="w-full px-4 py-3 bg-[#1a1a1d] border border-green-700/40 rounded-lg text-white" />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">📣 Notice Text (Marquee)</label>
                  <p className="text-xs text-zinc-500 mb-2">হোম পেজে scroll হওয়া notice বার এ যে লেখা দেখাবে</p>
                  <input
                    type="text"
                    value={noticeText}
                    onChange={(e) => setNoticeText(e.target.value)}
                    placeholder="যেকোনো ঘোষণা লিখুন..."
                    className="w-full px-4 py-3 bg-[#0d0d10] border border-white/5 rounded-[14px] text-white text-sm outline-none focus:border-amber-500/30 transition-colors placeholder:text-zinc-700"
                  />
                </div>

                <div className="flex items-center gap-3 p-3 bg-[#0d0d10] rounded-[14px] border border-white/5">
                  <input
                    type="checkbox"
                    checked={noticeEnabled}
                    onChange={(e) => setNoticeEnabled(e.target.checked)}
                    className="w-5 h-5 accent-yellow-500"
                  />
                  <div>
                    <label className="text-white font-medium">Notice Bar দেখানো হবে</label>
                    <p className="text-xs text-zinc-500">বন্ধ করলে notice bar হোম পেজে দেখাবে না</p>
                  </div>
                </div>

                <button
                  onClick={handleSaveSettings}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold"
                >
                  <Save size={18} className="inline mr-2" />
                  Save Settings
                </button>
              </div>

              {/* ===== FIRESTORE FIX SECTION ===== */}
              <div className="bg-red-950/40 border border-red-700/50 rounded-xl p-5 space-y-4">
                <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                  🔧 Firestore Permission Fix
                </h3>
                <p className="text-zinc-300 text-sm">
                  Delete বা Edit কাজ না করলে, Firestore Rules সমস্যা করছে। নিচের steps follow করুন:
                </p>

                {/* Test button */}
                <button
                  onClick={testFirestoreConnection}
                  disabled={loading}
                  className="w-full bg-blue-700 hover:bg-blue-600 text-white py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
                >
                  {loading ? '⏳ Testing...' : '🔍 Connection & Permission Test করুন'}
                </button>

                {/* Step by step fix guide */}
                <div className="space-y-3 text-sm">
                  <p className="text-yellow-400 font-bold">📋 Firestore Rules Fix Steps:</p>
                  
                  <div className="bg-[#1a1a1d]/80 rounded-lg p-3 space-y-2 text-zinc-300 text-xs leading-relaxed">
                    <p><span className="text-white font-bold">Step 1:</span> যাও → <span className="text-blue-400">console.firebase.google.com</span></p>
                    <p><span className="text-white font-bold">Step 2:</span> তোমার project select করো: <span className="text-yellow-300">cineflix-universe</span></p>
                    <p><span className="text-white font-bold">Step 3:</span> Left menu → <span className="text-white">Firestore Database</span></p>
                    <p><span className="text-white font-bold">Step 4:</span> উপরে <span className="text-white">Rules</span> ট্যাবে ক্লিক করো</p>
                    <p><span className="text-white font-bold">Step 5:</span> নিচের code টা paste করো এবং <span className="text-green-400">Publish</span> করো:</p>
                  </div>

                  {/* Rules code */}
                  <div className="bg-black rounded-lg p-3 border border-green-700/40 relative">
                    <p className="text-[10px] text-green-400 font-mono font-bold mb-2">// Firebase Firestore Rules — এটা copy করো</p>
                    <pre className="text-green-300 text-xs font-mono leading-relaxed whitespace-pre-wrap">{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}`}</pre>
                  </div>

                  <div className="bg-orange-950/40 border border-orange-700/30 rounded-lg p-3 text-xs text-orange-300">
                    ⚠️ এই rules দিলে: যে কেউ read করতে পারবে, কিন্তু <strong>শুধু logged-in admin</strong> write/delete করতে পারবে।
                  </div>
                </div>

                {/* Auth check */}
                <div className="bg-[#0d0d10] rounded-[14px] border border-white/5 p-3 text-xs text-zinc-400 flex items-center justify-between">
                  <span>Currently logged in as:</span>
                  <span className="text-green-400 font-bold">{user?.email || 'Unknown'}</span>
                </div>
              </div>

              {/* ── COIN SETTINGS ── */}
              <div className="bg-[#1a1a1d] rounded-[20px] p-5 space-y-4 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-[10px] bg-amber-500/10 flex items-center justify-center">
                    <Coins size={16} className="text-amber-400" />
                  </div>
                  <h3 className="text-base font-black text-white">🪙 Coin System Settings</h3>
                </div>
                <p className="text-xs text-zinc-500 -mt-2">এখান থেকে যেকোনো সময় change করলে সাথে সাথে সব user এর জন্য apply হবে</p>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: '🎁 Welcome Bonus', val: coinWelcome, set: setCoinWelcome },
                    { label: '📅 Daily Login', val: coinDaily, set: setCoinDaily },
                    { label: '👥 Per Refer', val: coinPerRefer, set: setCoinPerRefer },
                    { label: '🎯 5 Refer Milestone', val: coinMilestone5, set: setCoinMilestone5 },
                    { label: '⭐ 10 Refer Milestone', val: coinMilestone10, set: setCoinMilestone10 },
                    { label: '🏆 20 Refer Milestone', val: coinMilestone20, set: setCoinMilestone20 },
                    { label: '💎 50 Refer Milestone', val: coinMilestone50, set: setCoinMilestone50 },
                  ].map((item, i) => (
                    <div key={i} className="bg-[#0d0d10] rounded-[14px] p-3 border border-white/5">
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">{item.label}</p>
                      <div className="flex items-center gap-2">
                        <button onClick={() => item.set(Math.max(0, item.val - 5))} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0">
                          <MinusCircle size={14} />
                        </button>
                        <input
                          type="number"
                          value={item.val}
                          onChange={e => item.set(Number(e.target.value))}
                          className="flex-1 bg-transparent text-white text-center font-black text-base outline-none w-0"
                        />
                        <button onClick={() => item.set(item.val + 5)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0">
                          <PlusCircle size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                  <div className="bg-[#0d0d10] rounded-[14px] p-3 border border-white/5">
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">💱 Coin Rate</p>
                    <p className="text-zinc-400 text-[10px] mb-2">এত Coin = ৳10 Taka</p>
                    <input type="number" value={coinRate} onChange={e => setCoinRate(Number(e.target.value))}
                      className="w-full bg-transparent text-amber-400 font-black text-lg outline-none text-center" />
                  </div>
                  <div className="bg-[#0d0d10] rounded-[14px] p-3 border border-white/5">
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">💰 Min Withdraw</p>
                    <p className="text-zinc-400 text-[10px] mb-2">সর্বনিম্ন উঠানো যাবে</p>
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-500 font-black">৳</span>
                      <input type="number" value={minWithdraw} onChange={e => setMinWithdraw(Number(e.target.value))}
                        className="w-full bg-transparent text-emerald-400 font-black text-lg outline-none" />
                    </div>
                  </div>
                </div>

                {/* Ads-Free Coin System */}
                <div className="bg-[#0d0d10] rounded-[16px] p-4 border border-purple-500/20 space-y-3 mt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚡</span>
                      <div>
                        <p className="text-purple-300 text-sm font-black">Ads-Free with Coin</p>
                        <p className="text-zinc-600 text-[10px]">Coin দিয়ে 24hr content ads-free</p>
                      </div>
                    </div>
                    <button onClick={() => setAdsFreeEnabled(!adsFreeEnabled)}
                      className={`relative w-12 h-6 rounded-full transition-all ${adsFreeEnabled ? 'bg-purple-500' : 'bg-white/10'}`}>
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${adsFreeEnabled ? 'left-6' : 'left-0.5'}`} />
                    </button>
                  </div>
                  {adsFreeEnabled && (
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1.5">প্রতি Content এর জন্য কত Coin লাগবে?</label>
                      <div className="flex items-center gap-3 bg-[#1a1a1d] rounded-[12px] px-4 py-3 border border-purple-500/20">
                        <button onClick={() => setAdsFreeCoinsPerContent(Math.max(10, adsFreeCoinsPerContent - 10))} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white">−</button>
                        <input type="number" value={adsFreeCoinsPerContent} onChange={e => setAdsFreeCoinsPerContent(Number(e.target.value))}
                          className="flex-1 bg-transparent text-purple-300 font-black text-xl outline-none text-center" />
                        <button onClick={() => setAdsFreeCoinsPerContent(adsFreeCoinsPerContent + 10)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white">+</button>
                      </div>
                      <p className="text-zinc-600 text-[10px] mt-1.5">User {adsFreeCoinsPerContent} Coin দিয়ে যেকোনো একটি content 24 ঘণ্টার জন্য ads-free করতে পারবে</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// ===== WITHDRAWALS PANEL =====
const WithdrawalsPanel: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all'|'pending'|'success'|'cancelled'>('pending');
  const [noteModal, setNoteModal] = useState<{id:string;userId:string;currentNote:string}|null>(null);
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string|null>(null);
  const [wToast, setWToast] = useState('');

  const showWToast = (msg: string) => { setWToast(msg); setTimeout(() => setWToast(''), 3000); };

  useEffect(() => {
    const q = query(collection(db,'withdrawals'), orderBy('createdAt','desc'));
    const unsub = onSnapshot(q, snap => {
      setWithdrawals(snap.docs.map(d => ({id:d.id,...d.data()})));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const updateStatus = async (w: any, status: string) => {
    setActionLoading(w.id);
    try {
      await updateDoc(doc(db,'withdrawals',w.id), {status});
      if (status === 'cancelled' && w.userId) {
        await updateDoc(doc(db,'users',w.userId), {takaBalance: increment(w.amount||0)});
        await addDoc(collection(db,`users/${w.userId}/coinHistory`), {
          type: 'earn', reason: `🔄 Withdrawal Refund — ৳${w.amount}`, amount: 0, createdAt: serverTimestamp(),
        });
      }
      showWToast(status==='success' ? `✅ ৳${w.amount} Success করা হয়েছে` : `❌ Cancel — ৳${w.amount} ফেরত দেওয়া হয়েছে`);
    } catch(e) { showWToast('❌ Error হয়েছে'); }
    setActionLoading(null);
  };

  const saveNote = async () => {
    if (!noteModal) return;
    setSaving(true);
    try {
      await updateDoc(doc(db,'withdrawals',noteModal.id), {adminNote: noteText});
      showWToast('✅ Note save হয়েছে');
    } catch(e) {}
    setSaving(false);
    setNoteModal(null);
    setNoteText('');
  };

  const filtered = filter==='all' ? withdrawals : withdrawals.filter(w => w.status===filter);
  const pendingCount = withdrawals.filter(w => w.status==='pending').length;

  return (
    <div className="space-y-4 py-2 relative">
      {/* Toast */}
      <AnimatePresence>
        {wToast && (
          <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            className="fixed top-[70px] left-4 right-4 z-[70] bg-emerald-500/20 text-emerald-50 border border-emerald-500/30 backdrop-blur-xl px-4 py-3 rounded-2xl text-sm font-bold shadow-xl flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />{wToast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-white">💸 Withdrawal Requests</h2>
        {pendingCount > 0 && <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold animate-pulse">{pendingCount} Pending</span>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          {label:'Pending', val:withdrawals.filter(w=>w.status==='pending').length, color:'text-yellow-400', bg:'bg-yellow-500/10'},
          {label:'Success', val:withdrawals.filter(w=>w.status==='success').length, color:'text-emerald-400', bg:'bg-emerald-500/10'},
          {label:'Total ৳', val:`৳${withdrawals.filter(w=>w.status==='success').reduce((s,w)=>s+(w.amount||0),0).toFixed(0)}`, color:'text-blue-400', bg:'bg-blue-500/10'},
        ].map((s,i) => (
          <div key={i} className={`${s.bg} rounded-[14px] p-3 text-center border border-white/5`}>
            <p className={`${s.color} font-black text-lg`}>{s.val}</p>
            <p className="text-zinc-500 text-[10px] font-bold uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all','pending','success','cancelled'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
              filter===f ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' : 'bg-[#1a1a1d] text-zinc-400 hover:text-white border border-white/5'
            }`}>
            {f==='all'?`All (${withdrawals.length})`:f==='pending'?`⏳ Pending (${withdrawals.filter(w=>w.status==='pending').length})`:f==='success'?`✅ Success`:' ❌ Cancelled'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" /></div>
      ) : filtered.length===0 ? (
        <div className="text-center py-10 text-zinc-500 text-sm bg-[#1a1a1d] rounded-[20px] border border-white/5">কোনো request নেই</div>
      ) : filtered.map((w:any) => (
        <motion.div key={w.id} layout className="bg-[#1a1a1d] rounded-[20px] p-4 border border-white/5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center text-white font-black text-sm ${w.method==='bkash'?'bg-[#E2136E]':'bg-[#F15A22]'}`}>
                {w.method==='bkash'?'B':'N'}
              </div>
              <div>
                <p className="text-white font-bold">{w.userName}</p>
                <p className="text-zinc-400 text-sm">{w.number} · <span className="uppercase text-[11px]">{w.method}</span></p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-emerald-400 text-xl font-black">৳{w.amount}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                w.status==='pending'?'bg-yellow-500/20 text-yellow-400':
                w.status==='success'?'bg-emerald-500/20 text-emerald-400':'bg-red-500/20 text-red-400'
              }`}>
                {w.status==='pending'?'⏳ Pending':w.status==='success'?'✅ Success':'❌ Cancelled'}
              </span>
            </div>
          </div>

          {/* Admin note */}
          {w.adminNote && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-[12px] px-3 py-2 mb-3">
              <p className="text-blue-300 text-xs font-bold">📝 Admin Note:</p>
              <p className="text-zinc-300 text-xs mt-0.5">{w.adminNote}</p>
            </div>
          )}

          <p className="text-zinc-600 text-[10px] mb-3">{w.createdAt?.toDate?.()?.toLocaleString('bn-BD')||''} · ID: {w.userId}</p>

          {/* Actions */}
          <div className="flex gap-2">
            {w.status==='pending' && (
              <>
                <button onClick={() => updateStatus(w,'success')} disabled={actionLoading===w.id}
                  className="flex-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 py-2.5 rounded-[12px] text-sm font-bold transition-colors flex items-center justify-center gap-1">
                  {actionLoading===w.id ? <div className="w-4 h-4 border-2 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" /> : '✅ Success'}
                </button>
                <button onClick={() => updateStatus(w,'cancelled')} disabled={actionLoading===w.id}
                  className="flex-1 bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 py-2.5 rounded-[12px] text-sm font-bold transition-colors flex items-center justify-center gap-1">
                  ❌ Cancel
                </button>
              </>
            )}
            <button onClick={() => {setNoteModal({id:w.id,userId:w.userId,currentNote:w.adminNote||''}); setNoteText(w.adminNote||'');}}
              className="px-4 bg-white/5 hover:bg-white/10 text-zinc-300 py-2.5 rounded-[12px] text-sm font-bold transition-colors border border-white/5">
              📝 Note
            </button>
          </div>
        </motion.div>
      ))}

      {/* Note Modal */}
      <AnimatePresence>
        {noteModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-end justify-center px-4 pb-6"
            onClick={e => e.target===e.currentTarget && setNoteModal(null)}>
            <motion.div initial={{y:100,opacity:0}} animate={{y:0,opacity:1}} exit={{y:100,opacity:0}}
              className="bg-[#1a1a1d] rounded-[24px] p-6 w-full max-w-sm border border-white/10">
              <h3 className="text-white font-black text-lg mb-1">📝 User কে Message</h3>
              <p className="text-zinc-500 text-xs mb-4">এই note user এর withdrawal history তে দেখাবে</p>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                placeholder="যেমন: Payment পাঠানো হয়েছে। বা: তথ্য সঠিক নয়, আবার request করুন।"
                className="w-full bg-[#0d0d10] border border-white/10 rounded-[16px] px-4 py-3 text-white text-sm outline-none resize-none h-28 mb-4 focus:border-amber-500/30 transition-colors" />
              <div className="flex gap-3">
                <button onClick={() => setNoteModal(null)} className="flex-1 py-3 bg-white/5 text-zinc-300 rounded-[14px] font-bold border border-white/5">Cancel</button>
                <button onClick={saveNote} disabled={saving}
                  className="flex-1 py-3 bg-amber-500 text-black rounded-[14px] font-black">
                  {saving ? 'Saving...' : '💬 Send করো'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ===== DASHBOARD PANEL =====
const DashboardPanel: React.FC = () => {
  const [stats, setStats] = useState({ totalUsers: 0, todayUsers: 0, totalCoins: 0, totalRefers: 0, pendingWithdrawals: 0, totalWithdrawn: 0 });
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [topReferrers, setTopReferrers] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const today = new Date(); today.setHours(0, 0, 0, 0);

        const usersSnap = await getDocs(collection(db, 'users'));
        const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

        const todayUsers = allUsers.filter(u => {
          const joined = u.joinedAt?.toDate?.();
          return joined && joined >= today;
        }).length;

        const totalCoins = allUsers.reduce((s, u) => s + (u.coins || 0), 0);
        const totalRefers = allUsers.reduce((s, u) => s + (u.referralCount || 0), 0);

        const withdrawSnap = await getDocs(collection(db, 'withdrawals'));
        const allW = withdrawSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        const pending = allW.filter(w => w.status === 'pending').length;
        const totalWithdrawn = allW.filter(w => w.status === 'success').reduce((s, w) => s + (w.amount || 0), 0);

        setStats({ totalUsers: allUsers.length, todayUsers, totalCoins, totalRefers, pendingWithdrawals: pending, totalWithdrawn });

        const sorted = [...allUsers].sort((a, b) => (b.joinedAt?.seconds || 0) - (a.joinedAt?.seconds || 0));
        setRecentUsers(sorted.slice(0, 5));

        const topRef = [...allUsers].sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0));
        setTopReferrers(topRef.slice(0, 5));

        setLoading(false);
      } catch (e) { console.error(e); setLoading(false); }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" /></div>;

  const statCards = [
    { label: 'মোট User', value: stats.totalUsers.toLocaleString(), icon: '👥', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'আজকের নতুন', value: stats.todayUsers.toLocaleString(), icon: '🆕', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'মোট Coin', value: stats.totalCoins.toLocaleString(), icon: '🪙', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { label: 'মোট Refer', value: stats.totalRefers.toLocaleString(), icon: '🔗', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    { label: 'Pending Payment', value: stats.pendingWithdrawals.toLocaleString(), icon: '⏳', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    { label: 'মোট Withdrawn', value: `৳${stats.totalWithdrawn.toFixed(0)}`, icon: '💸', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  ];

  return (
    <div className="space-y-5 py-2">
      <h2 className="text-lg font-black text-white tracking-tight">📊 Dashboard</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`${s.bg} border rounded-[18px] p-4`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className={`${s.color} font-black text-xl`}>{s.value}</p>
            <p className="text-zinc-500 text-[11px] font-bold mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Top Referrers */}
      <div className="bg-[#1a1a1d] rounded-[20px] p-4 border border-white/5">
        <h3 className="text-sm font-black text-white mb-3 flex items-center gap-2">
          <span>🏆</span> Top Referrers
        </h3>
        {topReferrers.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-4">কোনো data নেই</p>
        ) : topReferrers.map((u, i) => (
          <div key={u.id} className={`flex items-center gap-3 py-2.5 ${i < topReferrers.length - 1 ? 'border-b border-white/5' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${
              i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-zinc-400 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-white/10 text-zinc-400'
            }`}>{i + 1}</div>
            {u.photo ? <img src={u.photo} className="w-8 h-8 rounded-full object-cover flex-shrink-0" /> : <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-zinc-500 text-xs font-bold">{u.name?.[0] || '?'}</div>}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold truncate">{u.name}</p>
              {u.username && <p className="text-zinc-500 text-[10px]">@{u.username}</p>}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-purple-400 font-black text-sm">{u.referralCount || 0} refer</p>
              <p className="text-amber-400 text-[10px] font-bold">{(u.coins || 0).toLocaleString()} coin</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Users */}
      <div className="bg-[#1a1a1d] rounded-[20px] p-4 border border-white/5">
        <h3 className="text-sm font-black text-white mb-3 flex items-center gap-2">
          <span>🆕</span> সর্বশেষ Join করা Users
        </h3>
        {recentUsers.map((u, i) => (
          <div key={u.id} className={`flex items-center gap-3 py-2.5 ${i < recentUsers.length - 1 ? 'border-b border-white/5' : ''}`}>
            {u.photo ? <img src={u.photo} className="w-9 h-9 rounded-full object-cover" /> : <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-zinc-400 text-sm font-bold">{u.name?.[0] || '?'}</div>}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold truncate">{u.name}</p>
              {u.username && <p className="text-zinc-500 text-[10px]">@{u.username}</p>}
            </div>
            <div className="text-right">
              <p className="text-amber-400 text-xs font-bold">{(u.coins || 0)} 🪙</p>
              <p className="text-zinc-600 text-[10px]">{u.joinedAt?.toDate?.()?.toLocaleDateString('bn-BD') || ''}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ===== USERS PANEL =====
const UsersPanel: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [coinAmount, setCoinAmount] = useState('');
  const [coinNote, setCoinNote] = useState('');
  const [coinLoading, setCoinLoading] = useState(false);
  const [coinType, setCoinType] = useState<'add' | 'remove'>('add');
  const [toast, setToast] = useState('');
  const [referrals, setReferrals] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'joined' | 'coins' | 'refers'>('joined');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selectedUser) return;
    const fetchRefs = async () => {
      const q = query(collection(db, 'users'), where('referredBy', '==', selectedUser.id));
      const snap = await getDocs(q);
      setReferrals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchRefs();
  }, [selectedUser]);

  const handleCoinAction = async () => {
    if (!selectedUser || !coinAmount) return;
    const amount = parseInt(coinAmount);
    if (isNaN(amount) || amount <= 0) return;
    setCoinLoading(true);
    try {
      const uid = selectedUser.id;
      const change = coinType === 'add' ? amount : -amount;
      await updateDoc(doc(db, 'users', uid), { coins: increment(change) });
      await addDoc(collection(db, `users/${uid}/coinHistory`), {
        type: coinType === 'add' ? 'earn' : 'spend',
        reason: coinNote || (coinType === 'add' ? '👑 Admin Bonus' : '👑 Admin Deduct'),
        amount,
        createdAt: serverTimestamp(),
      });
      showToast(`✅ ${coinType === 'add' ? '+' : '-'}${amount} Coin ${selectedUser.name} কে ${coinType === 'add' ? 'দেওয়া' : 'কাটা'} হয়েছে`);
      setCoinAmount(''); setCoinNote('');
    } catch (e) { showToast('❌ Error হয়েছে'); }
    setCoinLoading(false);
  };

  const filtered = users
    .filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.username?.toLowerCase().includes(search.toLowerCase()) || u.telegramId?.includes(search))
    .sort((a, b) => {
      if (sortBy === 'coins') return (b.coins || 0) - (a.coins || 0);
      if (sortBy === 'refers') return (b.referralCount || 0) - (a.referralCount || 0);
      return (b.joinedAt?.seconds || 0) - (a.joinedAt?.seconds || 0);
    });

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4 py-2">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-[70px] left-4 right-4 z-[70] bg-emerald-500/20 text-emerald-50 border border-emerald-500/30 backdrop-blur-xl px-4 py-3 rounded-2xl text-sm font-bold shadow-xl flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />{toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-white">👥 All Users <span className="text-zinc-500 text-sm font-normal">({users.length})</span></h2>
      </div>

      {/* Search */}
      <div className="bg-[#1a1a1d] border border-white/5 rounded-[16px] px-4 py-3 flex items-center gap-3">
        <Search size={16} className="text-zinc-500 flex-shrink-0" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="নাম, username বা ID দিয়ে খোঁজো..."
          className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-zinc-600" />
      </div>

      {/* Sort */}
      <div className="flex gap-2">
        {[{ id: 'joined', label: '🕐 নতুন' }, { id: 'coins', label: '🪙 Coin' }, { id: 'refers', label: '👥 Refer' }].map(s => (
          <button key={s.id} onClick={() => setSortBy(s.id as any)}
            className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all ${sortBy === s.id ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' : 'bg-white/5 text-zinc-500 hover:text-white'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* User List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 text-sm">কোনো user পাওয়া যায়নি</div>
        ) : filtered.map(u => (
          <motion.div key={u.id} layout className="bg-[#1a1a1d] border border-white/5 rounded-[18px] overflow-hidden">
            <button onClick={() => setSelectedUser(selectedUser?.id === u.id ? null : u)}
              className="w-full flex items-center gap-3 p-4 text-left">
              {u.photo ? <img src={u.photo} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                : <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-zinc-400 font-bold">{u.name?.[0] || '?'}</div>}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{u.name}</p>
                <p className="text-zinc-500 text-[11px]">{u.username ? `@${u.username}` : `ID: ${u.telegramId}`}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-amber-400 font-black text-sm">{(u.coins || 0).toLocaleString()} 🪙</p>
                <p className="text-zinc-500 text-[10px]">{u.referralCount || 0} refer</p>
              </div>
              {selectedUser?.id === u.id ? <ChevronUp size={16} className="text-zinc-500 flex-shrink-0" /> : <ChevronDown size={16} className="text-zinc-500 flex-shrink-0" />}
            </button>

            <AnimatePresence>
              {selectedUser?.id === u.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/5 overflow-hidden">
                  <div className="p-4 space-y-4">
                    {/* User Stats */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Coins', value: (u.coins || 0).toLocaleString(), color: 'text-amber-400' },
                        { label: 'Taka', value: `৳${(u.takaBalance || 0).toFixed(2)}`, color: 'text-emerald-400' },
                        { label: 'Refers', value: u.referralCount || 0, color: 'text-purple-400' },
                      ].map((s, i) => (
                        <div key={i} className="bg-[#0d0d10] rounded-[12px] p-2.5 text-center border border-white/5">
                          <p className={`${s.color} font-black text-base`}>{s.value}</p>
                          <p className="text-zinc-600 text-[10px] font-bold uppercase">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Referrals list */}
                    {referrals.length > 0 && (
                      <div className="bg-[#0d0d10] rounded-[14px] p-3 border border-white/5">
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">কাদের Refer করেছে ({referrals.length})</p>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          {referrals.map(r => (
                            <div key={r.id} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                              <p className="text-white text-xs font-medium truncate">{r.name}</p>
                              {r.username && <p className="text-zinc-600 text-[10px]">@{r.username}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Coin Add/Remove */}
                    <div className="bg-[#0d0d10] rounded-[14px] p-3 border border-amber-500/10 space-y-3">
                      <p className="text-zinc-400 text-[11px] font-black uppercase tracking-widest">👑 Admin — Coin দাও / কাটো</p>
                      <div className="flex gap-2">
                        <button onClick={() => setCoinType('add')}
                          className={`flex-1 py-2 rounded-[10px] text-xs font-black transition-all ${coinType === 'add' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-zinc-500'}`}>
                          + যোগ করো
                        </button>
                        <button onClick={() => setCoinType('remove')}
                          className={`flex-1 py-2 rounded-[10px] text-xs font-black transition-all ${coinType === 'remove' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-zinc-500'}`}>
                          − কাটো
                        </button>
                      </div>
                      <input type="number" value={coinAmount} onChange={e => setCoinAmount(e.target.value)} placeholder="Coin এর পরিমাণ"
                        className="w-full bg-[#1a1a1d] border border-white/5 rounded-[10px] px-3 py-2.5 text-white text-sm outline-none focus:border-amber-500/30" />
                      <input type="text" value={coinNote} onChange={e => setCoinNote(e.target.value)} placeholder="কারণ (Optional)"
                        className="w-full bg-[#1a1a1d] border border-white/5 rounded-[10px] px-3 py-2.5 text-white text-sm outline-none focus:border-amber-500/30" />
                      <button onClick={handleCoinAction} disabled={coinLoading || !coinAmount}
                        className={`w-full py-2.5 rounded-[10px] font-black text-sm transition-all ${coinAmount ? (coinType === 'add' ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white') : 'bg-white/5 text-zinc-600'}`}>
                        {coinLoading ? 'Processing...' : coinType === 'add' ? `+${coinAmount || '0'} Coin যোগ করো` : `-${coinAmount || '0'} Coin কাটো`}
                      </button>
                    </div>

                    <p className="text-zinc-600 text-[10px] text-center">Join: {u.joinedAt?.toDate?.()?.toLocaleDateString('bn-BD') || 'N/A'} · ID: {u.telegramId}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminPanel;

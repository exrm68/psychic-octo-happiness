# 🔧 CINEFLIX - Technical Documentation

## 📁 Project Structure

```
cineflix-improved/
├── App.tsx                 # Main application component
├── index.tsx              # React entry point
├── index.html             # HTML template
├── firebase.ts            # Firebase configuration
├── types.ts               # TypeScript interfaces
├── constants.ts           # App constants
├── components/
│   ├── AdminPanel.tsx     # Admin dashboard
│   ├── Banner.tsx         # Hero banner component
│   ├── BottomNav.tsx      # Bottom navigation
│   ├── ContinueWatchingCard.tsx  # Continue watching item
│   ├── Explore.tsx        # Search page
│   ├── JoinModal.tsx      # Channel join prompt
│   ├── MovieCard.tsx      # Movie card (unused)
│   ├── MovieDetails.tsx   # Movie detail modal
│   ├── MovieTile.tsx      # Movie grid item
│   ├── NoticeBar.tsx      # Announcement bar
│   ├── Sidebar.tsx        # Side menu
│   ├── SkeletonCard.tsx   # Loading skeleton
│   ├── SplashScreen.tsx   # Loading screen
│   ├── StoryCircle.tsx    # Story item
│   ├── StoryViewer.tsx    # Story modal
│   ├── TrendingRow.tsx    # Top 10 carousel
│   └── Watchlist.tsx      # Favorites list
├── package.json
├── tsconfig.json
├── vite.config.ts
├── CHANGELOG.md           # Version history
├── USER-GUIDE.md          # User manual
└── TECHNICAL.md           # This file
```

---

## 🏗️ Architecture

### State Management
- **React useState** for local component state
- **localStorage** for persistent data (favorites, continue watching)
- **Firebase Firestore** for real-time data sync
- **No external state management library** (Redux/Zustand not needed)

### Data Flow
```
Firebase Firestore (Source of Truth)
    ↓
onSnapshot (Real-time listeners)
    ↓
React State (Local cache)
    ↓
useMemo (Computed values)
    ↓
Components (Render)
```

---

## 🔥 Firebase Structure

### Collections:

#### 1. `movies` Collection
```typescript
{
  id: string (auto-generated)
  title: string
  thumbnail: string (URL)
  category: "Exclusive" | "Korean Drama" | "Series" | string
  telegramCode: string              // Watch/Stream code
  downloadCode?: string             // Download code (optional)
  downloadLink?: string             // External download link
  rating: number (0-10)
  views: string
  year?: string
  quality?: string ("HD", "4K", etc)
  description?: string
  episodes?: Episode[]              // For series
  
  // Premium flags
  isFeatured?: boolean              // Show in banner
  featuredOrder?: number            // Banner position
  isTop10?: boolean                 // Show in Top 10
  top10Position?: number            // Top 10 ranking
  storyImage?: string               // Story thumbnail
  storyEnabled?: boolean            // Show in stories
  priority?: number                 // Sorting priority
  isExclusive?: boolean             // Exclusive badge
  
  createdAt: Timestamp
}
```

#### 2. `banners` Collection
```typescript
{
  id: string
  movieId?: string        // Reference to movie
  title: string
  image: string           // Banner image URL
  description?: string
  link?: string           // External link
  order: number           // Display order
  isActive: boolean
  createdAt: Timestamp
}
```

#### 3. `stories` Collection
```typescript
{
  id: string
  image: string           // Circle image
  thumbnailUrl?: string   // Full story image
  movieId?: string        // Reference to movie
  link?: string           // External link
  order: number
  createdAt: Timestamp
}
```

#### 4. `settings/config` Document
```typescript
{
  botUsername: string
  channelLink: string
  noticeChannelLink?: string
  noticeText?: string
  noticeEnabled?: boolean
  autoViewIncrement?: boolean
  categories?: string[]
  
  // Premium settings
  enableTop10?: boolean
  enableStories?: boolean
  enableBanners?: boolean
  primaryColor?: string
  appName?: string
}
```

---

## 💻 Key Components

### App.tsx
**Purpose**: Main application shell  
**Responsibilities**:
- Route management (home/search/favorites)
- Firebase listeners
- State orchestration
- Modal management

**Key Features**:
- Continue Watching tracking
- Duplicate prevention with Map
- Auto banner rotation (5s interval)
- Scroll-based nav visibility

**State**:
```typescript
- movies: Movie[]                    // All content
- favorites: string[]                // Movie IDs
- continueWatching: {movieId, ts}[]  // Recent views
- selectedMovie: Movie | null        // Detail modal
- activeTab: Tab                     // Current view
- activeCategory: Category           // Filter
```

### MovieDetails.tsx
**Purpose**: Full-screen movie/series detail modal  
**Key Features**:
- Parallax background image
- Episode list with seasons
- Separate Watch/Download buttons
- Auto scroll to top

**Actions**:
- `handleWatch(code)`: Opens Telegram bot with watch code
- `handleDownload(code)`: Opens download link or Telegram

### AdminPanel.tsx
**Purpose**: Content management dashboard  
**Key Features**:
- Email/Password authentication
- Multi-tab interface (Content, Top 10, Banners, Stories, Settings)
- Episode inline edit with delete
- Drag-and-drop for Top 10 ordering
- Real-time preview

**Security**: Firebase Auth required

---

## 🎨 Styling System

### Tailwind Configuration
```javascript
colors: {
  gold: '#FFD700',
  card: '#0a0a0a',
  glass: 'rgba(255, 255, 255, 0.05)',
}

fontFamily: {
  sans: ['Manrope', 'sans-serif'],
  serif: ['Cinzel', 'serif'],
  brand: ['Bebas Neue', 'sans-serif'],
}

animation: {
  'pulse-gold': 'pulseGold 2s infinite',
}
```

### Custom Classes
- `.no-scrollbar`: Hide scrollbars
- `.mask-image-gradient`: Gradient mask for images

---

## 🔄 Data Synchronization

### Real-time Listeners

```typescript
// Movies
onSnapshot(query(collection(db, 'movies'), 
  orderBy('createdAt', 'desc'), 
  limit(100)
), (snapshot) => {
  // Process and deduplicate
  const movies = snapshot.docs.map(...)
  const unique = new Map()
  movies.forEach(m => unique.set(m.id, m))
  setMovies(Array.from(unique.values()))
})

// Settings
onSnapshot(doc(db, 'settings', 'config'), (doc) => {
  if (doc.exists()) setAppSettings(doc.data())
})
```

### LocalStorage Schema

```typescript
// Favorites
localStorage.setItem('cine_favs', JSON.stringify(movieIds[]))

// Continue Watching
localStorage.setItem('cine_continue', JSON.stringify([
  { movieId: string, timestamp: number },
  ...
]))
```

---

## 🚀 Performance Optimizations

### 1. Memoization
```typescript
const top10Movies = useMemo(() => {
  return movies
    .filter(m => m.isTop10)
    .sort((a, b) => (a.top10Position || 999) - (b.top10Position || 999))
    .slice(0, 10);
}, [movies]);
```

### 2. Lazy Loading
```tsx
<img loading="lazy" ... />
```

### 3. Passive Listeners
```typescript
window.addEventListener('scroll', handler, { passive: true });
```

### 4. Firebase Query Limits
```typescript
query(collection(db, 'movies'), orderBy('createdAt', 'desc'), limit(100))
```

### 5. Conditional Rendering
```tsx
{continueWatchingMovies.length > 0 && <Section />}
```

---

## 🔐 Security

### Firebase Rules (Recommended)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read
    match /movies/{movieId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /banners/{bannerId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /stories/{storyId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /settings/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Environment Variables
```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project
```

---

## 📱 Telegram Integration

### WebApp API
```typescript
// Expand WebApp
window.Telegram.WebApp.expand()

// Set colors
window.Telegram.WebApp.setHeaderColor('#000000')
window.Telegram.WebApp.setBackgroundColor('#000000')

// Haptic feedback
window.Telegram.WebApp.HapticFeedback.impactOccurred('light')
window.Telegram.WebApp.HapticFeedback.notificationOccurred('success')

// Open link
window.Telegram.WebApp.openTelegramLink(url)
```

### Deep Links
```
https://t.me/YOUR_BOT?start=MOVIE_CODE
```

---

## 🧪 Testing Checklist

### Functional Tests
- [ ] Movie upload (Admin)
- [ ] Series upload with episodes (Admin)
- [ ] Episode edit/delete (Admin)
- [ ] Top 10 add/remove (Admin)
- [ ] Banner management (Admin)
- [ ] Story management (Admin)
- [ ] Search functionality
- [ ] Favorite add/remove
- [ ] Continue watching tracking
- [ ] Category filtering
- [ ] Movie details modal
- [ ] Watch button (Telegram redirect)
- [ ] Download button

### UI/UX Tests
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Smooth animations
- [ ] Bottom nav hide/show on scroll
- [ ] Loading states
- [ ] Empty states
- [ ] Error handling

### Performance Tests
- [ ] Initial load time < 3s
- [ ] Smooth 60fps animations
- [ ] No memory leaks
- [ ] Efficient re-renders

---

## 🐛 Common Issues & Solutions

### Issue: Duplicate movies
**Solution**: Map-based deduplication in App.tsx
```typescript
const uniqueMap = new Map<string, Movie>();
fetchedMovies.forEach(m => uniqueMap.set(m.id, m));
const uniqueMovies = Array.from(uniqueMap.values());
```

### Issue: Episode delete not working
**Solution**: Filter array and update Firestore
```typescript
const updatedEps = movie.episodes.filter(e => e.id !== epId);
await updateDoc(doc(db, 'movies', movieId), { episodes: updatedEps });
```

### Issue: Firebase permission denied
**Solution**: Check Firestore rules and authentication

### Issue: Continue watching not showing
**Solution**: Check localStorage and movie click handler

---

## 🔮 Future Enhancements

### Phase 1 (Next Version)
- [ ] Infinite scroll
- [ ] Advanced filters (year, rating, genre)
- [ ] User authentication
- [ ] Watch history with progress tracking
- [ ] Server-side pagination

### Phase 2
- [ ] Comments/Reviews system
- [ ] User ratings
- [ ] Social sharing
- [ ] Push notifications
- [ ] Offline mode (PWA)

### Phase 3
- [ ] Recommendation engine (ML)
- [ ] Multi-language support
- [ ] Dark/Light theme toggle
- [ ] Analytics dashboard
- [ ] Content moderation

---

## 📚 Dependencies

### Production
```json
{
  "react": "18.2.0",
  "react-dom": "18.2.0",
  "framer-motion": "11.0.8",
  "lucide-react": "0.344.0",
  "firebase": "10.8.0"
}
```

### Dev
```json
{
  "@vitejs/plugin-react": "^5.0.0",
  "typescript": "~5.8.2",
  "vite": "^6.2.0"
}
```

---

## 🚢 Deployment

### Build
```bash
npm run build
```

### Preview
```bash
npm run preview
```

### Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```

### Deploy to Vercel/Netlify
- Connect GitHub repo
- Build command: `npm run build`
- Output directory: `dist`

---

## 📞 Support & Contributing

For bugs/features:
1. Create an issue
2. Fork the repo
3. Create a feature branch
4. Submit PR

---

**Version**: 4.0 Improved  
**Maintainer**: Cineflix Team  
**Last Updated**: February 11, 2026

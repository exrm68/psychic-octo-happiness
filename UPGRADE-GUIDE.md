# 🎬 Cineflix V5 - Premium Upgrade Guide

## ✨ What's New in V5

### 🎨 Premium Image Features (All Optional)

#### 1. **Detail Page Banner**
- আলাদা বড় banner detail page এ দেখানোর জন্য
- Home banner থেকে আলাদা হতে পারে
- Recommended: **16:9 widescreen** (1920x1080 বা 1280x720)
- Field: `detailBanner` (optional)

#### 2. **Screenshots Gallery**
- প্রতি মুভি/সিরিজে **4-8টা screenshots** যোগ করা যাবে
- Detail page এ beautiful gallery হিসেবে show হবে
- Click করলে fullscreen preview
- Field: `screenshots` array (optional)

#### 3. **Episode Thumbnails**
- প্রতি episode এর জন্য আলাদা thumbnail
- Recommended: **16:9 landscape** (640x360)
- না দিলে movie thumbnail ই ব্যবহার হবে
- Field: `episode.thumbnail` (optional)

---

### 📊 Enhanced Metadata (All Optional)

#### Movie/Series Level:
- `fileSize` - e.g., "2.5GB", "8.5GB"
- `duration` - e.g., "2h 15m", "1h 45m"
- `audioLanguage` - e.g., "Hindi Dual Audio + English DD+5.1"
- `subtitles` - e.g., "English, Hindi, Arabic"
- `videoQuality` - e.g., "4K HDR", "1080p BluRay"

#### Episode Level:
- `fileSize` - e.g., "450MB"
- `quality` - e.g., "1080p"
- `audioLanguage` - e.g., "Hindi 5.1"
- `subtitles` - e.g., "English, Hindi"

---

### 🔒 Coming Soon Feature

#### Episode Lock:
- Episode কে "Coming Soon" mark করা যাবে
- Lock 🔒 icon show হবে
- Click করা যাবে না
- Release date দেখানো যাবে
- Fields: `isComingSoon`, `releaseDate`

---

## 🛠️ How to Use

### Basic Movie/Series (No Changes Needed)
```javascript
// পুরানো মুভি/সিরিজ same ভাবে কাজ করবে
{
  title: "Extraction",
  thumbnail: "url",
  telegramCode: "EXT001",
  rating: 8.5,
  category: "Movie"
}
```

### Premium Movie (With All Features)
```javascript
{
  // Required fields (same as before)
  title: "Extraction 2",
  thumbnail: "https://...",
  telegramCode: "EXT002",
  rating: 8.8,
  category: "Movie",
  
  // ✨ NEW: Premium Images (optional)
  detailBanner: "https://...",  // Different detail page banner
  screenshots: [
    "https://screenshot1.jpg",
    "https://screenshot2.jpg",
    "https://screenshot3.jpg",
    "https://screenshot4.jpg"
  ],
  
  // ✨ NEW: Enhanced Metadata (optional)
  fileSize: "2.5GB",
  duration: "2h 10m",
  audioLanguage: "Hindi Dual Audio + English DD+5.1",
  subtitles: "English, Hindi, Arabic, Spanish",
  videoQuality: "1080p BluRay HEVC",
  
  // Other optional fields
  description: "...",
  year: "2024",
  downloadCode: "..."
}
```

### Premium Series (With Episode Thumbnails)
```javascript
{
  title: "Wednesday Season 2",
  thumbnail: "https://poster.jpg",
  category: "Series",
  
  // ✨ Premium features
  detailBanner: "https://widescreen-banner.jpg",
  screenshots: ["url1", "url2", "url3"],
  
  episodes: [
    {
      season: 1,
      number: 1,
      title: "Pilot",
      telegramCode: "WED_S01E01",
      
      // ✨ NEW: Episode premium features
      thumbnail: "https://ep1-thumb.jpg",  // Episode specific
      fileSize: "450MB",
      quality: "1080p",
      isComingSoon: false
    },
    {
      season: 1,
      number: 2,
      title: "Episode 2",
      telegramCode: "TBA",
      
      // ✨ Coming Soon Episode
      isComingSoon: true,
      releaseDate: "Feb 20, 2026"
    }
  ]
}
```

---

## 📱 Admin Panel Usage

### Adding Movie with Premium Features:

1. **Basic Info** (Required)
   - Title, Thumbnail, Category, Rating

2. **🎨 Premium Images** (Optional Section)
   - Detail Banner URL - আলাদা বড় banner
   - Screenshots - একটা একটা করে URL add করুন (max 8)

3. **📊 Enhanced Metadata** (Optional Section)
   - File Size, Duration
   - Audio Language, Subtitles
   - Video Quality

4. **Movie Code** (Required for movies)
   - Watch/Stream Code
   - Download Code (optional)

### Adding Series with Episode Features:

1. **Basic Series Info** (same as before)

2. **Add Each Episode:**
   - Season, Episode Number, Title
   - Watch Code (required)
   - Download Code (optional)
   
   **🎨 Premium (Collapsible):**
   - Episode Thumbnail URL (optional)
   - Coming Soon checkbox (lock episode)
   - Release Date (if coming soon)
   - File Size, Quality (optional)

---

## 🎯 Image Recommendations

### For Best Results:

| Image Type | Aspect Ratio | Size | Usage |
|------------|--------------|------|-------|
| Home Thumbnail | 2:3 (Poster) | 400x600 | Movie cards |
| Detail Banner | 16:9 (Wide) | 1920x1080 | Detail page top |
| Screenshots | 16:9 | 1280x720 | Gallery |
| Episode Thumb | 16:9 | 640x360 | Episode list |

### Free Image Hosting:
- **imgur.com** - Unlimited, direct links
- **telegra.ph** - Telegram's own hosting
- **cloudinary.com** - Free tier with CDN
- **imgbb.com** - Simple, no registration

---

## 🔄 Backward Compatibility

✅ **পুরানো সব মুভি/সিরিজ কাজ করবে**
- কোনো field required না (সব optional)
- Missing data থাকলে gracefully handle করবে
- Default behavior যেমন ছিল তেমন থাকবে

✅ **No Data Loss**
- Existing movies/series কোনো সমস্যা হবে না
- শুধু নতুন fields যোগ হয়েছে

✅ **Progressive Enhancement**
- Basic → যেমন আছে তেমন
- Premium → নতুন features use করলে upgraded look

---

## 💡 Pro Tips

### 1. **কখন কি ব্যবহার করবেন:**

**Basic Movie/Series:**
- Title, Thumbnail, Code, Rating - এইটুকুই যথেষ্ট
- দ্রুত upload করতে চাইলে

**Premium Content:**
- Special movies/series এর জন্য
- Extra polish চাইলে
- Professional look দিতে চাইলে

### 2. **Image URLs:**
- সবসময় HTTPS links use করুন
- Direct image links (ends with .jpg, .png, .webp)
- Short URLs (bit.ly, tinyurl) avoid করুন
- Test করে দেখুন image load হচ্ছে কিনা

### 3. **Coming Soon Episodes:**
- Future episodes pre-add করে lock করে রাখতে পারবেন
- Release date দিয়ে anticipation build করতে পারবেন
- Episode এ thumbnail দিলে locked preview দেখাবে

### 4. **Screenshots:**
- Different scenes/moments থেকে নিন
- Spoiler এড়িয়ে চলুন প্রথম দিকের screenshots এ
- High quality কিন্তু reasonable size (500KB-2MB each)

---

## 🚀 Deployment

### Same as Before:
1. Upload to GitHub
2. Connect to Vercel/Netlify
3. Set Firebase environment variables
4. Deploy!

### No Extra Setup Required:
- সব features built-in
- No extra dependencies
- No configuration changes

---

## 📞 Support

### If You Face Issues:

1. **Images not loading:**
   - Check URL is valid
   - Test in browser directly
   - Use HTTPS links
   - Try different hosting

2. **Episode thumbnails not showing:**
   - Make sure `thumbnail` field has URL
   - Check if image loads in browser
   - Fallback: movie thumbnail will show

3. **Coming Soon not working:**
   - Set `isComingSoon: true`
   - Optionally add `releaseDate`
   - Episode will be disabled

---

## 🎉 Enjoy!

**তুমি এখন Netflix/Prime Video স্টাইলের প্রফেশনাল মিনি অ্যাপ তৈরি করতে পারবে!**

- ✅ সব পুরানো features intact
- ✅ নতুন premium features optional
- ✅ Professional look and feel
- ✅ Easy to use admin panel
- ✅ Fully backward compatible

**Happy Streaming! 🎬**

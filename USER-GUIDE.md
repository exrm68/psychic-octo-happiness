# 📱 CINEFLIX - ইউজার গাইড

## 🎬 Features Overview

### ১. হোম স্ক্রিন
- **Banner Section**: Featured movies/series বড় করে দেখায়
- **Continue Watching**: যেসব content সম্প্রতি দেখেছেন (automatically track হয়)
- **Top 10 Trending**: সবচেয়ে জনপ্রিয় content
- **Latest Stories**: Instagram-style stories
- **Notice Bar**: Important announcements এবং channel links
- **Category Filter**: Exclusive, Korean Drama, Series, All
- **Movie Grid**: সব movies/series একসাথে

### ২. সার্চ
- Title, Category, Year দিয়ে search করুন
- Real-time suggestions
- Click করলেই movie details open হবে

### ৩. Watchlist (Favorites)
- Heart icon click করে favorite যোগ করুন
- My Collection থেকে সব favorites একসাথে দেখুন
- Remove button দিয়ে মুছে ফেলুন

---

## 🎯 কিভাবে ব্যবহার করবেন

### Movie/Series দেখার জন্য:
1. হোম স্ক্রিনে যেকোনো movie card click করুন
2. Movie details page খুলবে
3. **Play Now** বা episode list থেকে **Watch** button click করুন
4. Telegram bot এ redirect হবে যেখানে streaming link পাবেন

### Download করার জন্য:
1. Movie details page এ **Download** icon দেখুন
2. Episode list তে আলাদা **Download** button আছে
3. Click করলে Telegram bot বা direct link এ যাবে

### Favorite যোগ করার জন্য:
1. যেকোনো movie card এর উপরে **Heart** icon click করুন
2. Red হলে বুঝবেন favorite হয়েছে
3. Bottom nav থেকে **Heart** tab এ গিয়ে সব favorites দেখুন

### Continue Watching:
- Automatically track হয় - কিছু করতে হয় না
- যেকোনো movie click করলেই automatically যোগ হয়
- হোম স্ক্রিনে সবার উপরে দেখাবে

---

## 🔐 Admin Panel (শুধু Admins এর জন্য)

### কিভাবে Access করবেন:
1. **CINEFLIX** logo তে **5-7 বার** tap করুন দ্রুত
2. Admin login screen খুলবে
3. Email/Password দিয়ে login করুন

### Admin Features:

#### 📽️ Content Upload:
1. **Movie Upload**:
   - Title, Thumbnail URL যোগ করুন
   - Category select করুন (Exclusive, Series, Korean Drama)
   - Rating (1-10), Year যোগ করুন
   - Telegram Watch Code দিন (required)
   - Download Code আলাদা (optional)
   - Exclusive badge চাইলে checkbox টিক দিন
   - **Publish** click করুন

2. **Series Upload**:
   - Content Type: **Series** select করুন
   - Basic info যোগ করুন (উপরের মতো)
   - **Add Episode** section এ:
     - Season Number
     - Episode Number
     - Episode Title
     - Watch Code (required)
     - Download Code (optional)
     - **Add Episode** click করুন
   - সব episode add হলে **Publish** click করুন

#### ✏️ Episode Edit/Delete:
1. Content Management tab এ যান
2. যেকোনো series এর episode list দেখুন
3. **যেকোনো episode click করুন** - edit mode open হবে
4. Title, Watch Code, Download Code change করুন
5. **Save** করুন অথবা **Delete** করুন (Trash icon)

#### 🎭 Top 10 Management:
1. **Top 10** tab এ যান
2. Current Top 10 list দেখুন
3. **+ Add to Top 10** button click করুন
4. Movie select করুন dropdown থেকে
5. Position (1-10) choose করুন
6. **Add** click করুন
7. Drag করে reorder করতে পারবেন

#### 🎨 Banners & Stories:
- **Banners**: Main featured banner manage করুন
- **Stories**: Instagram-style stories add করুন
- Image URL এবং link provide করুন

#### ⚙️ Settings:
- Bot Username
- Channel Link (header Send button)
- Notice Channel Link (Notice bar এর REQ button)
- Notice Text
- Custom Categories

---

## 💾 Data Storage

### Local Storage:
- **Favorites**: Browser localStorage তে save হয়
- **Continue Watching**: Browser localStorage তে save হয়
- Device/Browser change করলে data হারিয়ে যাবে

### Firebase Storage:
- Movies/Series data
- Banners, Stories
- App Settings
- Real-time sync সব devices এ

---

## 📱 Telegram Integration

### Bot Features:
- `/start` command দিয়ে welcome message
- Movie code send করলে streaming link পাবেন
- Download links পাবেন
- Channel join করতে বলা হবে

### Channel:
- Latest uploads
- Announcements
- Request content

---

## 🎨 UI Elements Explained

### Icons:
- ❤️ Heart: Favorite toggle
- ⬇️ Download: Download available
- 🎬 Play: Watch now
- ⭐ Star: Rating
- 🔥 Trending badge
- ✨ Sparkles: Premium/Active state
- 📺 Episode indicator

### Badges:
- **EXCL**: Exclusive content
- **#1 TRENDING**: Featured banner item
- **DOWNLOAD**: Download সুবিধা আছে
- **HD/4K**: Quality badge

### Colors:
- **Gold (#FFD700)**: Premium, Featured, Active
- **Red**: Favorite, Remove
- **Green**: Download, Success
- **Blue**: Telegram, Links
- **Gray**: Inactive, Secondary

---

## 🐛 Troubleshooting

### Movies দেখাচ্ছে না:
- Firebase connection check করুন
- Internet connectivity দেখুন
- Admin panel থেকে content upload করেছেন কিনা check করুন

### Duplicate movies দেখাচ্ছে:
- এই version এ fix করা হয়েছে
- Refresh করুন পেজ

### Episode edit/delete কাজ করছে না:
- Episode click করে edit mode open করুন
- Changes save করার পর automatic refresh হবে

### Continue Watching দেখাচ্ছে না:
- কোনো movie click করেছেন কিনা check করুন
- localStorage clear করা হয়েছে কিনা দেখুন
- Browser incognito mode এ localStorage কাজ করবে না

---

## 🚀 Performance Tips

1. **Fast Loading**:
   - Images lazy load হয়
   - Firebase query limit 100 movies
   - Efficient re-renders

2. **Smooth Scrolling**:
   - Hardware acceleration enabled
   - Passive event listeners
   - Optimized animations

3. **Mobile Optimization**:
   - Touch-friendly buttons
   - Responsive grid
   - Bottom nav auto hide/show

---

## 📞 Support

কোনো সমস্যা হলে:
1. Telegram channel এ message করুন
2. Admin কে contact করুন
3. Issue report করুন

---

**Version**: 4.0 Improved  
**Last Updated**: February 11, 2026

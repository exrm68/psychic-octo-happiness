# ⚡ দ্রুত শুরু করুন - 10 মিনিটে Deploy!

## 🎯 এই Package এ সব আছে!

✅ Mini App (Complete UI)  
✅ Admin Panel (Perfect Working)  
✅ Firebase Ready  
✅ Demo Data (10 movies with real posters!)  
✅ Top 10, Banners, Stories - সব!  

**কোনো কালো স্ক্রিন না! সব কাজ করবে!** 🎉

---

## 🚀 3 Steps Deploy:

### **Step 1: Firebase (5 min)**

1. যান: https://console.firebase.google.com
2. Create Project → Name: `cineflix`
3. Firestore Database → Create → Test Mode → Enable
4. Authentication → Email/Password → Enable
5. Add User:
   - Email: `admin@cineflix.com`  
   - Password: `Admin@123`
6. Settings → Your apps → Web → Register
7. **Copy config!**

### **Step 2: Update Files (2 min)**

**firebase.ts খুলুন:**
```typescript
const firebaseConfig = {
  apiKey: "PASTE_HERE",
  authDomain: "PASTE_HERE",
  projectId: "PASTE_HERE",
  // ... paste all
};
```

**constants.ts খুলুন (Line 4):**
```typescript
export const BOT_USERNAME = 'YourBot';  ← Change
```

### **Step 3: Deploy (3 min)**

```bash
# Terminal এ:
npm install
npm run dev

# Test করুন local এ
# ঠিক থাকলে:

npm run build

# GitHub এ push করুন
# Vercel.com এ deploy করুন
```

✅ **Done! Live!** 🎊

---

## 🎮 Admin Access:

```
1. Site খুলুন
2. "CINEFLIX" logo তে 5-7 বার quickly tap করুন
3. Login: admin@cineflix.com / Admin@123
4. ✅ Access!
```

---

## 📊 যা আছে:

### **Demo Data (10 movies):**
- Squid Game S2 (Episodes সহ)
- Money Heist Korea (Episodes)
- All of Us Are Dead (Episodes)
- Stranger Things S5 (Episodes)
- Wednesday S2 (Episodes)
- Jawan (Movie)
- Pathaan (Movie)
- Avatar 2 (Movie)
- Oppenheimer (Movie)
- Dune 2 (Movie)

**সব real posters! কালো না!** ✅

---

## 🎯 Admin Features:

### **Upload Tab:**
- Movie/Series upload
- Episode management

### **Content Tab:**
- সব content list
- Edit/Delete

### **Top 10 Tab:**
- Netflix style ranking
- আপনার uploaded content থেকে select

### **Banners Tab:**
- Big banner (auto-rotate)
- আপনার content থেকে select

### **Stories Tab:**
- Instagram style
- আপনার content থেকে select

### **Settings Tab:**
- Bot username
- Channel link
- Notice text

---

## 💡 Quick Tips:

### **Poster Upload:**
```
1. Go to: https://imgbb.com
2. Upload image
3. Copy "Direct Link"
4. Paste in admin panel
```

### **Episode Add:**
```
Upload Tab → Series → Fill info
→ Add Episodes:
   S1E1, S1E2, S1E3...
→ Each episode = separate Watch/Download
```

### **Top 10:**
```
Upload some movies
→ Top 10 Tab
→ Click "Add" on any movie
→ Shows on home!
```

---

## ✅ Checklist:

### Before Deploy:
- [ ] Firebase config updated
- [ ] Bot username updated
- [ ] Test local: `npm run dev`
- [ ] No errors

### After Deploy:
- [ ] Site loads ✅
- [ ] Posters showing ✅
- [ ] Admin accessible ✅
- [ ] Can upload ✅
- [ ] Features working ✅

---

## 🐛 Common Issues:

**Q: Poster কালো?**  
A: ImgBB তে upload করে direct link use করুন

**Q: Admin না খুলছে?**  
A: Logo তে FAST 5-7 tap করুন (2 sec এর মধ্যে)

**Q: Firebase error?**  
A: Config ঠিকমত paste করেছেন?

**Q: Episode দেখাচ্ছে না?**  
A: Series select করেছেন? Episodes add করেছেন?

---

## 🎉 Ready!

**এখন deploy করুন!**

**README.md** file এ বিস্তারিত guide আছে!

**Happy Deploying! 🚀**

---

**Made with ❤️**  
**সব কিছু কাজ করবে! Guaranteed! 💯**

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Copy, CheckCheck, Send, ChevronRight, ArrowRight,
  ArrowDownToLine, History, Users, ArrowLeft, CheckCircle2,
  Coins, UserPlus, Wallet, ShieldCheck, XCircle, Gift, Star, Zap
} from 'lucide-react';
import {
  doc, getDoc, setDoc, updateDoc, collection,
  addDoc, onSnapshot, query, where, orderBy,
  serverTimestamp, increment, getDocs, limit
} from 'firebase/firestore';
import { db } from '../firebase';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initDataUnsafe?: {
          user?: { id: number; first_name: string; last_name?: string; username?: string; photo_url?: string; };
          start_param?: string;
        };
        openTelegramLink?: (url: string) => void;
        openLink?: (url: string) => void;
        HapticFeedback?: {
          impactOccurred: (style: 'light'|'medium'|'heavy'|'rigid'|'soft') => void;
          notificationOccurred: (type: 'error'|'success'|'warning') => void;
        };
      };
    };
  }
}

interface UserData {
  telegramId: string;
  name: string;
  username?: string;
  photo?: string;
  coins: number;
  takaBalance: number;
  referralCode: string;
  referredBy?: string;
  referralCount: number;
  joinedAt: any;
  lastLogin: any;
  milestonesClaimed: number[];
  unlockedMovies?: string[];
}

interface WithdrawalRequest {
  id?: string;
  userId: string;
  userName: string;
  amount: number;
  method: 'bkash' | 'nagad';
  number: string;
  status: 'pending' | 'success' | 'cancelled';
  adminNote?: string;
  createdAt: any;
}

interface CoinHistory {
  id?: string;
  type: 'earn' | 'spend';
  reason: string;
  amount: number;
  createdAt: any;
}

interface CoinSettings {
  coinWelcome: number;
  coinDaily: number;
  coinPerRefer: number;
  coinMilestone5: number;
  coinMilestone10: number;
  coinMilestone20: number;
  coinMilestone50: number;
  coinRate: number;
  minWithdraw: number;
  referralBotUsername: string;
  referralAppName: string;
}

const DEFAULT_CS: CoinSettings = {
  coinWelcome: 50, coinDaily: 5, coinPerRefer: 100,
  coinMilestone5: 50, coinMilestone10: 150, coinMilestone20: 400, coinMilestone50: 1000,
  coinRate: 1000, minWithdraw: 50,
  referralBotUsername: '', referralAppName: '',
};

interface UserProfileProps {
  onClose: () => void;
  botUsername: string;
}

const pv = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.28, ease: [0.25,0.8,0.25,1] } },
  exit: { opacity: 0, x: -24, transition: { duration: 0.2, ease: [0.25,0.8,0.25,1] } }
};

const haptic = (type: 'success'|'error'|'light'|'heavy' = 'light') => {
  const hf = window.Telegram?.WebApp?.HapticFeedback;
  if (!hf) return;
  if (type === 'success' || type === 'error') hf.notificationOccurred(type);
  else hf.impactOccurred(type);
};

const UserProfile: React.FC<UserProfileProps> = ({ onClose, botUsername }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<'main'|'earn'|'convert'|'withdraw'|'history'>('main');
  const [copied, setCopied] = useState(false);
  const [wMethod, setWMethod] = useState<'bkash'|'nagad'>('bkash');
  const [wNumber, setWNumber] = useState('');
  const [wAmount, setWAmount] = useState('');
  const [wLoading, setWLoading] = useState(false);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [coinHistory, setCoinHistory] = useState<CoinHistory[]>([]);
  const [toast, setToast] = useState<{msg: string; type: 'success'|'error'}|null>(null);
  const [convertCoins, setConvertCoins] = useState('');
  const [convertLoading, setConvertLoading] = useState(false);
  const [showConvertAnim, setShowConvertAnim] = useState(false);
  const [cs, setCs] = useState<CoinSettings>(DEFAULT_CS);

  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param ||
    (window.Telegram?.WebApp as any)?.initDataUnsafe?.startParam || '';

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    haptic(type); setToast({msg, type}); setTimeout(() => setToast(null), 3000);
  };

  // ── Load settings ──
  useEffect(() => {
    getDoc(doc(db, 'settings', 'config')).then(s => {
      if (!s.exists()) return;
      const d = s.data();
      setCs({
        coinWelcome:     d.coinWelcome     ?? DEFAULT_CS.coinWelcome,
        coinDaily:       d.coinDaily       ?? DEFAULT_CS.coinDaily,
        coinPerRefer:    d.coinPerRefer    ?? DEFAULT_CS.coinPerRefer,
        coinMilestone5:  d.coinMilestone5  ?? DEFAULT_CS.coinMilestone5,
        coinMilestone10: d.coinMilestone10 ?? DEFAULT_CS.coinMilestone10,
        coinMilestone20: d.coinMilestone20 ?? DEFAULT_CS.coinMilestone20,
        coinMilestone50: d.coinMilestone50 ?? DEFAULT_CS.coinMilestone50,
        coinRate:        d.coinRate        ?? DEFAULT_CS.coinRate,
        minWithdraw:     d.minWithdraw     ?? DEFAULT_CS.minWithdraw,
        referralBotUsername: (d.referralBotUsername || d.botUsername || '').replace('@','').trim(),
        referralAppName: (d.referralAppName || d.appName || '').replace('/','').trim(),
      });
    }).catch(() => {});
  }, []);

  const addCoinHistory = (uid: string, type: 'earn'|'spend', reason: string, amount: number) =>
    addDoc(collection(db, `users/${uid}/coinHistory`), {type, reason, amount, createdAt: serverTimestamp()});

  // ── Register / Login ──
  useEffect(() => {
    if (!tgUser) { setLoading(false); return; }
    (async () => {
      const uid = String(tgUser.id);
      const ref = doc(db, 'users', uid);
      try {
        const [snap, settingsSnap] = await Promise.all([getDoc(ref), getDoc(doc(db,'settings','config'))]);
        const sd = settingsSnap.exists() ? settingsSnap.data() : {};
        const welcomeBonus = sd.coinWelcome ?? DEFAULT_CS.coinWelcome;
        const dailyBonus   = sd.coinDaily   ?? DEFAULT_CS.coinDaily;

        if (!snap.exists()) {
          const code = `CIN${uid.slice(-6)}`;
          const nu: UserData = {
            telegramId: uid,
            name: `${tgUser.first_name}${tgUser.last_name ? ' '+tgUser.last_name : ''}`,
            username: tgUser.username, photo: tgUser.photo_url,
            coins: welcomeBonus, takaBalance: 0,
            referralCode: code, referralCount: 0,
            joinedAt: serverTimestamp(), lastLogin: serverTimestamp(),
            milestonesClaimed: [], unlockedMovies: [],
          };
          await setDoc(ref, nu);
          await addCoinHistory(uid, 'earn', `🎁 স্বাগত বোনাস`, welcomeBonus);
          if (startParam?.startsWith('ref_')) {
            const refCode = startParam.replace('ref_', '');
            const q = query(collection(db,'users'), where('referralCode','==',refCode), limit(1));
            const rs = await getDocs(q);
            if (!rs.empty && rs.docs[0].id !== uid) {
              await updateDoc(ref, {referredBy: rs.docs[0].id});
              await addDoc(collection(db,'pendingReferrals'), {
                referrerId: rs.docs[0].id, newUserId: uid, completed: false, createdAt: serverTimestamp(),
              });
            }
          }
          setUserData({...nu, joinedAt: new Date(), lastLogin: new Date()});
        } else {
          const data = snap.data() as UserData;
          const last = data.lastLogin?.toDate?.() || new Date(0);
          if (new Date().toDateString() !== last.toDateString()) {
            await updateDoc(ref, {coins: increment(dailyBonus), lastLogin: serverTimestamp()});
            await addCoinHistory(uid, 'earn', `📅 Daily Login বোনাস`, dailyBonus);
            showToast(`+${dailyBonus} Coin! Daily Login 🪙`);
          } else {
            await updateDoc(ref, {lastLogin: serverTimestamp()});
          }
          setUserData(data);
        }
      } catch(e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  // ── Realtime listeners ──
  useEffect(() => {
    if (!tgUser) return;
    const uid = String(tgUser.id);
    try { return onSnapshot(doc(db,'users',uid), s => { if(s.exists()) setUserData(s.data() as UserData); }); } catch(e) {}
  }, [tgUser]);

  useEffect(() => {
    if (!tgUser) return;
    const uid = String(tgUser.id);
    try {
      return onSnapshot(
        query(collection(db,'withdrawals'), where('userId','==',uid), limit(20)),
        s => setWithdrawals(
          s.docs.map(d => ({id:d.id,...d.data()} as WithdrawalRequest))
            .sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0))
        )
      );
    } catch(e) {}
  }, [tgUser]);

  useEffect(() => {
    if (!tgUser) return;
    const uid = String(tgUser.id);
    try {
      return onSnapshot(
        query(collection(db,`users/${uid}/coinHistory`), orderBy('createdAt','desc'), limit(50)),
        s => setCoinHistory(s.docs.map(d => ({id:d.id,...d.data()} as CoinHistory)))
      );
    } catch(e) {}
  }, [tgUser]);

  // ── Complete referral (video click trigger) ──
  const completeReferral = async () => {
    if (!tgUser) return;
    const userId = String(tgUser.id);
    try {
      const q = query(collection(db,'pendingReferrals'), where('newUserId','==',userId), where('completed','==',false), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) return;
      const pendingDoc = snap.docs[0];
      const { referrerId } = pendingDoc.data();
      await updateDoc(doc(db,'pendingReferrals',pendingDoc.id), {completed: true});
      const referrerSnap = await getDoc(doc(db,'users',referrerId));
      if (!referrerSnap.exists()) return;
      const referrerData = referrerSnap.data() as UserData;
      const newCount = (referrerData.referralCount || 0) + 1;
      const sd = (await getDoc(doc(db,'settings','config'))).data() || {};
      const perRefer = sd.coinPerRefer ?? DEFAULT_CS.coinPerRefer;
      const ms = [
        {count:5,  bonus: sd.coinMilestone5  ?? DEFAULT_CS.coinMilestone5},
        {count:10, bonus: sd.coinMilestone10 ?? DEFAULT_CS.coinMilestone10},
        {count:20, bonus: sd.coinMilestone20 ?? DEFAULT_CS.coinMilestone20},
        {count:50, bonus: sd.coinMilestone50 ?? DEFAULT_CS.coinMilestone50},
      ];
      await updateDoc(doc(db,'users',referrerId), {coins: increment(perRefer), referralCount: increment(1)});
      await addCoinHistory(referrerId, 'earn', `👥 Referral — ${userData?.name || 'নতুন বন্ধু'}`, perRefer);
      for (const m of ms) {
        if (newCount >= m.count && !referrerData.milestonesClaimed?.includes(m.count)) {
          await updateDoc(doc(db,'users',referrerId), {
            coins: increment(m.bonus),
            milestonesClaimed: [...(referrerData.milestonesClaimed||[]), m.count],
          });
          await addCoinHistory(referrerId, 'earn', `🎯 ${m.count} Refer Milestone Bonus!`, m.bonus);
        }
      }
    } catch(err) { console.error(err); }
  };

  useEffect(() => { (window as any).completeCinelixReferral = completeReferral; }, [tgUser, userData]);

  // ── Referral link ──
  const getLink = () => {
    if (!userData?.referralCode) return '';
    const bot = cs.referralBotUsername || botUsername.replace('@','').trim();
    if (!bot) return '';
    const app = cs.referralAppName;
    return app
      ? `https://t.me/${bot}/${app}?startapp=ref_${userData.referralCode}`
      : `https://t.me/${bot}?startapp=ref_${userData.referralCode}`;
  };

  const copyLink = async () => {
    const l = getLink();
    if (!l) { showToast('Admin এ Referral Bot Username set করা নেই!', 'error'); return; }
    try { await navigator.clipboard.writeText(l); } catch { }
    setCopied(true); haptic('success'); setTimeout(() => setCopied(false), 2000);
    showToast('Referral link copied! 🔗');
  };

  const shareLink = () => {
    const l = getLink();
    if (!l) { showToast('Admin এ Referral Bot Username set করা নেই!', 'error'); return; }
    const t = `🎬 *CineFlix* — বাংলাদেশের সেরা Movie App!\n\n🪙 Join করলেই পাবে *${cs.coinWelcome} Coin* বোনাস!\n💰 প্রতি refer এ পাবে *${cs.coinPerRefer} Coin*!\n\n👇 এখনই Join করো:\n${l}`;
    window.Telegram?.WebApp?.openTelegramLink?.(`https://t.me/share/url?url=${encodeURIComponent(l)}&text=${encodeURIComponent(t)}`);
    haptic('light');
  };

  // ── Derived ──
  const convertUnit  = cs.coinRate;
  const convertedTaka = parseInt(convertCoins) >= convertUnit
    ? ((parseInt(convertCoins) / cs.coinRate) * 10).toFixed(2) : null;
  const canWithdraw = (userData?.takaBalance || 0) >= cs.minWithdraw;
  const canConvert  = (userData?.coins || 0) >= convertUnit;
  const progressPct = Math.min(100, ((userData?.coins || 0) / cs.coinRate) * 100);
  const milestones  = [
    {count:5,  bonus: cs.coinMilestone5},
    {count:10, bonus: cs.coinMilestone10},
    {count:20, bonus: cs.coinMilestone20},
    {count:50, bonus: cs.coinMilestone50},
  ];
  const nextMilestone = milestones.find(m => (userData?.referralCount||0) < m.count);

  // ── Convert ──
  const handleConvert = async () => {
    if (!tgUser || !userData) return;
    const coins = parseInt(convertCoins);
    if (!coins || coins < convertUnit || coins % convertUnit !== 0) {
      showToast(`${convertUnit.toLocaleString()} এর গুণিতক দাও!`, 'error'); return;
    }
    if (coins > userData.coins) { showToast('Coin কম!', 'error'); return; }
    const taka = (coins / cs.coinRate) * 10;
    setConvertLoading(true); setShowConvertAnim(true); haptic('heavy');
    setTimeout(async () => {
      try {
        await updateDoc(doc(db,'users',String(tgUser.id)), {coins: increment(-coins), takaBalance: increment(taka)});
        await addCoinHistory(String(tgUser.id), 'spend', `💱 ${coins} Coin → ৳${taka}`, coins);
        haptic('success'); setConvertCoins(''); setScreen('main');
        showToast(`৳${taka} Balance এ যোগ হয়েছে! 💰`);
      } catch(e) { showToast('Error! আবার try করো', 'error'); }
      setConvertLoading(false); setShowConvertAnim(false);
    }, 1200);
  };

  // ── Withdraw ──
  const handleWithdraw = async () => {
    if (!tgUser || !userData) return;
    const amount = parseFloat(wAmount);
    if (!wNumber || wNumber.length < 11) { showToast('সঠিক নম্বর দাও!', 'error'); return; }
    if (!amount || amount < cs.minWithdraw) { showToast(`Minimum ৳${cs.minWithdraw}!`, 'error'); return; }
    if (amount > userData.takaBalance) { showToast('Balance কম!', 'error'); return; }
    setWLoading(true);
    try {
      const wRef = await addDoc(collection(db,'withdrawals'), {
        userId: String(tgUser.id), userName: userData.name, amount,
        method: wMethod, number: wNumber,
        status: 'pending', adminNote: '', createdAt: serverTimestamp(),
      });
      // Also add to user's own withdrawalHistory subcollection for guaranteed realtime
      await setDoc(doc(db, `users/${String(tgUser.id)}/withdrawalRefs/${wRef.id}`), {
        withdrawalId: wRef.id, amount, method: wMethod, number: wNumber,
        status: 'pending', createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db,'users',String(tgUser.id)), {takaBalance: increment(-amount)});
      haptic('success'); setWNumber(''); setWAmount(''); setScreen('main');
      showToast('Withdrawal Request পাঠানো হয়েছে! ✅');
    } catch(e) { showToast('Error! আবার try করো', 'error'); }
    setWLoading(false);
  };

  const ft = (ts: any) => {
    if (!ts) return '';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('bn-BD', {day:'numeric', month:'short', year:'numeric'});
  };

  // ── Not Telegram ──
  if (!tgUser && !loading) return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-50 bg-[#0d0d10] flex flex-col items-center justify-center px-6 text-center">
      <button onClick={onClose} className="absolute top-5 right-5 p-2.5 bg-white/10 rounded-full"><X size={20} className="text-white" /></button>
      <div className="w-20 h-20 bg-blue-600 rounded-[24px] flex items-center justify-center mb-5 shadow-[0_0_40px_rgba(37,99,235,0.4)]"><Send size={32} className="text-white" /></div>
      <h1 className="text-white text-2xl font-bold mb-2">Telegram Mini App</h1>
      <p className="text-zinc-400 text-sm">এই feature শুধু Telegram এ কাজ করে।</p>
    </motion.div>
  );

  if (loading) return (
    <div className="fixed inset-0 z-50 bg-[#0d0d10] flex items-center justify-center">
      <motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:'linear'}}
        className="w-12 h-12 border-2 border-amber-500/20 border-t-amber-500 rounded-full" />
    </div>
  );

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-50 bg-[#0d0d10] overflow-hidden flex flex-col font-sans text-white">

      {/* Convert Anim */}
      <AnimatePresence>
        {showConvertAnim && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="absolute inset-0 z-[100] bg-black/70 backdrop-blur-xl flex flex-col items-center justify-center">
            <motion.div initial={{scale:0,rotate:-180,y:50}} animate={{scale:1,rotate:0,y:0}}
              transition={{type:'spring',damping:15,stiffness:200}}
              className="relative w-32 h-32 flex items-center justify-center mb-6">
              <div className="absolute inset-0 bg-amber-500 rounded-full blur-2xl opacity-40 animate-pulse" />
              <div className="w-full h-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-yellow-200 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(251,191,36,0.5)] border-4 border-yellow-100 relative z-10">
                <Coins size={56} className="text-amber-900" />
              </div>
            </motion.div>
            <motion.h2 initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.2}} className="text-3xl font-black text-white mb-2">Converting...</motion.h2>
            <motion.p initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.3}} className="text-amber-400 font-medium">Processing your transaction</motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{opacity:0,y:-40,scale:0.9}} animate={{opacity:1,y:16,scale:1}} exit={{opacity:0,y:-40,scale:0.9}} transition={{type:'spring',damping:20}}
            className={`absolute top-0 left-4 right-4 z-[70] px-4 py-3.5 rounded-2xl text-sm font-bold shadow-2xl flex items-center gap-3 backdrop-blur-xl border ${
              toast.type==='success' ? 'bg-emerald-500/20 text-emerald-50 border-emerald-500/30' : 'bg-red-500/20 text-red-50 border-red-500/30'
            }`}>
            {toast.type==='success' ? <CheckCircle2 size={20} className="text-emerald-400" /> : <XCircle size={20} className="text-red-400" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">

        {/* ═══ MAIN ═══ */}
        {screen==='main' && (
          <motion.div key="main" variants={pv} initial="initial" animate="animate" exit="exit" className="flex-1 overflow-y-auto pb-10">

            {/* Header */}
            <div className="flex items-center justify-between pt-8 pb-5 px-5 sticky top-0 bg-[#0d0d10]/80 backdrop-blur-xl z-20">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/10 bg-[#1c1c1e] flex items-center justify-center shadow-lg">
                    {userData?.photo ? <img src={userData.photo} className="w-full h-full object-cover" alt="" /> : <Users size={24} className="text-zinc-500" />}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#0d0d10] flex items-center justify-center z-10">
                    <ShieldCheck size={10} className="text-black" />
                  </div>
                </div>
                <div>
                  <h2 className="text-[20px] font-bold text-white truncate max-w-[180px] tracking-tight">{userData?.name||'Loading...'}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[9px] font-black uppercase tracking-widest rounded-md">PRO</span>
                    {userData?.username && <p className="text-zinc-500 text-xs truncate max-w-[120px]">@{userData.username}</p>}
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2.5 bg-[#1c1c1e] hover:bg-[#2c2c2e] rounded-full transition-colors"><X size={20} className="text-zinc-400" /></button>
            </div>

            {/* Invite Card */}
            <div className="px-4 mb-5">
              <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 rounded-[28px] p-5 shadow-[0_10px_40px_rgba(37,99,235,0.2)] relative overflow-hidden border border-white/10">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-[14px] bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/10"><UserPlus size={20} className="text-white" /></div>
                      <span className="font-bold text-white text-lg tracking-tight">Invite & Earn</span>
                    </div>
                    <div className="bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 flex items-center gap-2">
                      <Users size={13} className="text-blue-200" />
                      <span className="text-sm font-black text-white">{userData?.referralCount||0}</span>
                    </div>
                  </div>
                  <p className="text-blue-100 text-sm mb-4 font-medium">
                    প্রতি সফল refer এ পাও{' '}
                    <span className="text-amber-300 font-black bg-amber-500/20 px-1.5 py-0.5 rounded-md">{cs.coinPerRefer} Coins</span>
                  </p>
                  <div className="flex items-center gap-2.5">
                    <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl flex items-center px-4 py-3 justify-between backdrop-blur-md">
                      <span className="text-white/90 font-mono text-sm font-bold truncate pr-2 tracking-wider">{userData?.referralCode||'...'}</span>
                      <button onClick={copyLink} className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors flex-shrink-0">
                        {copied ? <CheckCheck size={18} className="text-emerald-400" /> : <Copy size={18} />}
                      </button>
                    </div>
                    <motion.button whileTap={{scale:0.95}} onClick={shareLink}
                      className="px-5 py-3 bg-white text-blue-700 rounded-2xl font-black text-sm flex items-center gap-2 flex-shrink-0 shadow-[0_4px_15px_rgba(255,255,255,0.15)]">
                      <Send size={16} /> Share
                    </motion.button>
                  </div>
                  {!cs.referralBotUsername && (
                    <p className="text-amber-300/80 text-[10px] mt-3 flex items-center gap-1">
                      <XCircle size={11} /> Admin এ Referral Bot Username set করা নেই
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Balance Card */}
            <div className="px-4 mb-5">
              <div className="bg-[#1a1a1d] border border-white/5 rounded-[28px] p-5 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="flex justify-between items-center relative z-10 mb-5">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-zinc-500 text-[11px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Wallet size={11} className="text-emerald-500" /> Taka Balance</p>
                    <p className="text-4xl font-black text-emerald-400 truncate tracking-tight"><span className="text-2xl mr-0.5 text-emerald-500/50">৳</span>{(userData?.takaBalance||0).toFixed(2)}</p>
                  </div>
                  <div className="text-right flex-1 min-w-0 pl-4 border-l border-white/5">
                    <p className="text-zinc-500 text-[11px] font-black uppercase tracking-widest mb-1.5">Coins</p>
                    <p className="text-2xl font-black text-amber-400 flex items-center justify-end gap-1.5 truncate">
                      <Coins size={20} className="text-amber-500 flex-shrink-0" /><span className="truncate">{(userData?.coins||0).toLocaleString()}</span>
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/5 relative z-10">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-zinc-500">Conversion Goal</span>
                    <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">{Math.min(userData?.coins||0,cs.coinRate).toLocaleString()} / {cs.coinRate.toLocaleString()} 🪙 = ৳10</span>
                  </div>
                  <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                    <motion.div className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full"
                      initial={{width:0}} animate={{width:`${progressPct}%`}} transition={{duration:1,ease:'easeOut'}} />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="px-4 grid grid-cols-3 gap-3 mb-5">
              {[
                {label:'Total Refer', value:userData?.referralCount||0,  icon:Users,  color:'text-blue-400',    bg:'bg-blue-500/10 border-blue-500/15'},
                {label:'Coins',       value:(userData?.coins||0).toLocaleString(), icon:Coins, color:'text-amber-400',  bg:'bg-amber-500/10 border-amber-500/15'},
                {label:'Balance',     value:`৳${(userData?.takaBalance||0).toFixed(0)}`, icon:Wallet, color:'text-emerald-400', bg:'bg-emerald-500/10 border-emerald-500/15'},
              ].map((s,i) => (
                <div key={i} className={`${s.bg} border rounded-[20px] p-3.5 text-center`}>
                  <s.icon size={18} className={`${s.color} mx-auto mb-1.5`} />
                  <p className={`${s.color} font-black text-base`}>{s.value}</p>
                  <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="px-4 grid grid-cols-2 gap-3 mb-4">
              <motion.button whileTap={{scale:0.96}}
                onClick={() => canConvert ? setScreen('convert') : showToast(`Minimum ${convertUnit.toLocaleString()} coin দরকার!`,'error')}
                className="bg-[#1a1a1d] border border-white/5 rounded-[24px] p-4 flex flex-col items-center gap-3 hover:bg-[#242427] transition-colors">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${canConvert?'bg-amber-500/10 text-amber-400 border border-amber-500/20':'bg-white/5 text-zinc-500'}`}><ArrowRight size={26} /></div>
                <div className="text-center">
                  <span className={`font-bold text-sm block ${canConvert?'text-white':'text-zinc-500'}`}>Convert</span>
                  <span className="text-[11px] text-zinc-600">Coins to Taka</span>
                </div>
              </motion.button>
              <motion.button whileTap={{scale:0.96}}
                onClick={() => canWithdraw ? setScreen('withdraw') : showToast(`Minimum ৳${cs.minWithdraw} দরকার!`,'error')}
                className="bg-[#1a1a1d] border border-white/5 rounded-[24px] p-4 flex flex-col items-center gap-3 hover:bg-[#242427] transition-colors">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${canWithdraw?'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20':'bg-white/5 text-zinc-500'}`}><ArrowDownToLine size={26} /></div>
                <div className="text-center">
                  <span className={`font-bold text-sm block ${canWithdraw?'text-white':'text-zinc-500'}`}>Withdraw</span>
                  <span className="text-[11px] text-zinc-600">bKash / Nagad</span>
                </div>
              </motion.button>
            </div>

            <div className="px-4 space-y-3">
              <motion.button whileTap={{scale:0.98}} onClick={() => setScreen('earn')}
                className="w-full bg-[#1a1a1d] border border-white/5 rounded-[22px] p-4 flex items-center justify-between hover:bg-[#242427] transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-[14px] bg-amber-500/10 border border-amber-500/15 flex items-center justify-center text-amber-400"><Gift size={19} /></div>
                  <div className="text-left"><span className="font-bold text-sm text-white block">Earn More Coins</span><span className="text-[11px] text-zinc-500">Referral, Daily, Milestones</span></div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"><ChevronRight size={16} className="text-zinc-500" /></div>
              </motion.button>
              <motion.button whileTap={{scale:0.98}} onClick={() => setScreen('history')}
                className="w-full bg-[#1a1a1d] border border-white/5 rounded-[22px] p-4 flex items-center justify-between hover:bg-[#242427] transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-[14px] bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400"><History size={19} /></div>
                  <span className="font-bold text-sm text-white">Transaction History</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"><ChevronRight size={16} className="text-zinc-500" /></div>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ═══ EARN ═══ */}
        {screen==='earn' && (
          <motion.div key="earn" variants={pv} initial="initial" animate="animate" exit="exit" className="flex-1 overflow-y-auto flex flex-col">
            <div className="px-4 py-4 flex items-center gap-3 border-b border-white/5 sticky top-0 bg-[#0d0d10]/80 backdrop-blur-xl z-20">
              <button onClick={() => setScreen('main')} className="p-2.5 bg-[#1a1a1d] rounded-full"><ArrowLeft size={20} /></button>
              <h2 className="text-xl font-bold">Earn Coins</h2>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-zinc-500 text-[11px] font-black uppercase tracking-widest px-1 mb-1">কিভাবে Coin আয় করবে</p>
              {[
                {icon:'🎁', title:'নতুন Join',       desc:'প্রথমবার app open করলে',        coin:`+${cs.coinWelcome}`,     color:'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'},
                {icon:'👥', title:'Friend Refer',    desc:'বন্ধু প্রথম video click করলে', coin:`+${cs.coinPerRefer}`,    color:'text-amber-400 bg-amber-500/10 border-amber-500/20'},
                {icon:'📅', title:'Daily Login',     desc:'প্রতিদিন app open করলে',       coin:`+${cs.coinDaily}`,       color:'text-blue-400 bg-blue-500/10 border-blue-500/20'},
                {icon:'🎯', title:'5 Refer Bonus',   desc:'5 জন refer complete হলে',      coin:`+${cs.coinMilestone5}`,  color:'text-purple-400 bg-purple-500/10 border-purple-500/20'},
                {icon:'⭐', title:'10 Refer Bonus',  desc:'10 জন refer complete হলে',     coin:`+${cs.coinMilestone10}`, color:'text-purple-400 bg-purple-500/10 border-purple-500/20'},
                {icon:'🏆', title:'20 Refer Bonus',  desc:'20 জন refer complete হলে',     coin:`+${cs.coinMilestone20}`, color:'text-purple-400 bg-purple-500/10 border-purple-500/20'},
                {icon:'💎', title:'50 Refer Bonus',  desc:'50 জন refer complete হলে',     coin:`+${cs.coinMilestone50}`, color:'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'},
              ].map((item,i) => (
                <motion.div key={i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                  className="flex items-center gap-4 bg-[#1a1a1d] rounded-[20px] p-4 border border-white/5">
                  <div className="text-2xl w-10 h-10 flex items-center justify-center">{item.icon}</div>
                  <div className="flex-1"><p className="text-white text-sm font-bold">{item.title}</p><p className="text-zinc-500 text-xs mt-0.5">{item.desc}</p></div>
                  <span className={`font-black text-sm px-3 py-1 rounded-xl border ${item.color}`}>{item.coin}</span>
                </motion.div>
              ))}

              <p className="text-zinc-500 text-[11px] font-black uppercase tracking-widest px-1 mt-5 mb-1">Coin → Taka Rate</p>
              <div className="bg-[#1a1a1d] rounded-[20px] overflow-hidden border border-white/5">
                {[1,2,5,10].map((mult,i) => {
                  const c = cs.coinRate*mult; const t = 10*mult;
                  const has = (userData?.coins||0) >= c;
                  return (
                    <div key={i} className={`flex items-center justify-between px-4 py-3.5 ${i<3?'border-b border-white/5':''}`}>
                      <span className={`text-sm font-bold ${has?'text-amber-400':'text-zinc-600'}`}>🪙 {c.toLocaleString()}</span>
                      <ArrowRight size={14} className="text-zinc-700" />
                      <span className={`text-sm font-bold ${has?'text-emerald-400':'text-zinc-600'}`}>৳ {t}</span>
                    </div>
                  );
                })}
              </div>

              {nextMilestone && (
                <div className="bg-purple-500/10 rounded-[20px] p-4 border border-purple-500/20 mt-2">
                  <div className="flex items-center gap-2 mb-2"><Star size={15} className="text-purple-400" /><span className="text-purple-300 text-sm font-bold">পরের Milestone</span></div>
                  <p className="text-white text-sm">আর <span className="text-amber-400 font-black">{nextMilestone.count-(userData?.referralCount||0)} জন</span> refer করলে extra <span className="text-amber-400 font-black">{nextMilestone.bonus} coin</span> পাবে!</p>
                  <div className="mt-3 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-purple-400 rounded-full" initial={{width:0}}
                      animate={{width:`${Math.min(100,((userData?.referralCount||0)/nextMilestone.count)*100)}%`}} transition={{duration:0.8}} />
                  </div>
                </div>
              )}
              <motion.button whileTap={{scale:0.98}}
                onClick={() => canConvert ? setScreen('convert') : showToast(`Minimum ${convertUnit.toLocaleString()} coin দরকার!`,'error')}
                className={`w-full py-4 rounded-[20px] font-black text-sm flex items-center justify-center gap-2 mt-2 ${canConvert?'bg-gradient-to-r from-amber-500 to-yellow-400 text-black':'bg-white/5 text-zinc-500 border border-white/5'}`}>
                <Coins size={18} />{canConvert?'Coin → Taka Convert করো':`আরো ${Math.max(0,convertUnit-(userData?.coins||0))} coin দরকার`}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ═══ CONVERT ═══ */}
        {screen==='convert' && (
          <motion.div key="convert" variants={pv} initial="initial" animate="animate" exit="exit" className="flex-1 overflow-y-auto flex flex-col">
            <div className="px-4 py-4 flex items-center gap-3 border-b border-white/5 sticky top-0 bg-[#0d0d10]/80 backdrop-blur-xl z-20">
              <button onClick={() => setScreen('main')} className="p-2.5 bg-[#1a1a1d] rounded-full"><ArrowLeft size={20} /></button>
              <h2 className="text-xl font-bold">Convert Coins</h2>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="bg-[#1a1a1d] border border-white/5 rounded-[20px] p-4 mb-8 flex justify-between items-center">
                <span className="text-zinc-400 text-sm font-bold uppercase tracking-wider">Available</span>
                <span className="text-amber-400 font-black text-xl flex items-center gap-1.5 bg-amber-500/10 px-3 py-1 rounded-xl"><Coins size={18} /> {(userData?.coins||0).toLocaleString()}</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center mb-8">
                <p className="text-zinc-500 text-[11px] font-black uppercase tracking-widest mb-3">You Pay (Coins)</p>
                <input type="number" value={convertCoins} onChange={e => setConvertCoins(e.target.value)} placeholder="0"
                  className="w-full bg-transparent text-center text-6xl font-black text-white outline-none placeholder:text-zinc-800 mb-8 tracking-tighter" />
                <div className="w-11 h-11 rounded-full bg-[#1a1a1d] border border-white/10 flex items-center justify-center text-amber-500 mb-8"><ArrowDownToLine size={19} /></div>
                <p className="text-zinc-500 text-[11px] font-black uppercase tracking-widest mb-3">You Receive (BDT)</p>
                <p className={`text-5xl font-black tracking-tighter ${convertedTaka?'text-emerald-400':'text-zinc-800'}`}>
                  <span className="text-3xl mr-0.5 opacity-50">৳</span>{convertedTaka||'0.00'}
                </p>
                <p className="text-zinc-600 text-xs mt-3">Rate: {cs.coinRate.toLocaleString()} Coin = ৳10</p>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-5">
                {[1,2,5,10].map(mult => { const v=cs.coinRate*mult; return (
                  <motion.button whileTap={{scale:0.94}} key={mult} onClick={() => {setConvertCoins(String(v)); haptic('light');}}
                    className={`py-3 rounded-[16px] text-xs font-black border transition-colors ${convertCoins===String(v)?'bg-amber-500 text-black border-amber-500':'bg-[#1a1a1d] text-zinc-400 border-white/5'}`}>
                    {v>=1000?`${v/1000}K`:v}
                  </motion.button>
                );})}
              </div>
              <motion.button whileTap={convertedTaka?{scale:0.98}:{}} onClick={handleConvert} disabled={convertLoading||!convertedTaka}
                className={`w-full py-4 rounded-[20px] font-black text-lg flex items-center justify-center gap-2 ${convertedTaka?'bg-white text-black':'bg-[#1a1a1d] text-zinc-600 opacity-60'}`}>
                {convertLoading ? <motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:'linear'}} className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full" /> : 'Confirm Conversion'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ═══ WITHDRAW ═══ */}
        {screen==='withdraw' && (
          <motion.div key="withdraw" variants={pv} initial="initial" animate="animate" exit="exit" className="flex-1 overflow-y-auto flex flex-col">
            <div className="px-4 py-4 flex items-center gap-3 border-b border-white/5 sticky top-0 bg-[#0d0d10]/80 backdrop-blur-xl z-20">
              <button onClick={() => setScreen('main')} className="p-2.5 bg-[#1a1a1d] rounded-full"><ArrowLeft size={20} /></button>
              <h2 className="text-xl font-bold">Withdraw Funds</h2>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="bg-[#1a1a1d] border border-white/5 rounded-[20px] p-4 mb-6 flex justify-between items-center">
                <span className="text-zinc-400 text-sm font-bold uppercase tracking-wider">Available</span>
                <span className="text-emerald-400 font-black text-xl bg-emerald-500/10 px-3 py-1 rounded-xl">৳{(userData?.takaBalance||0).toFixed(2)}</span>
              </div>
              <p className="text-zinc-500 text-[11px] font-black uppercase tracking-widest mb-3 px-1">Payment Method</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  {id:'bkash' as const, label:'bKash', color:'#E2136E', logo:'https://freelogopng.com/images/all_img/1656234841bkash-icon-png.png'},
                  {id:'nagad' as const, label:'Nagad', color:'#ED1C24', logo:'https://download.logo.wine/logo/Nagad/Nagad-Logo.wine.png'}
                ].map(m => (
                  <motion.button whileTap={{scale:0.96}} key={m.id} onClick={() => {setWMethod(m.id); haptic('light');}}
                    className={`flex items-center gap-3 p-4 rounded-[20px] border-2 transition-all ${wMethod===m.id?'border-current':'border-white/5 bg-[#1a1a1d]'}`}
                    style={wMethod===m.id?{borderColor:m.color,backgroundColor:`${m.color}18`,color:m.color}:{}}>
                    <div className="w-11 h-11 rounded-[14px] flex items-center justify-center bg-white overflow-hidden flex-shrink-0">
                      <img src={m.logo} alt={m.label} className={`w-full h-full object-contain ${m.id==='nagad'?'p-1':'p-1.5'}`}
                        onError={(e) => {e.currentTarget.style.display='none'; const p=e.currentTarget.parentElement; if(p){p.style.background=m.color; p.innerHTML=`<span style="color:white;font-weight:900;font-size:11px">${m.label[0]}</span>`;} }} />
                    </div>
                    <span className="text-white font-bold text-base">{m.label}</span>
                  </motion.button>
                ))}
              </div>
              <div className="space-y-3 mb-6">
                <div className="bg-[#1a1a1d] border border-white/5 rounded-[20px] p-4 focus-within:border-emerald-500/40 transition-colors">
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">Account Number</p>
                  <input type="tel" value={wNumber} onChange={e => setWNumber(e.target.value)} placeholder="01XXXXXXXXX"
                    className="w-full bg-transparent text-white text-2xl font-black outline-none placeholder:text-zinc-800 tracking-wider" />
                </div>
                <div className="bg-[#1a1a1d] border border-white/5 rounded-[20px] p-4 focus-within:border-emerald-500/40 transition-colors">
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">Amount (BDT) — Min ৳{cs.minWithdraw}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-700 text-3xl font-black">৳</span>
                    <input type="number" value={wAmount} onChange={e => setWAmount(e.target.value)} placeholder={`${cs.minWithdraw}`}
                      className="w-full bg-transparent text-white text-3xl font-black outline-none placeholder:text-zinc-800" />
                  </div>
                </div>
              </div>
              <motion.button whileTap={wAmount&&wNumber.length>=11?{scale:0.98}:{}} onClick={handleWithdraw} disabled={wLoading||!wAmount||!wNumber}
                className={`w-full py-4 rounded-[20px] font-black text-lg flex items-center justify-center gap-2 mt-auto transition-all ${wAmount&&wNumber.length>=11?'bg-emerald-500 text-black':'bg-[#1a1a1d] text-zinc-600 opacity-60'}`}>
                {wLoading ? <motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:'linear'}} className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full" /> : 'Submit Request'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ═══ HISTORY ═══ */}
        {screen==='history' && (
          <motion.div key="history" variants={pv} initial="initial" animate="animate" exit="exit" className="flex-1 overflow-y-auto flex flex-col">
            <div className="px-4 py-4 flex items-center gap-3 border-b border-white/5 sticky top-0 bg-[#0d0d10]/80 backdrop-blur-xl z-20">
              <button onClick={() => setScreen('main')} className="p-2.5 bg-[#1a1a1d] rounded-full"><ArrowLeft size={20} /></button>
              <h2 className="text-xl font-bold">Activity Log</h2>
            </div>
            <div className="p-4">
              {withdrawals.length > 0 && (
                <div className="mb-8">
                  <p className="text-zinc-500 text-[11px] font-black uppercase tracking-widest mb-3 px-1">Withdrawals</p>
                  <div className="space-y-3">
                    {withdrawals.map((w,i) => (
                      <motion.div key={w.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                        className="p-4 rounded-[20px] bg-[#1a1a1d] border border-white/5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <div className="w-11 h-11 rounded-[14px] bg-white overflow-hidden flex-shrink-0" style={{border:`1.5px solid ${w.method==='bkash'?'#E2136E':'#ED1C24'}`}}>
                              <img src={w.method==='bkash'?'https://freelogopng.com/images/all_img/1656234841bkash-icon-png.png':'https://download.logo.wine/logo/Nagad/Nagad-Logo.wine.png'}
                                alt={w.method} className={`w-full h-full object-contain ${w.method==='nagad'?'p-0.5':'p-1.5'}`}
                                onError={(e) => {e.currentTarget.style.display='none'; const p=e.currentTarget.parentElement; if(p){p.style.background=w.method==='bkash'?'#E2136E':'#ED1C24'; p.innerHTML=`<span style="color:white;font-weight:900;font-size:11px;display:flex;align-items:center;justify-content:center;height:100%">${w.method==='bkash'?'B':'N'}</span>`;} }} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-white font-bold text-sm truncate">{w.number}</p>
                              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-0.5">{w.method}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-white font-black text-base">৳{w.amount}</p>
                            <div className={`inline-flex items-center px-2 py-0.5 rounded-md mt-1 ${w.status==='pending'?'bg-amber-500/10':w.status==='success'?'bg-emerald-500/10':'bg-red-500/10'}`}>
                              <p className={`text-[9px] font-black uppercase tracking-widest ${w.status==='pending'?'text-amber-400':w.status==='success'?'text-emerald-400':'text-red-400'}`}>{w.status}</p>
                            </div>
                          </div>
                        </div>
                        {w.adminNote && <div className="mt-3 p-3 rounded-[14px] bg-black/40 border border-white/5"><p className="text-zinc-400 text-xs">{w.adminNote}</p></div>}
                        <p className="text-zinc-600 text-[10px] mt-2">{ft(w.createdAt)}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-zinc-500 text-[11px] font-black uppercase tracking-widest mb-3 px-1">Coin Activity</p>
              {coinHistory.length===0 ? (
                <div className="text-center py-12 bg-[#1a1a1d] rounded-[24px] border border-white/5">
                  <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3"><History size={22} className="text-zinc-600" /></div>
                  <p className="text-zinc-500 text-sm">কোনো history নেই</p>
                </div>
              ) : (
                <div className="bg-[#1a1a1d] border border-white/5 rounded-[24px] overflow-hidden">
                  {coinHistory.map((h,i) => (
                    <motion.div key={h.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}
                      className={`flex items-center gap-4 p-4 ${i!==coinHistory.length-1?'border-b border-white/5':''}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${h.type==='earn'?'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20':'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        {h.type==='earn' ? <ArrowDownToLine size={15} /> : <ArrowRight size={15} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-bold truncate">{h.reason}</p>
                        <p className="text-zinc-500 text-[10px] font-black mt-0.5 uppercase tracking-widest">{ft(h.createdAt)}</p>
                      </div>
                      <span className={`font-black text-sm flex-shrink-0 ${h.type==='earn'?'text-emerald-400':'text-amber-400'}`}>
                        {h.type==='earn'?'+':'-'}{h.amount}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
};

export default UserProfile;

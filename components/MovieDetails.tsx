import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Star, ShieldCheck, X, Download, Send, ExternalLink,
  Clock, Database, Volume2, MessageSquare, Tv, Lock, Calendar,
  ChevronRight, ImageIcon, Search, Unlock, AlertTriangle, Bot
} from 'lucide-react';
import { Movie, SeasonInfo, AppSettings } from '../types';

interface MovieDetailsProps {
  movie: Movie;
  onClose: () => void;
  botUsername: string;
  channelLink: string;
  appSettings?: AppSettings;
}

// ════════════════════════════════════════════════════════════════════════════
// UNLOCK STORAGE SYSTEM
// ════════════════════════════════════════════════════════════════════════════
//
// Rules (simple & fair):
//  1. Ad progress → saved forever until full unlock
//  2. Full unlock  → 24 hours access, then reset
//  3. No partial expiry — user never loses progress mid-way
//
// Storage keys:
//  cine_prog_{id}    → { watched: number }           (progress, no expiry)
//  cine_unlock_{id}  → { unlockedAt: number }         (full unlock timestamp)

const FULL_UNLOCK_MS = 24 * 60 * 60 * 1000; // 24 hours

const progKey   = (id: string) => `cine_prog_${id}`;
const unlockKey = (id: string) => `cine_unlock_${id}`;

const getProgress = (id: string): number => {
  try { return parseInt(localStorage.getItem(progKey(id)) || '0', 10) || 0; }
  catch { return 0; }
};

const saveProgress = (id: string, watched: number) => {
  try { localStorage.setItem(progKey(id), String(watched)); } catch {}
};

const isUnlocked = (id: string): boolean => {
  try {
    const raw = localStorage.getItem(unlockKey(id));
    if (!raw) return false;
    const { unlockedAt } = JSON.parse(raw);
    if (Date.now() - unlockedAt > FULL_UNLOCK_MS) {
      // Expired — clear unlock but keep progress reset
      localStorage.removeItem(unlockKey(id));
      localStorage.removeItem(progKey(id));
      return false;
    }
    return true;
  } catch { return false; }
};

const saveUnlock = (id: string) => {
  try {
    localStorage.setItem(unlockKey(id), JSON.stringify({ unlockedAt: Date.now() }));
    localStorage.removeItem(progKey(id)); // progress no longer needed
  } catch {}
};

// ─── Meta Tag ────────────────────────────────────────────────────────────────
const MetaTag: React.FC<{ icon: React.ReactNode; value: string; color: string; bg: string; border: string }> = ({ icon, value, color, bg, border }) => (
  <div className={`flex items-center gap-1.5 ${bg} px-3 py-1.5 rounded-lg border ${border}`}>
    <span className={color}>{icon}</span>
    <span className={`text-xs font-bold ${color}`}>{value}</span>
  </div>
);

// ─── Screenshot Viewer ───────────────────────────────────────────────────────
const ScreenshotViewer: React.FC<{ screenshots: string[]; initialIndex: number; onClose: () => void }> = ({ screenshots, initialIndex, onClose }) => {
  const [current, setCurrent] = useState(initialIndex);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
        <X size={20} className="text-white" />
      </button>
      <div className="text-xs text-gray-400 mb-3">{current + 1} / {screenshots.length}</div>
      <img src={screenshots[current]} alt="" className="max-w-full max-h-[80vh] object-contain rounded-xl" onClick={e => e.stopPropagation()} />
      <div className="flex gap-2 mt-4">
        {screenshots.map((_, idx) => (
          <button key={idx} onClick={e => { e.stopPropagation(); setCurrent(idx); }}
            className={`w-2 h-2 rounded-full transition-all ${idx === current ? 'bg-gold w-4' : 'bg-white/30'}`} />
        ))}
      </div>
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// CONFIRMATION PAGE — YES / NO after full unlock
// ════════════════════════════════════════════════════════════════════════════
interface ConfirmPageProps {
  movie: Movie;
  actionType: 'watch' | 'download';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmPage: React.FC<ConfirmPageProps> = ({ movie, actionType, onConfirm, onCancel }) => {
  const isWatch = actionType === 'watch';
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', damping: 22, stiffness: 260 }}
      className="fixed inset-0 z-[310] flex flex-col items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.97)' }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <img src={movie.detailBanner || movie.thumbnail} alt="" className="w-full h-full object-cover"
          style={{ filter: 'blur(35px) brightness(0.18) saturate(0.4)', transform: 'scale(1.15)' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-[320px] w-full">
        {/* Unlock icon */}
        <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 16, delay: 0.1 }} className="mb-5">
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#22c55e,#15803d)', boxShadow: '0 0 50px rgba(34,197,94,0.5)' }}>
            <Unlock size={38} className="text-white" />
          </div>
        </motion.div>

        {/* Movie card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          className="flex items-center gap-3 mb-5 bg-white/6 border border-white/10 rounded-2xl px-4 py-3 w-full">
          <img src={movie.thumbnail} alt={movie.title} className="w-10 h-14 object-cover rounded-lg border border-white/15 flex-shrink-0" />
          <div className="text-left min-w-0">
            <p className="text-white font-black text-sm leading-tight truncate">{movie.title}</p>
            <p className="text-green-400 text-xs mt-0.5 font-bold">✅ Unlocked!</p>
          </div>
        </motion.div>

        {/* Question */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="mb-7">
          {isWatch ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-1.5">
                <Bot size={20} className="text-[#0088cc]" />
                <h2 className="text-white text-xl font-black">Video দেখতে চান?</h2>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">Telegram Bot-এ যাবেন — সেখানে video পাবেন।</p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 mb-1.5">
                <Download size={20} className="text-green-400" />
                <h2 className="text-white text-xl font-black">Download করবেন?</h2>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">Telegram Bot-এ যাবেন — Download link পাবেন।</p>
            </>
          )}
        </motion.div>

        {/* YES / NO */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
          className="flex gap-3 w-full">
          <button onClick={onCancel}
            className="flex-1 py-4 rounded-2xl font-black text-sm border border-white/12 text-gray-300 active:scale-95 transition-all"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            না, পরে
          </button>
          <button onClick={onConfirm}
            className="flex-[2] py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
            style={{
              background: isWatch ? 'linear-gradient(135deg,#0088cc,#006ba3)' : 'linear-gradient(135deg,#22c55e,#15803d)',
              boxShadow: isWatch ? '0 8px 28px rgba(0,136,204,0.38)' : '0 8px 28px rgba(34,197,94,0.38)',
              color: '#fff',
            }}>
            {isWatch ? <><Bot size={17} />হ্যাঁ, Bot-এ যান</> : <><Download size={17} />হ্যাঁ, Download করুন</>}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};


// ════════════════════════════════════════════════════════════════════════════
// CINEMATIC LOCK SCREEN
// ════════════════════════════════════════════════════════════════════════════
interface LockScreenProps {
  movie: Movie;
  total: number;
  watched: number;
  actionType: 'watch' | 'download';
  skipped: boolean;
  adLoading: boolean;
  savedProgress: number;
  tutorialLink?: string;
  onClose: () => void;
  onWatchAd: () => void;
}

const CinematicLockScreen: React.FC<LockScreenProps> = ({
  movie, total, watched, actionType, skipped, adLoading, savedProgress, tutorialLink, onClose, onWatchAd
}) => {
  const remaining = total - watched;
  const progress = total > 0 ? (watched / total) * 100 : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }} className="fixed inset-0 z-[300] flex flex-col">
      {/* Blurred background */}
      <div className="absolute inset-0 overflow-hidden">
        <img src={movie.detailBanner || movie.thumbnail} alt="" className="w-full h-full object-cover"
          style={{ filter: 'blur(28px) brightness(0.22) saturate(0.5)', transform: 'scale(1.12)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,rgba(0,0,0,0.5) 0%,rgba(0,0,0,0.85) 60%,rgba(0,0,0,0.99) 100%)' }} />
      </div>

      {/* Close */}
      <div className="relative z-10 flex justify-end p-4 pt-7">
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center">
          <X size={18} className="text-white" />
        </button>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-10 text-center">

        {/* Movie mini card */}
        <div className="flex items-center gap-3 mb-7 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm max-w-[300px] w-full">
          <img src={movie.thumbnail} alt={movie.title} className="w-10 h-14 object-cover rounded-lg border border-white/15 flex-shrink-0" />
          <div className="text-left min-w-0">
            <p className="text-white font-black text-sm leading-tight truncate">{movie.title}</p>
            <p className="text-gray-400 text-xs mt-0.5">{movie.quality || 'HD'} • {movie.year}</p>
            <p className="text-yellow-400 text-[10px] mt-0.5 font-bold">
              {actionType === 'watch' ? '▶ Stream করতে unlock করুন' : '⬇ Download করতে unlock করুন'}
            </p>
          </div>
        </div>

        {/* Saved progress notice */}
        {savedProgress > 0 && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="mb-4 px-4 py-2.5 rounded-xl bg-blue-500/12 border border-blue-500/22 flex items-center gap-2 max-w-[300px] w-full">
            <span className="text-lg">✨</span>
            <p className="text-blue-400 text-xs font-bold text-left">
              আগের progress save আছে!<br />
              <span className="text-blue-300">{savedProgress}/{total} ads আগেই দেখেছেন — বাকি {total - savedProgress}টা দেখলেই হবে।</span>
            </p>
          </motion.div>
        )}

        {/* Lock icon */}
        <motion.div animate={{ scale: [1, 1.07, 1] }} transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }} className="mb-5">
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 0 45px rgba(245,158,11,0.48)' }}>
            <Lock size={36} className="text-black" />
          </div>
        </motion.div>

        {/* Status */}
        <AnimatePresence mode="wait">
          {skipped ? (
            <motion.div key="skip" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <AlertTriangle size={18} className="text-red-400" />
                <h2 className="text-red-400 text-xl font-black">Ad Skip হয়েছে!</h2>
              </div>
              <p className="text-gray-400 text-sm max-w-[260px] mx-auto leading-relaxed">
                Ad skip বা বন্ধ করলে count হবে না।<br />আবার চেষ্টা করুন।
              </p>
            </motion.div>
          ) : (
            <motion.div key="normal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-white text-2xl font-black mb-1">Content Locked 🔒</h2>
              <p className="text-gray-400 text-sm">{remaining} টি Ad দেখলে unlock হবে</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress circles */}
        <div className="flex gap-3 flex-wrap justify-center mt-6 mb-4">
          {Array.from({ length: total }).map((_, i) => (
            <motion.div key={i} animate={{ scale: i === watched ? [1, 1.14, 1] : 1 }}
              transition={{ repeat: i === watched ? Infinity : 0, duration: 1.3 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 14,
                border: i < watched ? 'none' : i === watched ? '2.5px solid #f59e0b' : '2px solid rgba(255,255,255,0.12)',
                background: i < watched ? 'linear-gradient(135deg,#f59e0b,#d97706)' : i === watched ? 'rgba(245,158,11,0.14)' : 'rgba(255,255,255,0.04)',
                color: i < watched ? '#000' : i === watched ? '#f59e0b' : 'rgba(255,255,255,0.25)',
                boxShadow: i === watched ? '0 0 22px rgba(245,158,11,0.35)' : 'none',
                transition: 'all 0.5s',
              }}>
                {i < watched ? '✓' : i + 1}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-[300px] mb-7">
          <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
            <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#f59e0b,#fde68a)' }} />
          </div>
          <div className="flex justify-between items-center mt-1.5">
            <p className="text-gray-600 text-[10px]">{watched}/{total} ads দেখা হয়েছে</p>
            {watched > 0 && <p className="text-blue-400 text-[10px] font-bold">Progress saved ✓</p>}
          </div>
        </div>

        {/* CTA Button */}
        <motion.button whileTap={{ scale: 0.95 }} onClick={onWatchAd} disabled={adLoading}
          style={{
            background: skipped ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#f59e0b,#d97706)',
            boxShadow: skipped ? '0 8px 32px rgba(239,68,68,0.38)' : '0 8px 32px rgba(245,158,11,0.42)',
            color: '#000', fontWeight: 900, fontSize: 14, letterSpacing: '0.06em',
            padding: '16px 32px', borderRadius: 16, border: 'none',
            cursor: adLoading ? 'wait' : 'pointer',
            width: '100%', maxWidth: 300,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            opacity: adLoading ? 0.75 : 1,
          }}>
          {adLoading ? (
            <><div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />Ad লোড হচ্ছে...</>
          ) : skipped ? (
            <><AlertTriangle size={18} />আবার চেষ্টা করুন</>
          ) : watched === 0 ? (
            <><Play size={18} fill="black" />Ad দেখুন &amp; Unlock করুন</>
          ) : (
            <><Play size={18} fill="black" />পরের Ad ({remaining} বাকি)</>
          )}
        </motion.button>

        {!skipped && (
          <p className="text-gray-700 text-[11px] mt-4 max-w-[250px] leading-relaxed">
            ⚠️ Ad skip বা বন্ধ করলে count হবে না
          </p>
        )}

        {/* How to unlock — Telegram channel */}
        {tutorialLink && (
          <button
            onClick={() => {
              // @ts-ignore
              if (window.Telegram?.WebApp) window.Telegram.WebApp.openTelegramLink(tutorialLink);
              else window.open(tutorialLink, '_blank');
            }}
            className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-xl active:scale-95 transition-all border border-[#0088cc]/20"
            style={{ background: 'rgba(0,136,204,0.08)', cursor: 'pointer' }}>
            <span className="text-base">📺</span>
            <span className="text-[#0088cc] text-[11px] font-bold">কিভাবে unlock করবেন?</span>
          </button>
        )}

      </div>
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// EPISODE LOCK OVERLAY (bottom sheet)
// ════════════════════════════════════════════════════════════════════════════
interface EpisodeLockOverlayProps {
  movie: Movie;
  episode: { title: string; number: number };
  total: number;
  watched: number;
  skipped: boolean;
  adLoading: boolean;
  savedProgress: number;
  tutorialLink?: string;
  onClose: () => void;
  onWatchAd: () => void;
}

const EpisodeLockOverlay: React.FC<EpisodeLockOverlayProps> = ({
  movie, episode, total, watched, skipped, adLoading, savedProgress, tutorialLink, onClose, onWatchAd
}) => {
  const remaining = total - watched;

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[340] bg-black/65 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="fixed inset-x-0 bottom-0 z-[350] rounded-t-3xl overflow-hidden"
        style={{ background: 'linear-gradient(180deg,#13131a,#0d0d14)', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none' }}>

        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-white/15 rounded-full" />
        </div>

        <div className="flex flex-col items-center px-6 pt-3 pb-10 text-center">
          {/* Header */}
          <div className="flex items-center justify-between w-full mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.28)' }}>
                <Lock size={16} className="text-yellow-400" />
              </div>
              <div className="text-left">
                <p className="text-white font-black text-sm">EP {episode.number}</p>
                <p className="text-gray-500 text-xs truncate max-w-[180px]">{episode.title}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/8 border border-white/10 flex items-center justify-center">
              <X size={15} className="text-white" />
            </button>
          </div>

          {/* Saved progress notice */}
          {savedProgress > 0 && (
            <div className="w-full mb-3 px-3 py-2.5 rounded-xl bg-blue-500/12 border border-blue-500/20 flex items-center gap-2">
              <span className="text-base">✨</span>
              <p className="text-blue-400 text-xs font-bold text-left">
                আগের progress save! {savedProgress}/{total} দেখা — বাকি {total - savedProgress}টা দেখলেই হবে।
              </p>
            </div>
          )}

          {/* Icon */}
          <motion.div animate={{ scale: [1, 1.09, 1] }} transition={{ repeat: Infinity, duration: 2.1 }}
            className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 0 32px rgba(245,158,11,0.38)' }}>
            <Lock size={28} className="text-black" />
          </motion.div>

          {skipped ? (
            <>
              <h3 className="text-red-400 text-lg font-black mb-1">⚠️ Ad Skip হয়েছে!</h3>
              <p className="text-gray-500 text-xs mb-4">Skip করলে count হবে না। আবার চেষ্টা করুন।</p>
            </>
          ) : (
            <>
              <h3 className="text-white text-xl font-black mb-1">Episode Locked 🔒</h3>
              <p className="text-gray-400 text-sm mb-4">{remaining} টি Ad বাকি</p>
            </>
          )}

          {/* Progress circles */}
          <div className="flex gap-2.5 flex-wrap justify-center mb-3">
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} style={{
                width: 42, height: 42, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 12,
                border: i < watched ? 'none' : i === watched ? '2px solid #f59e0b' : '2px solid rgba(255,255,255,0.1)',
                background: i < watched ? 'linear-gradient(135deg,#f59e0b,#d97706)' : i === watched ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
                color: i < watched ? '#000' : i === watched ? '#f59e0b' : 'rgba(255,255,255,0.2)',
                boxShadow: i === watched ? '0 0 18px rgba(245,158,11,0.3)' : 'none',
              }}>
                {i < watched ? '✓' : i + 1}
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-[240px] mb-5">
            <div className="h-1 bg-white/8 rounded-full overflow-hidden">
              <motion.div animate={{ width: `${(watched / total) * 100}%` }} transition={{ duration: 0.5 }}
                className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#f59e0b,#fde68a)' }} />
            </div>
            <div className="flex justify-between mt-1">
              <p className="text-gray-700 text-[10px]">{watched}/{total} ads watched</p>
              {watched > 0 && <p className="text-blue-400 text-[10px] font-bold">Saved ✓</p>}
            </div>
          </div>

          {/* CTA */}
          <motion.button whileTap={{ scale: 0.95 }} onClick={onWatchAd} disabled={adLoading}
            style={{
              background: skipped ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#f59e0b,#d97706)',
              boxShadow: skipped ? '0 6px 22px rgba(239,68,68,0.35)' : '0 6px 22px rgba(245,158,11,0.35)',
              color: '#000', fontWeight: 900, fontSize: 13, letterSpacing: '0.05em',
              padding: '14px 24px', borderRadius: 14, border: 'none',
              cursor: adLoading ? 'wait' : 'pointer',
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: adLoading ? 0.75 : 1,
            }}>
            {adLoading ? (
              <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />Ad লোড হচ্ছে...</>
            ) : skipped ? (
              <><AlertTriangle size={16} />আবার চেষ্টা করুন</>
            ) : watched === 0 ? (
              <><Play size={16} fill="black" />Ad দেখে Unlock করুন</>
            ) : (
              <><Play size={16} fill="black" />পরের Ad ({remaining} বাকি)</>
            )}
          </motion.button>

          {!skipped && (
            <p className="text-gray-700 text-[11px] mt-3.5">⚠️ Ad skip বা বন্ধ করলে count হবে না</p>
          )}

          {tutorialLink && (
            <button
              onClick={() => {
                // @ts-ignore
                if (window.Telegram?.WebApp) window.Telegram.WebApp.openTelegramLink(tutorialLink);
                else window.open(tutorialLink, '_blank');
              }}
              className="mt-2 flex items-center gap-1.5 px-3 py-2 rounded-xl active:scale-95 transition-all border border-[#0088cc]/20"
              style={{ background: 'rgba(0,136,204,0.08)', cursor: 'pointer' }}>
              <span className="text-sm">📺</span>
              <span className="text-[#0088cc] text-[11px] font-bold">কিভাবে unlock করবেন?</span>
            </button>
          )}

        </div>
      </motion.div>
    </>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
const MovieDetails: React.FC<MovieDetailsProps> = ({ movie, onClose, botUsername, channelLink, appSettings }) => {
  const [activeTab, setActiveTab] = useState<'episodes' | 'info'>('episodes');
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  // Ad config
  const watchAdCount = movie.watchAdCount !== undefined && movie.watchAdCount >= 0
    ? movie.watchAdCount : (appSettings?.defaultWatchAdCount ?? 0);
  const downloadAdCount = movie.downloadAdCount !== undefined && movie.downloadAdCount >= 0
    ? movie.downloadAdCount : (appSettings?.defaultDownloadAdCount ?? 0);
  const monetagZoneId = appSettings?.adZoneId || '';
  const adsgramBlockId = appSettings?.adsgramBlockId || '';
  // Adsgram only when adsgramEnabled=true AND blockId present — otherwise Monetag
  const useAdsgram = !!(appSettings?.adsgramEnabled && adsgramBlockId);
  const adsEnabled = !!(appSettings?.adEnabled && (monetagZoneId || useAdsgram));
  const hasWatchAds  = adsEnabled && watchAdCount > 0;
  const hasDownloadAds = adsEnabled && downloadAdCount > 0;

  // Unique keys per movie per action
  const watchKey    = `${movie.id}_watch`;
  const downloadKey = `${movie.id}_download`;

  // ✅ Coin-based Ads-Free System
  const adsFreeEnabled = !!(appSettings?.adsFreeEnabled);
  const adsFreeCoins   = appSettings?.adsFreeCoinsPerContent ?? 200;
  const coinAdsFreeKey = (id: string) => `cine_coinsfree_${id}`;

  const isCoinAdsFree = (id: string): boolean => {
    try {
      const raw = localStorage.getItem(coinAdsFreeKey(id));
      if (!raw) return false;
      const { unlockedAt } = JSON.parse(raw);
      if (Date.now() - unlockedAt > FULL_UNLOCK_MS) {
        localStorage.removeItem(coinAdsFreeKey(id));
        return false;
      }
      return true;
    } catch { return false; }
  };

  const [coinFreeActive, setCoinFreeActive] = useState(() => isCoinAdsFree(movie.id));
  const [coinFreeLoading, setCoinFreeLoading] = useState(false);
  const [coinFreeToast, setCoinFreeToast] = useState('');

  const handleCoinAdsFree = async () => {
    const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    if (!tgUser) { setCoinFreeToast('Telegram এ login করুন'); setTimeout(() => setCoinFreeToast(''), 3000); return; }
    const uid = String(tgUser.id);
    setCoinFreeLoading(true);
    try {
      const { getDoc, updateDoc, doc, increment, addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (!userSnap.exists()) { setCoinFreeToast('User data পাওয়া যায়নি'); setCoinFreeLoading(false); setTimeout(() => setCoinFreeToast(''), 3000); return; }
      const userData = userSnap.data();
      if ((userData.coins || 0) < adsFreeCoins) {
        setCoinFreeToast(`Coin কম! ${adsFreeCoins} Coin দরকার, তোমার আছে ${userData.coins || 0}`);
        setCoinFreeLoading(false); setTimeout(() => setCoinFreeToast(''), 4000); return;
      }
      await updateDoc(doc(db, 'users', uid), { coins: increment(-adsFreeCoins) });
      await addDoc(collection(db, `users/${uid}/coinHistory`), {
        type: 'spend', reason: `⚡ Ads-Free — ${movie.title}`, amount: adsFreeCoins, createdAt: serverTimestamp(),
      });
      localStorage.setItem(coinAdsFreeKey(movie.id), JSON.stringify({ unlockedAt: Date.now() }));
      setCoinFreeActive(true);
      setCoinFreeToast(`✅ ${movie.title} 24 ঘণ্টার জন্য Ads-Free হয়েছে!`);
      setTimeout(() => setCoinFreeToast(''), 4000);
    } catch(e) { setCoinFreeToast('Error হয়েছে, আবার try করুন'); setTimeout(() => setCoinFreeToast(''), 3000); }
    setCoinFreeLoading(false);
  };

  // Unlock state — check localStorage on mount + re-check on focus
  const [watchUnlocked,    setWatchUnlocked]    = useState(() => isUnlocked(watchKey));
  const [downloadUnlocked, setDownloadUnlocked] = useState(() => isUnlocked(downloadKey));

  // Re-check unlock status when user returns to the app (focus/visibility)
  useEffect(() => {
    const recheck = () => {
      setWatchUnlocked(isUnlocked(watchKey));
      setDownloadUnlocked(isUnlocked(downloadKey));
    };
    // Check on visibility change (user switches tabs/apps and comes back)
    document.addEventListener('visibilitychange', recheck);
    window.addEventListener('focus', recheck);
    return () => {
      document.removeEventListener('visibilitychange', recheck);
      window.removeEventListener('focus', recheck);
    };
  }, [watchKey, downloadKey]);

  // Movie lock screen state
  const [lockScreen, setLockScreen] = useState<{
    open: boolean; type: 'watch' | 'download';
    total: number; watched: number;
    skipped: boolean; adLoading: boolean; savedProgress: number;
    pendingAction: (() => void) | null;
  }>({ open: false, type: 'watch', total: 0, watched: 0, skipped: false, adLoading: false, savedProgress: 0, pendingAction: null });

  // Episode lock overlay state
  const [epLock, setEpLock] = useState<{
    open: boolean; episode: { title: string; number: number; id: string } | null;
    type: 'watch' | 'download';
    total: number; watched: number;
    skipped: boolean; adLoading: boolean; savedProgress: number;
    pendingAction: (() => void) | null;
  }>({ open: false, episode: null, type: 'watch', total: 0, watched: 0, skipped: false, adLoading: false, savedProgress: 0, pendingAction: null });

  // Confirmation (YES/NO)
  const [confirmState, setConfirmState] = useState<{
    open: boolean; type: 'watch' | 'download'; action: (() => void) | null;
  }>({ open: false, type: 'watch', action: null });


  // ── Show one ad (Adsgram OR Monetag — never both) ──
  const showOneAd = useCallback((): Promise<'watched' | 'skipped'> => {
    return new Promise((resolve) => {

      // ── ADSGRAM ──────────────────────────────────────────────
      if (useAdsgram) {
        let attempts = 0;
        const tryAdsgram = () => {
          // @ts-ignore
          const AdController = window.Adsgram;
          if (typeof AdController !== 'undefined') {
            try {
              // @ts-ignore
              AdController.init({ blockId: String(adsgramBlockId) })
                .show()
                .then(() => resolve('watched'))   // ✅ user watched full ad
                .catch((err: any) => {
                  console.warn('Adsgram skipped/error:', err);
                  resolve('skipped');             // ❌ user skipped or error
                });
            } catch (err) {
              console.warn('Adsgram init error:', err);
              resolve('skipped');
            }
          } else if (attempts < 25) {
            attempts++;
            setTimeout(tryAdsgram, 400); // wait for SDK to load (up to 10s)
          } else {
            console.warn('Adsgram SDK not found after retries — not blocking user');
            resolve('watched'); // SDK not loaded — don't block user
          }
        };
        tryAdsgram();
        return;
      }

      // ── MONETAG Rewarded Interstitial ────────────────────────
      // show_ZONEID().then()  → user watched full ad ✅
      // show_ZONEID().catch() → user skipped/closed  ❌
      const fnName = `show_${monetagZoneId}`;
      let attempts = 0;
      const tryMonetag = () => {
        // @ts-ignore
        const fn = window[fnName];
        if (typeof fn === 'function') {
          fn()
            .then(() => resolve('watched'))
            .catch(() => resolve('skipped'));
        } else if (attempts < 30) {
          attempts++;
          setTimeout(tryMonetag, 200);
        } else {
          resolve('watched'); // SDK not loaded — don't block user
        }
      };
      tryMonetag();
    });
  }, [monetagZoneId, useAdsgram, adsgramBlockId]);

  const openTelegramLink = useCallback((url: string) => {
    // @ts-ignore
    if (window.Telegram?.WebApp) {
      // @ts-ignore
      window.Telegram.WebApp.HapticFeedback?.impactOccurred('medium');
      // @ts-ignore
      window.Telegram.WebApp.openTelegramLink(url);
      setTimeout(() => {
        // @ts-ignore
        window.Telegram.WebApp.close();
      }, 300);
    } else {
      window.open(url, '_blank');
    }
  }, []);

  // ── Movie lock: watch ad handler ──
  const handleMovieLockWatchAd = useCallback(async () => {
    setLockScreen(s => ({ ...s, skipped: false, adLoading: true }));
    const result = await showOneAd();

    if (result === 'skipped') {
      setLockScreen(s => ({ ...s, skipped: true, adLoading: false }));
      return;
    }

    setLockScreen(s => {
      const nw = s.watched + 1;
      const key = s.type === 'watch' ? watchKey : downloadKey;

      if (nw >= s.total) {
        // All ads done — save full unlock
        saveUnlock(key);
        if (s.type === 'watch') setWatchUnlocked(true);
        else setDownloadUnlocked(true);

        const action = s.pendingAction;
        const type = s.type;
        setTimeout(() => {
          setLockScreen(prev => ({ ...prev, open: false, adLoading: false }));
          setConfirmState({ open: true, type, action });
        }, 400);
      } else {
        // Save progress
        saveProgress(key, nw);
      }

      return { ...s, watched: nw, adLoading: false };
    });
  }, [showOneAd, watchKey, downloadKey]);

  // ── Episode lock: watch ad handler ──
  const handleEpLockWatchAd = useCallback(async () => {
    setEpLock(s => ({ ...s, skipped: false, adLoading: true }));
    const result = await showOneAd();

    if (result === 'skipped') {
      setEpLock(s => ({ ...s, skipped: true, adLoading: false }));
      return;
    }

    setEpLock(s => {
      const nw = s.watched + 1;
      const epId = s.episode?.id || '';
      const key = `${movie.id}_ep_${epId}_${s.type}`;

      if (nw >= s.total) {
        saveUnlock(key);
        const action = s.pendingAction;
        const type = s.type;
        setTimeout(() => {
          setEpLock(prev => ({ ...prev, open: false, adLoading: false }));
          setConfirmState({ open: true, type, action });
        }, 400);
      } else {
        saveProgress(key, nw);
      }

      return { ...s, watched: nw, adLoading: false };
    });
  }, [showOneAd, movie.id]);

  // ── Run movie action ──
  const runMovieAction = useCallback((type: 'watch' | 'download', total: number, action: () => void) => {
    if (!adsEnabled || total === 0) {
      setConfirmState({ open: true, type, action });
      return;
    }

    const key = type === 'watch' ? watchKey : downloadKey;

    // Already fully unlocked?
    if (isUnlocked(key)) {
      setConfirmState({ open: true, type, action });
      return;
    }

    // Resume from saved progress
    const saved = getProgress(key);
    setLockScreen({
      open: true, type, total,
      watched: saved,
      skipped: false, adLoading: false,
      savedProgress: saved,
      pendingAction: action,
    });
  }, [adsEnabled, watchKey, downloadKey]);

  // ── Run episode action ──
  const runEpisodeAction = useCallback((
    ep: { title: string; number: number; id: string },
    total: number,
    action: () => void,
    type: 'watch' | 'download' = 'watch'
  ) => {
    if (!adsEnabled || total === 0) {
      setConfirmState({ open: true, type, action });
      return;
    }

    const key = `${movie.id}_ep_${ep.id}_${type}`;

    if (isUnlocked(key)) {
      setConfirmState({ open: true, type, action });
      return;
    }

    const saved = getProgress(key);
    setEpLock({
      open: true, episode: ep, type, total,
      watched: saved,
      skipped: false, adLoading: false,
      savedProgress: saved,
      pendingAction: action,
    });
  }, [adsEnabled, movie.id]);

  // Confirm YES / NO
  const handleConfirmYes = useCallback(() => {
    const action = confirmState.action;
    setConfirmState({ open: false, type: 'watch', action: null });
    if (action) action();
  }, [confirmState]);

  const handleConfirmNo = useCallback(() => {
    setConfirmState({ open: false, type: 'watch', action: null });
  }, []);

  // Handlers
  const handleWatch = (code: string) => {
    runMovieAction('watch', coinFreeActive ? 0 : watchAdCount, () => openTelegramLink(`https://t.me/${botUsername}?start=${code}`));
  };

  const handleDownload = (downloadCode?: string, downloadLink?: string, fallbackCode?: string) => {
    const execute = () => {
      if (downloadLink) window.open(downloadLink, '_blank');
      else if (downloadCode) openTelegramLink(`https://t.me/${botUsername}?start=${downloadCode}`);
      else if (fallbackCode) openTelegramLink(`https://t.me/${botUsername}?start=${fallbackCode}`);
    };
    runMovieAction('download', coinFreeActive ? 0 : downloadAdCount, execute);
  };

  const handleEpWatch = (ep: { title: string; number: number; id: string; telegramCode: string; watchAdCount?: number }) => {
    const epAdCount = ep.watchAdCount !== undefined && ep.watchAdCount >= 0 ? ep.watchAdCount : watchAdCount;
    runEpisodeAction(ep, epAdCount, () => openTelegramLink(`https://t.me/${botUsername}?start=${ep.telegramCode}`), 'watch');
  };

  const handleEpDownload = (ep: { title: string; number: number; id: string; downloadCode?: string; downloadLink?: string; telegramCode: string; watchAdCount?: number }) => {
    const epAdCount = ep.watchAdCount !== undefined && ep.watchAdCount >= 0 ? ep.watchAdCount : downloadAdCount;
    const execute = () => {
      if (ep.downloadLink) window.open(ep.downloadLink, '_blank');
      else if (ep.downloadCode) openTelegramLink(`https://t.me/${botUsername}?start=${ep.downloadCode}`);
      else openTelegramLink(`https://t.me/${botUsername}?start=${ep.telegramCode}`);
    };
    runEpisodeAction(ep, epAdCount, execute, 'download');
  };

  const isSeries = movie.category === 'Series' || movie.category === 'Korean Drama'
    || movie.category === 'Web Series' || movie.category === 'K-Drama'
    || (movie.episodes && movie.episodes.length > 0);

  const episodesBySeason = useMemo(() => {
    if (!movie.episodes) return {};
    const groups: Record<number, typeof movie.episodes> = {};
    movie.episodes.forEach(ep => {
      const s = ep.season || 1;
      if (!groups[s]) groups[s] = [];
      groups[s].push(ep);
    });
    Object.keys(groups).forEach(s => { groups[Number(s)].sort((a, b) => a.number - b.number); });
    return groups;
  }, [movie.episodes]);

  const availableSeasons = Object.keys(episodesBySeason).map(Number).sort((a, b) => a - b);
  const getSeasonInfo = (n: number): SeasonInfo | undefined => movie.seasons?.find(s => s.season === n);
  const currentSeasonInfo = getSeasonInfo(selectedSeason);
  const isCurrentSeasonLocked = currentSeasonInfo?.isLocked || currentSeasonInfo?.isComingSoon;
  const currentEpisodes = isCurrentSeasonLocked ? [] : (episodesBySeason[selectedSeason] || []);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-[100] bg-[#000] flex flex-col h-full font-sans"
      >
        {/* Banner */}
        <div className="absolute top-0 left-0 w-full z-0"
          style={movie.detailBanner ? { height: '55vw', maxHeight: '55vh' } : { aspectRatio: '2/3', maxHeight: '58vh' }}>
          <img src={movie.detailBanner || movie.thumbnail} alt={movie.title} className="w-full h-full opacity-85"
            style={{ objectFit: 'cover', objectPosition: movie.detailBanner ? 'center center' : 'center top' }}
            onError={e => { if (movie.detailBanner && e.currentTarget.src !== movie.thumbnail) e.currentTarget.src = movie.thumbnail; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#000] via-[#000]/70 to-transparent" />
        </div>

        {/* Close */}
        <div className="absolute top-0 inset-x-0 z-[110] flex justify-between items-center p-4 pt-6 pointer-events-none">
          <button onClick={e => { e.stopPropagation(); onClose(); }}
            className="pointer-events-auto w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all shadow-lg">
            <X size={22} />
          </button>
        </div>

        {/* Scroll */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative z-10"
          style={{ paddingTop: movie.detailBanner ? 'min(52vw, 48vh)' : 'min(55vw, 50vh)' }}>
          <div className="px-5 pb-28 bg-gradient-to-t from-black via-black to-transparent min-h-[60vh]">
            <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="bg-gold text-black px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-widest">{movie.category}</span>
                <span className="bg-white/10 px-2.5 py-0.5 rounded-md text-[10px] font-bold text-gray-200 border border-white/10">{movie.quality || 'HD'}</span>
                {movie.year && <span className="text-gray-400 text-xs font-bold">• {movie.year}</span>}
                {(movie.downloadCode || movie.downloadLink) && (
                  <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-md text-[9px] font-bold border border-green-500/30 flex items-center gap-1">
                    <Download size={9} />DOWNLOAD
                  </span>
                )}
                {hasWatchAds && !isSeries && !watchUnlocked && (
                  <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-md text-[9px] font-bold border border-yellow-500/30 flex items-center gap-1">
                    <Lock size={9} />{watchAdCount} AD
                  </span>
                )}
                {watchUnlocked && !isSeries && (
                  <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-md text-[9px] font-bold border border-green-500/30 flex items-center gap-1">
                    <Unlock size={9} />UNLOCKED
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-serif font-black text-white leading-[1.0] mb-4 drop-shadow-2xl">{movie.title}</h1>

              {/* Meta */}
              {(movie.duration || movie.fileSize || movie.audioLanguage || movie.subtitles || movie.videoQuality) && (
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  {movie.duration && <MetaTag icon={<Clock size={12} />} value={movie.duration} color="text-purple-300" bg="bg-purple-500/10" border="border-purple-500/20" />}
                  {movie.fileSize && <MetaTag icon={<Database size={12} />} value={movie.fileSize} color="text-emerald-300" bg="bg-emerald-500/10" border="border-emerald-500/20" />}
                  {movie.audioLanguage && <MetaTag icon={<Volume2 size={12} />} value={movie.audioLanguage} color="text-blue-300" bg="bg-blue-500/10" border="border-blue-500/20" />}
                  {movie.subtitles && <MetaTag icon={<MessageSquare size={12} />} value={movie.subtitles} color="text-pink-300" bg="bg-pink-500/10" border="border-pink-500/20" />}
                  {movie.videoQuality && <MetaTag icon={<Tv size={12} />} value={movie.videoQuality} color="text-yellow-300" bg="bg-yellow-500/10" border="border-yellow-500/20" />}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs font-semibold text-gray-300 mb-6 border-b border-white/8 pb-5">
                <div className="flex items-center gap-1.5"><Star size={13} fill="#FFD700" className="text-gold" /><span className="text-white">{movie.rating}</span></div>
                <span className="w-1 h-1 bg-gray-600 rounded-full" />
                <span>{movie.views} Views</span>
                <span className="w-1 h-1 bg-gray-600 rounded-full" />
                <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-green-500" /> Verified</span>
              </div>

              {/* ── Movie Buttons ── */}
              {!isSeries && (
                <div className="flex flex-col gap-3 w-full mb-7">
                  {/* Watch */}
                  <button onClick={() => handleWatch(movie.telegramCode)}
                    className="w-full py-4 px-5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 active:scale-98 transition-all"
                    style={{
                      background: watchUnlocked ? 'linear-gradient(135deg,#22c55e,#15803d)' : '#FFD700',
                      boxShadow: watchUnlocked ? '0 0 20px rgba(34,197,94,0.25)' : '0 0 20px rgba(255,215,0,0.2)',
                      color: '#000',
                    }}>
                    {watchUnlocked ? (
                      <><Unlock size={16} fill="black" color="black" />STREAM NOW<span className="ml-1 text-[10px] bg-black/15 px-2 py-0.5 rounded-full font-black">✓ Unlocked</span></>
                    ) : hasWatchAds ? (
                      <><Lock size={16} fill="black" color="black" />STREAM NOW<span className="ml-1 text-[10px] bg-black/20 px-2 py-0.5 rounded-full font-black">{watchAdCount} AD</span></>
                    ) : (
                      <><Play size={18} fill="black" />STREAM NOW</>
                    )}
                  </button>

                  {/* Download */}
                  <button onClick={() => handleDownload(movie.downloadCode, movie.downloadLink, movie.telegramCode)}
                    className="w-full bg-[#1a1a1a] border border-white/10 text-white py-3.5 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#222] active:scale-98 transition-all">
                    {downloadUnlocked ? (
                      <><Unlock size={15} className="text-green-400" />DOWNLOAD<span className="text-[10px] bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full font-black border border-green-500/25">✓ Unlocked</span></>
                    ) : hasDownloadAds ? (
                      <><Lock size={15} className="text-yellow-400" />DOWNLOAD<span className="text-[10px] bg-yellow-500/15 text-yellow-400 px-2 py-0.5 rounded-full font-black border border-yellow-500/25">{downloadAdCount} AD</span></>
                    ) : movie.downloadLink ? (
                      <><ExternalLink size={18} />DOWNLOAD</>
                    ) : (
                      <><Download size={18} />DOWNLOAD</>
                    )}
                  </button>

                  {/* ✅ Coin Ads-Free Button */}
                  {adsFreeEnabled && hasWatchAds && (
                    <div>
                      {coinFreeToast && (
                        <div className={`mb-2 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ${
                          coinFreeToast.startsWith('✅') ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30' : 'bg-red-500/20 text-red-200 border border-red-500/30'
                        }`}>
                          {coinFreeToast}
                        </div>
                      )}
                      <button onClick={coinFreeActive ? undefined : handleCoinAdsFree} disabled={coinFreeLoading}
                        className={`w-full py-3 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                          coinFreeActive
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 cursor-default'
                            : 'bg-[#1a1a1a] border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 active:scale-98'
                        }`}>
                        {coinFreeLoading ? (
                          <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                        ) : coinFreeActive ? (
                          <><span>⚡</span><span>Ads-Free Active</span><span className="text-[10px] bg-purple-500/20 px-2 py-0.5 rounded-full">24hr</span></>
                        ) : (
                          <><span>⚡</span><span>Ads-Free করো</span><span className="text-[10px] bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30">{adsFreeCoins} 🪙</span></>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Channel */}
                  <div onClick={() => window.open(channelLink, '_blank')}
                    className="w-full p-3 rounded-xl bg-[#0088cc]/10 border border-[#0088cc]/30 flex items-center justify-center cursor-pointer active:scale-98 transition-transform">
                    <Send size={22} className="text-[#0088cc]" />
                  </div>
                </div>
              )}

              {/* Series Tabs */}
              {isSeries && (
                <div className="flex items-center gap-6 mb-5 border-b border-white/8">
                  <button onClick={() => setActiveTab('episodes')} className={`pb-3 text-xs font-bold tracking-wider uppercase transition-all ${activeTab === 'episodes' ? 'text-gold border-b-2 border-gold' : 'text-gray-500'}`}>Episodes</button>
                  <button onClick={() => setActiveTab('info')} className={`pb-3 text-xs font-bold tracking-wider uppercase transition-all ${activeTab === 'info' ? 'text-gold border-b-2 border-gold' : 'text-gray-500'}`}>About</button>
                </div>
              )}

              <div className="min-h-[200px]">
                {/* Episodes tab */}
                {isSeries && activeTab === 'episodes' && (
                  <div>
                    {availableSeasons.length > 0 && (
                      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-1">
                        {availableSeasons.map(sn => {
                          const si = getSeasonInfo(sn);
                          const lk = si?.isLocked || si?.isComingSoon;
                          return (
                            <button key={sn} onClick={() => setSelectedSeason(sn)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${selectedSeason === sn ? lk ? 'bg-yellow-500/80 text-black' : 'bg-gold text-black' : lk ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' : 'bg-white/8 text-gray-400 border border-white/5'}`}>
                              {lk && <Lock size={10} />}
                              {si?.title || `Season ${sn}`}
                              {lk && <span className="text-[8px] bg-black/20 px-1.5 py-0.5 rounded-full font-extrabold">SOON</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {isCurrentSeasonLocked && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-14 px-6 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center mb-4">
                          <Lock size={28} className="text-yellow-400" />
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1">{currentSeasonInfo?.title || `Season ${selectedSeason}`} — Coming Soon</h3>
                        {currentSeasonInfo?.releaseDate && (
                          <div className="flex items-center gap-1.5 mt-2 text-yellow-400 text-sm">
                            <Calendar size={13} /><span>{currentSeasonInfo.releaseDate}</span>
                          </div>
                        )}
                        <p className="text-gray-400 text-xs mt-3 leading-relaxed max-w-xs">Stay tuned for updates on our channel.</p>
                        <button onClick={() => window.open(channelLink, '_blank')}
                          className="mt-5 flex items-center gap-2 bg-[#0088cc]/20 border border-[#0088cc]/40 text-[#0088cc] px-5 py-2.5 rounded-xl text-sm font-bold">
                          <Send size={14} />Get Notified
                        </button>
                      </motion.div>
                    )}

                    {!isCurrentSeasonLocked && (
                      <div className="space-y-3">
                        {currentEpisodes.length > 0 ? currentEpisodes.map((ep, index) => {
                          const isCS = ep.isComingSoon || ep.isUpcoming;
                          const epAdCount = ep.watchAdCount !== undefined && ep.watchAdCount >= 0 ? ep.watchAdCount : watchAdCount;
                          const needsAd = adsEnabled && epAdCount > 0 && !isCS;
                          const epKey = `${movie.id}_ep_${ep.id}_watch`;
                          const epUnlocked = isUnlocked(epKey);

                          return (
                            <motion.div key={ep.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.03 }}
                              style={{ borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(135deg,#18181c,#141418)', border: `1px solid ${isCS ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.07)'}`, opacity: isCS ? 0.65 : 1, marginBottom: 10 }}>

                              {/* Thumbnail */}
                              <div onClick={() => !isCS && handleEpWatch({ title: ep.title, number: ep.number, id: ep.id, telegramCode: ep.telegramCode, watchAdCount: ep.watchAdCount })}
                                style={{ position: 'relative', width: '100%', aspectRatio: '16/9', cursor: isCS ? 'not-allowed' : 'pointer', overflow: 'hidden' }}>
                                <img src={ep.thumbnail || movie.thumbnail} alt={ep.title}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', filter: ep.thumbnail ? 'none' : 'brightness(0.55) saturate(0.6)' }} />
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.75) 0%,rgba(0,0,0,0.12) 45%,transparent 70%)' }} />

                                {/* EP badge */}
                                <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', borderRadius: 6, padding: '2px 7px', fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: '#fff' }}>EP {ep.number}</div>

                                {ep.duration && !isCS && (
                                  <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', borderRadius: 6, padding: '2px 7px', fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>{ep.duration}</div>
                                )}

                                {/* Status badge */}
                                {!isCS && (
                                  epUnlocked ? (
                                    <div style={{ position: 'absolute', bottom: 34, right: 8, background: 'linear-gradient(135deg,rgba(34,197,94,0.95),rgba(21,128,61,0.95))', borderRadius: 7, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <Unlock size={9} color="#fff" />
                                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 900, color: '#fff' }}>Unlocked</span>
                                    </div>
                                  ) : needsAd ? (
                                    <div style={{ position: 'absolute', bottom: 34, right: 8, background: 'linear-gradient(135deg,rgba(245,158,11,0.96),rgba(217,119,6,0.96))', borderRadius: 7, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 2px 12px rgba(245,158,11,0.38)' }}>
                                      <Lock size={9} color="#000" />
                                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 900, color: '#000' }}>{epAdCount} AD</span>
                                    </div>
                                  ) : null
                                )}

                                {/* Coming soon */}
                                {isCS && (
                                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                    <Lock size={22} className="text-yellow-400" />
                                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 800, color: '#FDE68A', letterSpacing: '0.1em' }}>COMING SOON</span>
                                  </div>
                                )}

                                {/* Center icon */}
                                {!isCS && (
                                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: epUnlocked ? 'rgba(34,197,94,0.22)' : needsAd ? 'rgba(245,158,11,0.22)' : 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: epUnlocked ? '1.5px solid rgba(34,197,94,0.55)' : needsAd ? '1.5px solid rgba(245,158,11,0.55)' : '1px solid rgba(255,255,255,0.3)' }}>
                                      {needsAd && !epUnlocked
                                        ? <Lock size={17} color="#f59e0b" />
                                        : <Play size={17} fill="white" color="white" style={{ marginLeft: 2 }} />
                                      }
                                    </div>
                                  </div>
                                )}

                                {/* Title */}
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 10px' }}>
                                  <h4 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 700, color: isCS ? 'rgba(255,255,255,0.5)' : '#fff', lineHeight: 1.2, textShadow: '0 1px 8px rgba(0,0,0,0.9)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{ep.title}</h4>
                                </div>
                              </div>

                              {/* Action row */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px' }}>
                                <div style={{ flex: 1, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                  {ep.quality && !isCS && <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 700, color: '#86EFAC', background: 'rgba(34,197,94,0.12)', padding: '2px 7px', borderRadius: 6 }}>{ep.quality}</span>}
                                  {ep.fileSize && !isCS && <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 700, color: '#93C5FD', background: 'rgba(59,130,246,0.12)', padding: '2px 7px', borderRadius: 6 }}>{ep.fileSize}</span>}
                                  {isCS && ep.releaseDate && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <Calendar size={10} className="text-yellow-400" />
                                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: '#FDE68A', fontWeight: 600 }}>{ep.releaseDate}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Watch btn */}
                                <button
                                  onClick={e => { e.stopPropagation(); if (!isCS) handleEpWatch({ title: ep.title, number: ep.number, id: ep.id, telegramCode: ep.telegramCode, watchAdCount: ep.watchAdCount }); }}
                                  disabled={isCS}
                                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 10, fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 800, letterSpacing: '0.04em', cursor: isCS ? 'not-allowed' : 'pointer', border: 'none', background: isCS ? 'rgba(255,255,255,0.06)' : epUnlocked ? '#22c55e' : needsAd ? 'linear-gradient(135deg,#f59e0b,#d97706)' : '#fff', color: isCS ? 'rgba(255,255,255,0.3)' : epUnlocked ? '#fff' : '#000' }}>
                                  {isCS ? <><Lock size={10} color="rgba(255,255,255,0.3)" />Soon</>
                                    : epUnlocked ? <><Play size={10} fill="white" color="white" />Watch</>
                                    : needsAd ? <><Lock size={10} fill="black" color="black" />Watch</>
                                    : <><Play size={10} fill="#000" color="#000" />Watch</>}
                                </button>

                                {/* Download btn */}
                                {(ep.downloadCode || ep.downloadLink || ep.telegramCode) && (
                                  <button
                                    onClick={e => { e.stopPropagation(); if (!isCS) handleEpDownload({ title: ep.title, number: ep.number, id: ep.id, downloadCode: ep.downloadCode, downloadLink: ep.downloadLink, telegramCode: ep.telegramCode, watchAdCount: ep.watchAdCount }); }}
                                    disabled={isCS}
                                    style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isCS ? 'not-allowed' : 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: isCS ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.75)' }}>
                                    {ep.downloadLink ? <ExternalLink size={13} /> : <Download size={13} />}
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          );
                        }) : (
                          <div className="text-center py-16 text-gray-500 text-sm">
                            <div className="mb-3 text-4xl">📺</div>
                            <p className="font-semibold">No episodes available</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Info tab */}
                {(!isSeries || activeTab === 'info') && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <p className="text-gray-300 text-sm leading-7 font-medium opacity-90">{movie.description || 'No description available.'}</p>

                    {movie.screenshots && movie.screenshots.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2"><ImageIcon size={14} className="text-gold" />Screenshots</h3>
                          <span className="text-[10px] text-gray-500">{movie.screenshots.length} photos</span>
                        </div>
                        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2">
                          {movie.screenshots.map((sc, idx) => (
                            <div key={idx} className="relative flex-shrink-0 rounded-xl overflow-hidden bg-[#111] border border-white/5 cursor-pointer" style={{ width: 220, aspectRatio: '16/9' }} onClick={() => { setViewerIndex(idx); setViewerOpen(true); }}>
                              <img src={sc} alt="" className="w-full h-full object-cover" />
                              <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-[8px] text-gray-300 px-1.5 py-0.5 rounded">{idx + 1}/{movie.screenshots.length}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { label: 'Rating', value: `${movie.rating}/10`, showStar: true },
                        { label: 'Genre', value: movie.category },
                        { label: 'Quality', value: movie.quality || 'HD' },
                        { label: 'Year', value: movie.year || 'N/A' },
                        ...(movie.duration ? [{ label: 'Duration', value: movie.duration }] : []),
                        ...(movie.fileSize ? [{ label: 'File Size', value: movie.fileSize }] : []),
                      ].map((item, i) => (
                        <div key={i} className="bg-[#111] p-3 rounded-xl border border-white/5">
                          <span className="text-[10px] text-gray-500 uppercase block mb-1">{item.label}</span>
                          <span className="text-xs text-white font-semibold flex items-center gap-1">
                            {(item as any).showStar && <Star size={12} fill="#FFD700" className="text-gold" />}
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {isSeries && (
                      <div onClick={() => window.open(channelLink, '_blank')}
                        className="w-full p-3.5 rounded-xl bg-[#0088cc]/10 border border-[#0088cc]/30 flex items-center justify-center gap-3 cursor-pointer active:scale-98 transition-transform">
                        <Send size={20} className="text-[#0088cc]" />
                        <span className="text-[#0088cc] text-sm font-bold">Join Telegram Channel</span>
                        <ChevronRight size={16} className="text-[#0088cc]" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ── Cinematic Lock Screen ── */}
      <AnimatePresence>
        {lockScreen.open && (
          <CinematicLockScreen
            movie={movie} total={lockScreen.total} watched={lockScreen.watched}
            actionType={lockScreen.type} skipped={lockScreen.skipped}
            adLoading={lockScreen.adLoading} savedProgress={lockScreen.savedProgress}
            onClose={() => setLockScreen(s => ({ ...s, open: false }))}
            onWatchAd={handleMovieLockWatchAd}
            tutorialLink={appSettings?.tutorialChannelLink}
          />
        )}
      </AnimatePresence>

      {/* ── Episode Lock Overlay ── */}
      <AnimatePresence>
        {epLock.open && epLock.episode && (
          <EpisodeLockOverlay
            movie={movie} episode={epLock.episode} total={epLock.total} watched={epLock.watched}
            skipped={epLock.skipped} adLoading={epLock.adLoading} savedProgress={epLock.savedProgress}
            onClose={() => setEpLock(s => ({ ...s, open: false }))}
            onWatchAd={handleEpLockWatchAd}
            tutorialLink={appSettings?.tutorialChannelLink}
          />
        )}
      </AnimatePresence>

      {/* ── YES/NO Confirmation ── */}
      <AnimatePresence>
        {confirmState.open && (
          <ConfirmPage
            movie={movie} actionType={confirmState.type}
            onConfirm={handleConfirmYes} onCancel={handleConfirmNo}
          />
        )}
      </AnimatePresence>

      {/* ── Screenshot Viewer ── */}
      <AnimatePresence>
        {viewerOpen && movie.screenshots && (
          <ScreenshotViewer screenshots={movie.screenshots} initialIndex={viewerIndex} onClose={() => setViewerOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

export default MovieDetails;

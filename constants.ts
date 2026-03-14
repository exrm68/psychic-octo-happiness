import { Movie } from './types';

// Bot Username — Admin Panel > Settings থেকে set করো
export const BOT_USERNAME = '';

// ✅ Demo data সরিয়ে দেওয়া হয়েছে - Firestore থেকে real data আসবে
export const INITIAL_MOVIES: Movie[] = [];

// Categories for filtering
export const CATEGORIES = ['All', 'Exclusive', 'Movies', 'Web Series', 'K-Drama', 'Anime'];

// Categories for Single Movies in Admin Panel
export const MOVIE_CATEGORIES = ['Exclusive', 'Movies', 'Anime'];

// Categories for Series in Admin Panel
export const SERIES_CATEGORIES = ['Exclusive', 'Web Series', 'K-Drama', 'Anime'];
export interface Episode {
  id: string;
  number: number;
  season: number;
  title: string;
  duration: string;
  telegramCode: string;
  downloadCode?: string;
  downloadLink?: string;
  fileSize?: string;
  audioLanguage?: string;
  subtitles?: string;
  quality?: string;
  thumbnail?: string;
  isComingSoon?: boolean;
  releaseDate?: string;
  isUpcoming?: boolean;
  watchAdCount?: number;
}

export interface SeasonInfo {
  season: number;
  isLocked?: boolean;
  isComingSoon?: boolean;
  releaseDate?: string;
  title?: string;
}

export interface Movie {
  id: string;
  title: string;
  thumbnail: string;
  category: string;
  telegramCode: string;
  downloadCode?: string;
  downloadLink?: string;
  rating: number;
  views: string;
  year?: string;
  quality?: string;
  description?: string;
  episodes?: Episode[];
  seasons?: SeasonInfo[];
  isPremium?: boolean;
  createdAt?: any;
  fileSize?: string;
  duration?: string;
  audioLanguage?: string;
  subtitles?: string;
  videoQuality?: string;
  detailBanner?: string;
  screenshots?: string[];
  isUpcoming?: boolean;
  releaseDate?: string;
  isFeatured?: boolean;
  featuredOrder?: number;
  isTop10?: boolean;
  top10Position?: number;
  storyImage?: string;
  storyEnabled?: boolean;
  priority?: number;
  isExclusive?: boolean;
  watchAdCount?: number;
  downloadAdCount?: number;
}

export interface StoryItem {
  id: string;
  image: string;
  thumbnailUrl?: string;
  movieId?: string;
  link?: string;
  order: number;
  createdAt?: any;
  storyBadge?: string;
}

export interface BannerItem {
  id: string;
  movieId?: string;
  title: string;
  image: string;
  description?: string;
  link?: string;
  order: number;
  isActive: boolean;
  createdAt?: any;
}

export interface AppSettings {
  botUsername: string;
  channelLink: string;
  noticeChannelLink?: string;
  noticeText?: string;
  noticeEnabled?: boolean;
  autoViewIncrement?: boolean;
  categories?: string[];
  enableTop10?: boolean;
  enableStories?: boolean;
  enableBanners?: boolean;
  primaryColor?: string;
  appName?: string;
  // ✅ Referral Bot (আলাদা — referral link এর জন্য)
  referralBotUsername?: string;
  referralAppName?: string;
  // ✅ Ad Settings
  adEnabled?: boolean;
  adZoneId?: string;
  adScriptUrl?: string;
  adsgramEnabled?: boolean;
  adsgramBlockId?: string;
  defaultWatchAdCount?: number;
  defaultDownloadAdCount?: number;
  tutorialChannelLink?: string;
  // ✅ Coin Settings
  coinWelcome?: number;
  coinDaily?: number;
  coinPerRefer?: number;
  coinMilestone5?: number;
  coinMilestone10?: number;
  coinMilestone20?: number;
  coinMilestone50?: number;
  coinRate?: number;
  minWithdraw?: number;
  // ✅ Ads-Free with Coin
  adsFreeEnabled?: boolean;
  adsFreeCoinsPerContent?: number;
}

export type Category = 'All' | 'Exclusive' | 'Movies' | 'Web Series' | 'K-Drama' | 'Anime' | string;

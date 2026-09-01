import { NewsPost, AgencyBrand, AIProviderType } from '../types';
import { INITIAL_NEWS_POST } from '../data/presets';

const KEYS = {
  CURRENT_POST: 'smart_journalist_current_post_v2',
  SAVED_POSTS: 'smart_journalist_saved_posts_v2',
  AGENCIES: 'smart_journalist_agencies_v2',
  AI_CONFIG: 'smart_journalist_ai_config_v2',
};

export interface StoredAiConfig {
  provider: AIProviderType;
  mistralModel: string;
  openrouterModel: string;
  mistralApiKey: string;
  openrouterApiKey: string;
  humanize: boolean;
}

export const DEFAULT_AI_CONFIG: StoredAiConfig = {
  provider: 'gemini',
  mistralModel: 'mistral-large-latest',
  openrouterModel: 'meta-llama/llama-3.3-70b-instruct',
  mistralApiKey: '',
  openrouterApiKey: '',
  humanize: true,
};

export const DEFAULT_AGENCIES: AgencyBrand[] = [
  {
    id: 'agency_khabar_online',
    name: 'خبرگزاری آنلاین',
    logoUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=200&h=200&q=80',
    watermarkText: '@KhabarOnline_Fa',
    sourceName: 'خبرگزاری خبرآنلاین',
    badgeShape: 'pill',
    logoPosition: 'top-left',
    logoSize: 'md',
    showAgencyName: true,
    brandColor: '#ef4444',
    isDefault: true,
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },
  {
    id: 'agency_tech_mag',
    name: 'مجله فناوری و تکنولوژی',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&h=200&q=80',
    watermarkText: '@TechNews_Daily',
    sourceName: 'پایگاه خبری فناوری',
    badgeShape: 'pill',
    logoPosition: 'top-right',
    logoSize: 'md',
    showAgencyName: true,
    brandColor: '#3b82f6',
    isDefault: false,
    createdAt: 1700000000001,
    updatedAt: 1700000000001,
  },
  {
    id: 'agency_economy_watch',
    name: 'دیدبان بازار و اقتصاد',
    logoUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=200&h=200&q=80',
    watermarkText: '@EcoWatch_Channel',
    sourceName: 'شبکه اخبار اقتصادی',
    badgeShape: 'square',
    logoPosition: 'top-left',
    logoSize: 'md',
    showAgencyName: true,
    brandColor: '#10b981',
    isDefault: false,
    createdAt: 1700000000002,
    updatedAt: 1700000000002,
  },
];

// Helper to safely read from localStorage
function safeGetItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[LocalStorage] Failed to parse key "${key}":`, err);
    return fallback;
  }
}

// Helper to safely write to localStorage
function safeSetItem(key: string, value: any): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`[LocalStorage] Failed to write key "${key}":`, err);
    return false;
  }
}

// -------------------------------------------------------------
// 1. Current Post Draft Management (LocalStorage)
// -------------------------------------------------------------
export function getStoredCurrentPost(): NewsPost {
  return safeGetItem<NewsPost>(KEYS.CURRENT_POST, INITIAL_NEWS_POST);
}

export function saveStoredCurrentPost(post: NewsPost): void {
  safeSetItem(KEYS.CURRENT_POST, post);
}

// -------------------------------------------------------------
// 2. Saved Posts / Archive Management (LocalStorage)
// -------------------------------------------------------------
export function getStoredPosts(): NewsPost[] {
  return safeGetItem<NewsPost[]>(KEYS.SAVED_POSTS, []);
}

export function savePostToStorage(post: NewsPost): NewsPost {
  const posts = getStoredPosts();
  const postToSave: NewsPost = {
    ...post,
    id: post.id || `news_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: post.createdAt || Date.now(),
    updatedAt: Date.now(),
  };

  const existingIndex = posts.findIndex((p) => p.id === postToSave.id);
  if (existingIndex >= 0) {
    posts[existingIndex] = postToSave;
  } else {
    posts.unshift(postToSave);
  }

  safeSetItem(KEYS.SAVED_POSTS, posts);
  return postToSave;
}

export function deletePostFromStorage(id: string): boolean {
  const posts = getStoredPosts();
  const updated = posts.filter((p) => p.id !== id);
  return safeSetItem(KEYS.SAVED_POSTS, updated);
}

// -------------------------------------------------------------
// 3. Agency Brands & Logos Management (LocalStorage)
// -------------------------------------------------------------
export function getStoredAgencies(): AgencyBrand[] {
  const agencies = safeGetItem<AgencyBrand[]>(KEYS.AGENCIES, []);
  if (!agencies || agencies.length === 0) {
    // Seed default agencies into localStorage
    safeSetItem(KEYS.AGENCIES, DEFAULT_AGENCIES);
    return DEFAULT_AGENCIES;
  }
  return agencies;
}

export function saveAgencyToStorage(agencyData: Partial<AgencyBrand>): AgencyBrand {
  const agencies = getStoredAgencies();
  const newAgency: AgencyBrand = {
    id: agencyData.id || `agency_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: agencyData.name || 'خبرگزاری',
    logoUrl: agencyData.logoUrl || '',
    watermarkText: agencyData.watermarkText,
    sourceName: agencyData.sourceName,
    badgeShape: agencyData.badgeShape || 'pill',
    logoPosition: agencyData.logoPosition || 'top-left',
    logoSize: agencyData.logoSize || 'md',
    showAgencyName: agencyData.showAgencyName ?? true,
    brandColor: agencyData.brandColor || '#ef4444',
    isDefault: !!agencyData.isDefault,
    createdAt: agencyData.createdAt || Date.now(),
    updatedAt: Date.now(),
  };

  // If set to default, unmark other defaults
  if (newAgency.isDefault) {
    agencies.forEach((a) => (a.isDefault = false));
  }

  const existingIndex = agencies.findIndex((a) => a.id === newAgency.id);
  if (existingIndex >= 0) {
    agencies[existingIndex] = newAgency;
  } else {
    agencies.unshift(newAgency);
  }

  safeSetItem(KEYS.AGENCIES, agencies);
  return newAgency;
}

export function deleteAgencyFromStorage(id: string): boolean {
  const agencies = getStoredAgencies();
  const updated = agencies.filter((a) => a.id !== id);
  return safeSetItem(KEYS.AGENCIES, updated);
}

// -------------------------------------------------------------
// 4. AI Configuration & API Keys (LocalStorage)
// -------------------------------------------------------------
export function getStoredAiConfig(): StoredAiConfig {
  const config = safeGetItem<StoredAiConfig>(KEYS.AI_CONFIG, DEFAULT_AI_CONFIG);
  return { ...DEFAULT_AI_CONFIG, ...config };
}

export function saveStoredAiConfig(config: Partial<StoredAiConfig>): StoredAiConfig {
  const current = getStoredAiConfig();
  const updated: StoredAiConfig = {
    ...current,
    ...config,
  };
  safeSetItem(KEYS.AI_CONFIG, updated);
  return updated;
}

// -------------------------------------------------------------
// 5. Full Backup Export / Import (LocalStorage)
// -------------------------------------------------------------
export function exportAllDataAsJson(): string {
  const data = {
    version: '2.0.0',
    exportDate: new Date().toISOString(),
    currentPost: getStoredCurrentPost(),
    savedPosts: getStoredPosts(),
    agencies: getStoredAgencies(),
    aiConfig: getStoredAiConfig(),
  };
  return JSON.stringify(data, null, 2);
}

export function importDataFromJson(jsonString: string): { success: boolean; message: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.currentPost) safeSetItem(KEYS.CURRENT_POST, parsed.currentPost);
    if (Array.isArray(parsed.savedPosts)) safeSetItem(KEYS.SAVED_POSTS, parsed.savedPosts);
    if (Array.isArray(parsed.agencies)) safeSetItem(KEYS.AGENCIES, parsed.agencies);
    if (parsed.aiConfig) safeSetItem(KEYS.AI_CONFIG, parsed.aiConfig);

    return { success: true, message: 'اطلاعات با موفقیت در حافظه مرورگر بازیابی شد.' };
  } catch (err: any) {
    return { success: false, message: 'فایل بک‌آپ نامعتبر است: ' + (err.message || String(err)) };
  }
}

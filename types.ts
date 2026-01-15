
export enum AppState {
  GUEST_INTRO = 'GUEST_INTRO',
  SPLASH = 'SPLASH',
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  MAIN_APP = 'MAIN_APP',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  PLANS = 'PLANS'
}

export enum UserRole {
  GUEST = 'GUEST',
  USER = 'USER',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN'
}

export enum VibeLevel {
  LOW = 'Low',     // 0-40
  MEDIUM = 'Medium', // 40-70
  HIGH = 'High',   // 70-90
  HOT = 'Hot'      // 90-100
}

export enum ThemePreference {
  AUTO = 'AUTO',
  LIGHT = 'LIGHT',
  DARK = 'DARK'
}

export enum MapTheme {
  AUTO = 'AUTO',
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  SATELLITE = 'SATELLITE'
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface MapState {
  center: Coordinates;
  zoom: number;
}

export interface Venue {
  id: string;
  name: string;
  type: 'Bar' | 'Club' | 'Lounge' | 'Live Music';
  imageUrl: string;
  coordinates: Coordinates;
  vibeScore: number; // 0-100 (BACKEND ONLY - Always divide by 10 for user display: vibeScore/10)
  vibeConfidence: 'Dead' | 'Warming' | 'Popping' | 'Hot';
  vibeTrend: 'Rising' | 'Falling' | 'Stable';
  district: string;
  description: string;
  priceLevel: 1 | 2 | 3 | 4;
  isFavorite?: boolean;
  isPromoted?: boolean; // For Admin Recommended Engine
  aiNarrative?: string; // AI-generated context narrative
  lastUpdated?: string; // Timestamp when vibe score was last calculated
  city?: string; // City name
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  venueId: string;
  rating: number;
  text: string;
  timestamp: string;
}

export interface Service {
  id: string;
  name: string;
  icon: string;
  description: string;
  actionUrl: string;
  color: string;
  isActive: boolean;
  locations?: string[]; // For admin geo-fencing
}

export interface Affiliate {
  id: string;
  partnerName: string;
  affiliateId: string;
}

export interface DataSource {
  id: string;
  name: string;
  provider: 'Google' | 'Yelp' | 'Eventbrite' | 'Other';
  status: 'Active' | 'Error' | 'Syncing';
  interval: string;
  lastSync: string;
}

export interface TickerSource {
  id: string;
  name: string;
  type: 'Manual' | 'API';
  content?: string; // For manual
  isActive: boolean;
}

export interface OnboardingSlide {
  title: string;
  desc: string;
  image: string;
}

export interface UserPreferences {
  isTravelMode: boolean;
  mission: string[];
  music: string[];
  crowdGroup: string;
  crowdDensity: string;
  timing: string[];
  budgetMode: 'VIBE' | 'EXACT';
  budgetTier: string;
  budgetRange: [number, number];
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  preferences?: UserPreferences;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: ChatMessage[];
}

export interface Plan {
  id: string;
  title: string;
  date: string;
  venueIds: string[];
  status: 'Upcoming' | 'Past' | 'Draft';
  sharedWith: string[]; // Friend IDs
}

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  isTrusted: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  perks: string[];
  isActive: boolean; // For A/B testing
  isPopular?: boolean;
}

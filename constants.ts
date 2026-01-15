import { VibeLevel, Review, Service, Plan, Friend, DataSource, SubscriptionPlan, Affiliate, TickerSource, OnboardingSlide, Venue } from './types';

// Mock Venues Data (used as fallback when database is unavailable)
export const MOCK_VENUES: Venue[] = [
  {
    id: '1',
    name: 'Skybar Lounge',
    type: 'Lounge',
    imageUrl: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800&q=80',
    coordinates: { lat: 40.7580, lng: -73.9855 },
    vibeScore: 85,
    vibeConfidence: 'Popping',
    vibeTrend: 'Rising',
    district: 'Midtown',
    description: 'Rooftop bar with stunning city views and craft cocktails.',
    priceLevel: 3,
    isPromoted: true
  },
  {
    id: '2',
    name: 'The Underground',
    type: 'Club',
    imageUrl: 'https://images.unsplash.com/photo-1571204829887-3b8d69e4094d?w=800&q=80',
    coordinates: { lat: 40.7282, lng: -73.7949 },
    vibeScore: 92,
    vibeConfidence: 'Popping',
    vibeTrend: 'Stable',
    district: 'Downtown',
    description: 'Premier nightclub featuring world-class DJs and immersive light shows.',
    priceLevel: 4,
    isPromoted: false
  },
  {
    id: '3',
    name: 'Jazz & Blues Corner',
    type: 'Live Music',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
    coordinates: { lat: 40.7484, lng: -73.9857 },
    vibeScore: 68,
    vibeConfidence: 'Warming',
    vibeTrend: 'Rising',
    district: 'Harlem',
    description: 'Intimate venue showcasing live jazz and blues performances nightly.',
    priceLevel: 2,
    isPromoted: false
  },
  {
    id: '4',
    name: 'Neon Dreams',
    type: 'Bar',
    imageUrl: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&q=80',
    coordinates: { lat: 40.7589, lng: -73.9851 },
    vibeScore: 45,
    vibeConfidence: 'Dead',
    vibeTrend: 'Falling',
    district: 'Chelsea',
    description: 'Retro-themed cocktail bar with arcade games and neon aesthetics.',
    priceLevel: 2,
    isPromoted: false
  },
  {
    id: '5',
    name: 'The Velvet Room',
    type: 'Lounge',
    imageUrl: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800&q=80',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    vibeScore: 78,
    vibeConfidence: 'Popping',
    vibeTrend: 'Stable',
    district: 'Financial District',
    description: 'Upscale speakeasy with premium spirits and live piano.',
    priceLevel: 4,
    isPromoted: true
  }
];


// Mock Data for Reviews (Will be replaced by Supabase calls later)
export const MOCK_REVIEWS: Review[] = [
  {
    id: 'r1',
    userId: 'u1',
    venueId: '1',
    userName: 'Sarah J.',
    userAvatar: 'https://i.pravatar.cc/150?u=1',
    rating: 5,
    text: 'The energy here is insane right now! DJ is killing it.',
    timestamp: '10m ago'
  },
  {
    id: 'r2',
    userId: 'u2',
    venueId: '1',
    userName: 'Mike T.',
    userAvatar: 'https://i.pravatar.cc/150?u=2',
    rating: 4,
    text: 'Crowded but good vibes. Drinks are pricey though.',
    timestamp: '30m ago'
  },
  {
    id: 'r3',
    userId: 'u3',
    venueId: '1',
    userName: 'Jessica W.',
    userAvatar: 'https://i.pravatar.cc/150?u=3',
    rating: 5,
    text: 'Best night out in weeks. Highly recommend arriving before 11.',
    timestamp: '1h ago'
  }
];

export const PARTNER_SERVICES: Service[] = [
  {
    id: 's1',
    name: 'Uber',
    icon: 'fa-car',
    description: 'Get a reliable ride home safely.',
    actionUrl: '#',
    color: '#000000',
    isActive: true
  },
  {
    id: 's2',
    name: 'Ticketmaster',
    icon: 'fa-ticket',
    description: 'Book VIP entry and skip the line.',
    actionUrl: '#',
    color: '#026cdf',
    isActive: true
  },
  {
    id: 's3',
    name: 'Resy',
    icon: 'fa-utensils',
    description: 'Reserve a table nearby before heading out.',
    actionUrl: '#',
    color: '#d32f2f',
    isActive: true
  }
];

export const MOCK_PLANS: Plan[] = [
  {
    id: 'p1',
    title: 'Birthday Bash',
    date: 'Oct 28, 10:00 PM',
    venueIds: ['1', '5'],
    status: 'Upcoming',
    sharedWith: ['f1', 'f2']
  },
  {
    id: 'p2',
    title: 'Chill Friday',
    date: 'Nov 2, 8:00 PM',
    venueIds: ['2', '3'],
    status: 'Draft',
    sharedWith: []
  }
];

export const MOCK_FRIENDS: Friend[] = [
  { id: 'f1', name: 'Alex', avatar: 'https://i.pravatar.cc/150?u=20', isTrusted: true },
  { id: 'f2', name: 'Jordan', avatar: 'https://i.pravatar.cc/150?u=21', isTrusted: true },
  { id: 'f3', name: 'Taylor', avatar: 'https://i.pravatar.cc/150?u=22', isTrusted: false },
  { id: 'f4', name: 'Casey', avatar: 'https://i.pravatar.cc/150?u=23', isTrusted: false },
];

export const MOCK_DATA_SOURCES: DataSource[] = [
  { id: 'ds1', name: 'Google Places API', provider: 'Google', status: 'Active', interval: '15m', lastSync: '2m ago' },
  { id: 'ds2', name: 'Yelp Fusion', provider: 'Yelp', status: 'Active', interval: '1h', lastSync: '45m ago' },
  { id: 'ds3', name: 'Eventbrite Events', provider: 'Eventbrite', status: 'Syncing', interval: '1h', lastSync: '59m ago' },
];

export const MOCK_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-free',
    name: 'Freemium',
    priceMonthly: 0,
    priceYearly: 0,
    perks: ['3-Day Forecasts', 'Basic Venue Info', '4 City Forecasts/Mo'],
    isActive: true
  },
  {
    id: 'plan-premium',
    name: 'Premium',
    priceMonthly: 4.99,
    priceYearly: 49.00,
    perks: ['7-Day Global Forecasts', 'Real-time Updates', 'Unlimited Itineraries', 'Early Access Events'],
    isActive: true,
    isPopular: true
  },
  {
    id: 'plan-elite',
    name: 'Elite',
    priceMonthly: 14.99,
    priceYearly: 149.00,
    perks: ['Everything in Premium', 'VIP Pre-Discovery', 'Group Booking Support', 'Concierge Service'],
    isActive: true
  }
];

export const MOCK_AFFILIATES: Affiliate[] = [
  { id: 'af1', partnerName: 'Uber', affiliateId: 'uber-kunajoto-22' },
  { id: 'af2', partnerName: 'Ticketmaster', affiliateId: 'TM-KUNA-889' }
];

export const MOCK_TICKER_SOURCES: TickerSource[] = [
  { id: 'ts1', name: 'Weather Alerts', type: 'API', isActive: true },
  { id: 'ts2', name: 'Police Safety Scanner', type: 'API', isActive: true },
  { id: 'ts3', name: 'Manual Admin Override', type: 'Manual', isActive: true, content: 'Heavy rain expected in Downtown. Rooftops closing.' }
];

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    title: "THE END OF NIGHTLIFE GUESSWORK",
    desc: "Instantly understand & measure the vibe in your city in real time.",
    image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&q=80"
  },
  {
    title: "SEE THE FUTURE",
    desc: "Our world-first vibe forecast analyses thousands of data points online & in real life to serve a solid 7-day vibe forecast.",
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80"
  }
];

export const USER_ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    title: "Personalize Your Vibe",
    desc: "We need to know what you like to recommend the best spots.",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80"
  },
  {
    title: "Unlock Premium",
    desc: "Get access to exclusive advanced filters and AI chat features.",
    image: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800&q=80"
  },
  {
    title: "Location Access",
    desc: "Kunajoto works best when we know where you are. We respect your privacy.",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80"
  }
];

export const getVibeColor = (score: number): string => {
  if (score >= 90) return '#EF4444'; // Hot
  if (score >= 70) return '#EAB308'; // High
  if (score >= 40) return '#22C55E'; // Medium
  return '#3B82F6'; // Low
};

export const getVibeLabel = (score: number): VibeLevel => {
  if (score >= 90) return VibeLevel.HOT;
  if (score >= 70) return VibeLevel.HIGH;
  if (score >= 40) return VibeLevel.MEDIUM;
  return VibeLevel.LOW;
};

// Map vibe score to user-friendly confidence labels (matches legend)
export const getVibeConfidenceLabel = (score: number): string => {
  if (score >= 90) return 'Hot';       // 90-100 (9.0+)
  if (score >= 70) return 'Popping';   // 70-89 (7.0-8.9)
  if (score >= 40) return 'Warming';   // 40-69 (4.0-6.9)
  return 'Dead';                        // 0-39 (0-3.9)
};
/**
 * Admin Content Service
 * Handles fetching admin-driven content for Kunajoto Lean
 */

import { supabase } from '../src/supabaseClient';

// Types for admin content
export interface AdminEvent {
  id: string;
  city: string;
  title: string;
  description: string | null;
  event_date: string | null;
  event_time: string | null;
  image_url: string | null;
  external_link: string | null;
  is_featured: boolean;
  display_order: number;
  created_at: string;
}

export interface AdminArrivalTip {
  id: string;
  city: string;
  day_of_week: string | null;
  time_range: string | null;
  description: string;
  reason: string | null;
  display_order: number;
}

export interface AdminStayRecommendation {
  id: string;
  city: string;
  neighborhood: string;
  description: string;
  highlights: string[] | null;
  image_url: string | null;
  is_featured: boolean;
  display_order: number;
}

export interface AdminTourGuide {
  id: string;
  city: string;
  name: string;
  bio: string | null;
  profile_image_url: string | null;
  offerings: any; // JSONB
  contact_email: string | null;
  contact_phone: string | null;
  languages: string[] | null;
  specialties: string[] | null;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  is_active: boolean;
  rating: number;
  total_bookings: number;
  display_order: number;
}

export interface AdminPartyHost {
  id: string;
  city: string;
  name: string;
  bio: string | null;
  profile_image_url: string | null;
  offerings: any; // JSONB
  contact_email: string | null;
  contact_phone: string | null;
  specialties: string[] | null;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  is_active: boolean;
  rating: number;
  total_bookings: number;
  display_order: number;
}

export interface AdminAccommodation {
  id: string;
  city: string;
  name: string;
  accommodation_type: string | null;
  description: string | null;
  image_url: string | null;
  affiliate_link: string;
  price_range: string | null;
  neighborhood: string | null;
  amenities: string[] | null;
  is_partner: boolean;
  is_featured: boolean;
  display_order: number;
}

export interface AdminTravelService {
  id: string;
  city: string;
  service_type: string;
  provider_name: string;
  description: string | null;
  affiliate_link: string;
  coupon_code: string | null;
  promo_code: string | null;
  discount_details: string | null;
  image_url: string | null;
  display_order: number;
}

export interface AdminCityVibeScore {
  id: string;
  city: string;
  week_start_date: string;
  monday_score: number | null;
  tuesday_score: number | null;
  wednesday_score: number | null;
  thursday_score: number | null;
  friday_score: number | null;
  saturday_score: number | null;
  sunday_score: number | null;
  notes: string | null;
}

/**
 * Get events for a specific city
 */
export async function getEventsForCity(city: string): Promise<AdminEvent[]> {
  const { data, error } = await supabase
    .from('admin_events')
    .select('*')
    .eq('city', city)
    .order('display_order', { ascending: true })
    .order('event_date', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }

  return data || [];
}

/**
 * Get arrival tips for a specific city
 */
export async function getArrivalTipsForCity(city: string): Promise<AdminArrivalTip[]> {
  const { data, error } = await supabase
    .from('admin_arrival_tips')
    .select('*')
    .eq('city', city)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching arrival tips:', error);
    return [];
  }

  return data || [];
}

/**
 * Get stay recommendations for a specific city
 */
export async function getStayRecommendationsForCity(city: string): Promise<AdminStayRecommendation[]> {
  const { data, error } = await supabase
    .from('admin_stay_recommendations')
    .select('*')
    .eq('city', city)
    .order('is_featured', { ascending: false })
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching stay recommendations:', error);
    return [];
  }

  return data || [];
}

/**
 * Get active tour guides for a specific city
 */
export async function getTourGuidesForCity(city: string): Promise<AdminTourGuide[]> {
  const { data, error } = await supabase
    .from('admin_tour_guides')
    .select('*')
    .eq('city', city)
    .eq('is_active', true)
    .order('rating', { ascending: false })
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching tour guides:', error);
    return [];
  }

  return data || [];
}

/**
 * Get active party hosts for a specific city
 */
export async function getPartyHostsForCity(city: string): Promise<AdminPartyHost[]> {
  const { data, error } = await supabase
    .from('admin_party_hosts')
    .select('*')
    .eq('city', city)
    .eq('is_active', true)
    .order('rating', { ascending: false })
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching party hosts:', error);
    return [];
  }

  return data || [];
}

/**
 * Get accommodations for a specific city
 */
export async function getAccommodationsForCity(city: string): Promise<AdminAccommodation[]> {
  const { data, error } = await supabase
    .from('admin_accommodations')
    .select('*')
    .eq('city', city)
    .order('is_featured', { ascending: false })
    .order('is_partner', { ascending: false })
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching accommodations:', error);
    return [];
  }

  return data || [];
}

/**
 * Get travel services for a specific city and service type
 */
export async function getTravelServicesForCity(
  city: string,
  serviceType?: string
): Promise<AdminTravelService[]> {
  let query = supabase
    .from('admin_travel_services')
    .select('*')
    .eq('city', city);

  if (serviceType) {
    query = query.eq('service_type', serviceType);
  }

  const { data, error } = await query.order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching travel services:', error);
    return [];
  }

  return data || [];
}

/**
 * Get current week's vibe scores for a city
 */
export async function getCurrentVibeScoreForCity(city: string): Promise<number | null> {
  // Get current week start date (Monday)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const weekStartDate = monday.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('admin_city_vibe_scores')
    .select('*')
    .eq('city', city)
    .eq('week_start_date', weekStartDate)
    .single();

  if (error || !data) {
    console.error('Error fetching vibe score:', error);
    return null;
  }

  // Get score for current day
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[dayOfWeek];
  const scoreKey = `${currentDay}_score`;

  return data[scoreKey] || null;
}

/**
 * Get all admin content for a city (for Explore tab)
 */
export async function getAllContentForCity(city: string) {
  const [
    events,
    arrivalTips,
    stayRecommendations,
    tourGuides,
    partyHosts,
    accommodations,
    travelServices,
    vibeScore
  ] = await Promise.all([
    getEventsForCity(city),
    getArrivalTipsForCity(city),
    getStayRecommendationsForCity(city),
    getTourGuidesForCity(city),
    getPartyHostsForCity(city),
    getAccommodationsForCity(city),
    getTravelServicesForCity(city),
    getCurrentVibeScoreForCity(city)
  ]);

  return {
    events,
    arrivalTips,
    stayRecommendations,
    tourGuides,
    partyHosts,
    accommodations,
    travelServices,
    vibeScore
  };
}

/**
 * Check if user is an app admin
 */
export async function isUserAppAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('is_app_admin')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return false;
  }

  return data.is_app_admin === true;
}

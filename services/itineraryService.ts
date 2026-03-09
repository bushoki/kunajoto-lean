/**
 * itineraryService.ts
 * Handles all itinerary data access, preference matching, and access control.
 * Branch: map-features
 */

import { supabase } from '../src/supabaseClient';
import { UserPreferences } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ItineraryStop {
  id: string;
  itinerary_id: string;
  venue_id?: string;
  stop_order: number;
  is_starting_point: boolean;
  is_ending_point: boolean;
  name: string;
  description: string;
  latitude?: number;
  longitude?: number;
  arrive_time?: string;
  leave_time?: string;
}

export interface Itinerary {
  id: string;
  title: string;
  description: string;
  city: string;
  is_paid: boolean;
  price: number;
  currency: string;
  vibe_tags: string[];
  music_genres: string[];
  crowd_density: string;
  budget_tier: string;
  time_preferences: string[];
  start_time?: string;
  end_time?: string;
  days_of_week: string[];
  color: string;
  display_order: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  // Computed fields from DB function
  match_score?: number;
  has_access?: boolean;
  // Loaded separately
  stops?: ItineraryStop[];
}

// ─── Timing map: preference timing → hours ───────────────────────────────────
const TIMING_HOURS: Record<string, { start: number; end: number }> = {
  'Happy Hour': { start: 17, end: 20 },
  'Prime Time': { start: 21, end: 24 },
  'Late Night': { start: 0, end: 3 },
  'Afters': { start: 3, end: 7 },
};

/**
 * Check if the current hour falls within any of the user's timing preferences.
 * Used for "vibe matchmaking" — e.g. a user who wants Late Night gets venues open past midnight.
 */
export function isCurrentTimeMatchingPreference(timingPrefs: string[]): boolean {
  if (!timingPrefs || timingPrefs.length === 0) return true;
  const now = new Date();
  const hour = now.getHours();
  return timingPrefs.some(pref => {
    const range = TIMING_HOURS[pref];
    if (!range) return false;
    if (range.start <= range.end) {
      return hour >= range.start && hour < range.end;
    }
    // Overnight range (e.g. Late Night: 0-3 is already handled as 0-3)
    return hour >= range.start || hour < range.end;
  });
}

/**
 * Score an itinerary against user preferences.
 * Returns a score 0–100 (higher = better match).
 */
export function scoreItineraryAgainstPrefs(
  itinerary: Itinerary,
  prefs: UserPreferences | null
): number {
  if (!prefs) return 0;
  let score = 0;

  // Timing match (30 pts max)
  const timingMatches = itinerary.time_preferences.filter(t =>
    prefs.timing?.includes(t)
  ).length;
  score += Math.min(timingMatches * 15, 30);

  // Music match (30 pts max)
  const musicMatches = itinerary.music_genres.filter(m =>
    prefs.music?.includes(m)
  ).length;
  score += Math.min(musicMatches * 10, 30);

  // Crowd density match (20 pts)
  if (itinerary.crowd_density && prefs.crowdDensity) {
    if (itinerary.crowd_density === prefs.crowdDensity) score += 20;
  }

  // Budget match (20 pts)
  if (itinerary.budget_tier && prefs.budgetTier) {
    if (itinerary.budget_tier === prefs.budgetTier) score += 20;
  }

  return Math.min(score, 100);
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const itineraryService = {
  /**
   * Fetch itineraries for a city, with preference-based match scores.
   * Uses the DB function get_matching_itineraries when a user is logged in.
   */
  async getItinerariesForCity(city: string): Promise<Itinerary[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      let itineraries: Itinerary[] = [];

      if (userId) {
        // Use the DB function for server-side preference scoring
        const { data, error } = await supabase.rpc('get_matching_itineraries', {
          p_city: city,
          p_user_id: userId,
        });
        if (error) {
          console.warn('[itineraryService] RPC failed, falling back to direct query:', error.message);
          itineraries = await this._fallbackQuery(city);
        } else {
          itineraries = (data || []) as Itinerary[];
        }
      } else {
        itineraries = await this._fallbackQuery(city);
      }

      // Load stops for each itinerary
      const withStops = await Promise.all(
        itineraries.map(async (itin) => {
          const stops = await this.getStopsForItinerary(itin.id, itin.has_access ?? !itin.is_paid);
          return { ...itin, stops };
        })
      );

      return withStops;
    } catch (err) {
      console.error('[itineraryService] Error fetching itineraries:', err);
      return [];
    }
  },

  /**
   * Fallback direct query when user is not logged in or RPC fails.
   */
  async _fallbackQuery(city: string): Promise<Itinerary[]> {
    const { data, error } = await supabase
      .from('itineraries')
      .select('*')
      .eq('city', city)
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: true });
    if (error) throw error;
    return (data || []).map(itin => ({
      ...itin,
      match_score: 0,
      has_access: !itin.is_paid,
    }));
  },

  /**
   * Get stops for an itinerary. For paid itineraries without access,
   * returns only the starting point (teaser).
   */
  async getStopsForItinerary(itineraryId: string, hasAccess: boolean): Promise<ItineraryStop[]> {
    try {
      const query = supabase
        .from('itinerary_stops')
        .select('*')
        .eq('itinerary_id', itineraryId)
        .order('stop_order', { ascending: true });

      const { data, error } = await query;
      if (error) {
        console.warn('[itineraryService] Could not load stops:', error.message);
        return [];
      }

      const stops = data || [];

      // If no access to paid itinerary, only show the starting point as a teaser
      if (!hasAccess) {
        return stops.filter(s => s.is_starting_point).slice(0, 1);
      }

      return stops;
    } catch (err) {
      console.error('[itineraryService] Error loading stops:', err);
      return [];
    }
  },

  /**
   * Check if the current user has access to a specific itinerary.
   */
  async checkAccess(itineraryId: string): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return false;

      const { data, error } = await supabase.rpc('check_itinerary_access', {
        p_itinerary_id: itineraryId,
        p_user_id: session.user.id,
      });
      if (error) return false;
      return !!data;
    } catch {
      return false;
    }
  },

  /**
   * Get all distinct cities that have active itineraries.
   */
  async getAvailableCities(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('itineraries')
        .select('city')
        .eq('is_active', true);
      if (error) throw error;
      return [...new Set((data || []).map(r => r.city))].sort();
    } catch {
      return [];
    }
  },

  /**
   * Match itineraries to user preferences client-side.
   * Sorts by match score descending, then by featured, then display_order.
   */
  sortByPreferenceMatch(
    itineraries: Itinerary[],
    prefs: UserPreferences | null
  ): Itinerary[] {
    if (!prefs) return itineraries;
    return [...itineraries]
      .map(itin => ({
        ...itin,
        match_score: itin.match_score ?? scoreItineraryAgainstPrefs(itin, prefs),
      }))
      .sort((a, b) => {
        // Featured first
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        // Then by match score
        return (b.match_score ?? 0) - (a.match_score ?? 0);
      });
  },
};

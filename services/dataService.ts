import { supabase } from '../src/supabaseClient';
import { Venue } from '../types';
import { MOCK_VENUES, getVibeConfidenceLabel } from '../constants';

// Global cache for progressive venue loading
let venueCache: any[] = [];
let isLoadingMore = false;

export const dataService = {
  
  /**
   * Fetch venues within map bounds (OPTIMIZED - Gemini recommendation)
   * Only loads venues visible in current viewport
   */
  fetchVenuesInBounds: async (bounds: { north: number; south: number; east: number; west: number }, zoomLevel?: number): Promise<Venue[]> => {
    try {
      console.log(`[dataService] Fetching venues in bounds (zoom: ${zoomLevel})`);
      console.log(`[dataService] Bounds: lat[${bounds.south.toFixed(2)}, ${bounds.north.toFixed(2)}], lng[${bounds.west.toFixed(2)}, ${bounds.east.toFixed(2)}]`);
      
      let query = supabase
        .from('venues_with_realtime_vibe')
        .select('*')
        .gte('latitude', bounds.south)
        .lte('latitude', bounds.north)
        .gte('longitude', bounds.west)
        .lte('longitude', bounds.east);
      
      // Zoom-level filtering: At low zoom, only show featured venues
      if (zoomLevel !== undefined && zoomLevel < 10) {
        query = query.or('is_promoted.eq.true,vibe_score.gte.80');
        console.log(`[dataService] Low zoom (${zoomLevel}), filtering to featured venues only`);
      }
      
      const { data: venuesData, error: venuesError } = await query
        .order('vibe_score', { ascending: false })
        .limit(5000);
      
      if (venuesError) {
        console.error('[dataService] Error fetching venues in bounds:', venuesError);
        throw venuesError;
      }
      
      console.log(`[dataService] ✓ Fetched ${venuesData?.length || 0} venues in bounds`);
      
      // Get user favorites
      let favoriteIds: string[] = [];
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: favData } = await supabase
          .from('user_favorites')
          .select('venue_id')
          .eq('user_id', session.user.id);
        if (favData) {
          favoriteIds = favData.map((f: any) => f.venue_id);
        }
      }
      
      // Map to frontend type
      return (venuesData as any[]).map(v => ({
        id: v.id,
        name: v.name,
        type: v.type,
        imageUrl: v.image_url || 'https://picsum.photos/400/300',
        coordinates: { lat: v.latitude, lng: v.longitude },
        vibeScore: parseFloat(v.realtime_vibe_score) || v.vibe_score,
        lastUpdated: v.score_calculated_at,
        vibeConfidence: v.vibe_confidence || getVibeConfidenceLabel(v.vibe_score || 50),
        vibeTrend: v.vibe_trend || 'Stable',
        city: v.city,
        district: v.district,
        description: v.description,
        priceLevel: v.price_level,
        isPromoted: v.is_promoted,
        isFavorite: favoriteIds.includes(v.id),
        aiNarrative: v.ai_narrative || null
      }));
    } catch (err) {
      console.error('[dataService] Error in fetchVenuesInBounds:', err);
      return [];
    }
  },
  
  // Fetch initial batch of venues (fast load)
  fetchVenues: async (userLocation?: { lat: number; lng: number }): Promise<Venue[]> => {
    try {
      // 1. Fetch Venues from materialized view
      // Note: Supabase has a 1000 row default limit. To get all 17K+ venues,
      // we would need pagination, but that's too slow for initial load.
      // For now, we fetch the first 1000 venues to keep the app responsive.
      // TODO: Implement progressive loading or map bounds filtering
      console.log('[dataService] Fetching venues (first 1000)...');
      
      let query = supabase
        .from('venues_with_realtime_vibe')
        .select('*');
      
      // If user location provided, prioritize venues within ~500km radius
      if (userLocation) {
        const { lat, lng } = userLocation;
        const radiusKm = 500; // 500km radius
        const latDelta = radiusKm / 111; // ~111km per degree latitude
        const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
        
        console.log(`[dataService] Loading venues near (${lat.toFixed(2)}, ${lng.toFixed(2)}) within ${radiusKm}km radius`);
        
        // Filter by bounding box for performance
        query = query
          .gte('latitude', lat - latDelta)
          .lte('latitude', lat + latDelta)
          .gte('longitude', lng - lngDelta)
          .lte('longitude', lng + lngDelta);
      }
      
      const { data: venuesData, error: venuesError } = await query.limit(1000);

      if (venuesError) {
        console.error('[dataService] Error fetching venues:', venuesError);
        throw venuesError;
      }
      
      console.log(`[dataService] ✓ Fetched ${venuesData?.length || 0} venues (initial batch)`);
      
      // Cache the initial batch
      venueCache = venuesData || [];

      // 2. Fetch User Favorites (if logged in)
      let favoriteIds: string[] = [];
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: favData } = await supabase
          .from('user_favorites')
          .select('venue_id')
          .eq('user_id', session.user.id);
          
        if (favData) {
          favoriteIds = favData.map((f: any) => f.venue_id);
        }
      }
      
      // 3. Map to Frontend Type (database uses latitude/longitude, not lat/lng)
      return (venuesData as any[]).map(v => ({
        id: v.id,
        name: v.name,
        type: v.type,
        imageUrl: v.image_url || 'https://picsum.photos/400/300',
        coordinates: { lat: v.latitude, lng: v.longitude },
        vibeScore: v.realtime_vibe_score || v.vibe_score,
        lastUpdated: v.score_calculated_at,
        vibeConfidence: v.vibe_confidence || getVibeConfidenceLabel(v.vibe_score || 50),
        vibeTrend: v.vibe_trend || 'Stable',
        city: v.city,
        district: v.district,
        description: v.description,
        priceLevel: v.price_level,
        isPromoted: v.is_promoted,
        isFavorite: favoriteIds.includes(v.id),
        aiNarrative: v.ai_narrative || null
      }));

    } catch (err) {
      console.error('Error fetching venues:', err);
      return MOCK_VENUES;
    }
  },

  // Fetch remaining venues progressively in background
  fetchRemainingVenues: async (onProgress?: (venues: Venue[], total: number) => void): Promise<Venue[]> => {
    if (isLoadingMore) {
      console.log('[dataService] Already loading more venues, skipping...');
      return [];
    }
    
    isLoadingMore = true;
    console.log('[dataService] Starting progressive load of remaining venues...');
    
    try {
      const pageSize = 1000;
      let currentPage = 1; // Start from page 2 (page 1 already loaded)
      let allVenues = [...venueCache]; // Start with cached venues
      let hasMore = true;
      
      // Get user favorites once
      let favoriteIds: string[] = [];
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: favData } = await supabase
          .from('user_favorites')
          .select('venue_id')
          .eq('user_id', session.user.id);
        if (favData) {
          favoriteIds = favData.map((f: any) => f.venue_id);
        }
      }
      
      while (hasMore) {
        const start = currentPage * pageSize;
        const end = start + pageSize - 1;
        
        console.log(`[dataService] Fetching page ${currentPage + 1} (rows ${start}-${end})...`);
        
        const { data: pageData, error } = await supabase
          .from('venues_with_realtime_vibe')
          .select('*')
          .range(start, end);
        
        if (error) {
          console.error('[dataService] Error fetching page:', error);
          break;
        }
        
        if (pageData && pageData.length > 0) {
          // Map to frontend type
          const mappedVenues = pageData.map((v: any) => ({
            id: v.id,
            name: v.name,
            type: v.type,
            imageUrl: v.image_url || 'https://picsum.photos/400/300',
            coordinates: { lat: v.latitude, lng: v.longitude },
            vibeScore: v.realtime_vibe_score || v.vibe_score,
            lastUpdated: v.score_calculated_at,
            vibeConfidence: v.vibe_confidence || getVibeConfidenceLabel(v.vibe_score || 50),
            vibeTrend: v.vibe_trend || 'Stable',
            city: v.city,
            district: v.district,
            description: v.description,
            priceLevel: v.price_level,
            isPromoted: v.is_promoted,
            isFavorite: favoriteIds.includes(v.id),
            aiNarrative: v.ai_narrative || null
          }));
          
          allVenues = allVenues.concat(mappedVenues);
          venueCache = allVenues; // Update cache
          
          console.log(`[dataService] Page ${currentPage + 1}: +${pageData.length} venues (total: ${allVenues.length})`);
          
          // Notify progress
          if (onProgress) {
            onProgress(mappedVenues, allVenues.length);
          }
          
          // Continue if we got a full page
          hasMore = pageData.length === pageSize;
          currentPage++;
          
          // Add delay to avoid overwhelming the browser
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          hasMore = false;
        }
        
        // Safety limit
        if (currentPage > 100) {
          console.warn('[dataService] Safety limit reached');
          break;
        }
      }
      
      console.log(`[dataService] ✓ Progressive load complete: ${allVenues.length} total venues`);
      isLoadingMore = false;
      return allVenues;
      
    } catch (err) {
      console.error('[dataService] Error in progressive load:', err);
      isLoadingMore = false;
      return venueCache;
    }
  },

  toggleFavorite: async (venueId: string): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("Must be logged in");

    // Check if exists
    const { data: existing } = await supabase
      .from('user_favorites')
      .select('user_id, venue_id')
      .eq('user_id', session.user.id)
      .eq('venue_id', venueId)
      .single();

    if (existing) {
      // Remove
      await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', session.user.id)
        .eq('venue_id', venueId);
      return false; // Not favorite anymore
    } else {
      // Add
      await supabase
        .from('user_favorites')
        .insert({
          user_id: session.user.id,
          venue_id: venueId
        });
      return true; // Is favorite now
    }
  },

  updateUserProfile: async (preferences: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    await supabase
      .from('user_profiles')
      .upsert({ 
        id: session.user.id,
        preferences,
        preferences_completed: true
      });
  },

  getUserPreferences: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('preferences, preferences_completed')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }

    return data;
  },

  // My Plans Functions
  fetchUserPlans: async () => {
    console.log('[dataService] fetchUserPlans called');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log('[dataService] No session, returning empty plans');
        return [];
      }

      console.log('[dataService] Fetching plans for user:', session.user.id);
      
      // Get plans with venues
      const { data: plans, error } = await supabase
        .from('plans')
        .select(`
          *,
          plan_venues (
            id,
            venue_id,
            order_index,
            venues (
              id,
              name,
              type,
              image_url,
              vibe_score,
              latitude,
              longitude,
              district
            )
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[dataService] Error fetching plans:', error);
        return [];
      }

      console.log(`[dataService] Fetched ${plans?.length || 0} plans`);
      return plans || [];
    } catch (error) {
      console.error('[dataService] Exception in fetchUserPlans:', error);
      return [];
    }
  },

  createPlan: async (title: string, description?: string) => {
    console.log('[dataService] createPlan called:', { title, description });
    const { data: { session } } = await supabase.auth.getSession();
    console.log('[dataService] Session:', session ? 'Found' : 'Not found');
    if (!session?.user) throw new Error("Must be logged in");

    // Get today's date for the plan
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    const planData = {
      user_id: session.user.id,
      title,
      date: dateStr,
      notes: description || '',
      status: 'draft'
    };
    console.log('[dataService] Inserting plan into plans table:', planData);

    const { data, error } = await supabase
      .from('plans')
      .insert(planData)
      .select()
      .single();

    if (error) {
      console.error('[dataService] Error creating plan:', error);
      throw error;
    }
    console.log('[dataService] Plan created:', data);
    return data;
  },

  addVenueToPlan: async (planId: string, venueId: string, orderIndex?: number) => {
    console.log('[dataService] addVenueToPlan called:', { planId, venueId, orderIndex });
    const { data: { session } } = await supabase.auth.getSession();
    console.log('[dataService] Session:', session ? 'Found' : 'Not found');
    if (!session?.user) throw new Error("Must be logged in");

    // Verify plan ownership
    console.log('[dataService] Verifying plan ownership...');
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, user_id')
      .eq('id', planId)
      .single();

    if (planError) {
      console.error('[dataService] Error fetching plan:', planError);
      throw new Error(`Plan not found: ${planError.message}`);
    }

    if (!plan || plan.user_id !== session.user.id) {
      throw new Error("Unauthorized");
    }

    // Get current max order_index
    const { data: existingVenues } = await supabase
      .from('plan_venues')
      .select('order_index')
      .eq('plan_id', planId)
      .order('order_index', { ascending: false })
      .limit(1);

    const maxOrder = existingVenues && existingVenues.length > 0 ? existingVenues[0].order_index : -1;
    const newOrderIndex = orderIndex !== undefined ? orderIndex : maxOrder + 1;

    // Insert into plan_venues junction table
    const planVenueData = {
      plan_id: planId,
      venue_id: venueId,
      order_index: newOrderIndex
    };
    console.log('[dataService] Inserting into plan_venues:', planVenueData);

    const { data, error } = await supabase
      .from('plan_venues')
      .insert(planVenueData)
      .select()
      .single();

    if (error) {
      console.error('[dataService] Error adding venue to plan:', error);
      throw error;
    }
    console.log('[dataService] Venue added to plan successfully:', data);
    return data;
  },

  removeVenueFromPlan: async (planVenueId: string) => {
    const { error } = await supabase
      .from('plan_venues')
      .delete()
      .eq('id', planVenueId);

    if (error) throw error;
  },

  updatePlanStatus: async (planId: string, status: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("Must be logged in");

    const { error } = await supabase
      .from('user_plans')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', planId)
      .eq('user_id', session.user.id);

    if (error) throw error;
  },

  deletePlan: async (planId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("Must be logged in");

    const { error } = await supabase
      .from('user_plans')
      .delete()
      .eq('id', planId)
      .eq('user_id', session.user.id);

    if (error) throw error;
  },

  getCityVibeScores: async () => {
    try {
      const { data, error } = await supabase
        .from('city_vibe_scores')
        .select('*')
        .order('overall_score', { ascending: false });

      if (error) {
        console.error('[dataService] Error fetching city vibe scores:', error);
        throw error;
      }

      console.log('[dataService] Fetched city vibe scores:', data);
      return data || [];
    } catch (err) {
      console.error('[dataService] Failed to fetch city vibe scores:', err);
      throw err;
    }
  }
};

import { supabase } from '../supabaseClient';
import { Venue } from '../types';

/**
 * Optimized Data Service with Bounding-Box Fetching
 * 
 * Key Improvements:
 * 1. Fetches only venues within visible map bounds
 * 2. Uses PostGIS-style spatial queries
 * 3. Supports zoom-level filtering for performance
 * 4. No more loading 17K venues at once
 */

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface FetchOptions {
  bounds?: MapBounds;
  zoomLevel?: number;
  limit?: number;
}

const dataService = {
  /**
   * Fetch venues within map bounds (Bounding Box Query)
   * 
   * This is the core optimization - only load what's visible!
   * 
   * @param options.bounds - Current map viewport bounds
   * @param options.zoomLevel - Current zoom level (for filtering)
   * @param options.limit - Max venues to return (default: 5000)
   */
  fetchVenuesInBounds: async (options: FetchOptions = {}): Promise<Venue[]> => {
    try {
      const { bounds, zoomLevel, limit = 5000 } = options;
      
      console.log('[dataService] Fetching venues in bounds:', {
        bounds,
        zoomLevel,
        limit
      });

      let query = supabase
        .from('venues_with_realtime_vibe')
        .select('*');

      // Apply bounding box filter if provided
      if (bounds) {
        query = query
          .gte('latitude', bounds.south)
          .lte('latitude', bounds.north)
          .gte('longitude', bounds.west)
          .lte('longitude', bounds.east);
        
        console.log(`[dataService] Bounding box: lat[${bounds.south.toFixed(2)}, ${bounds.north.toFixed(2)}], lng[${bounds.west.toFixed(2)}, ${bounds.east.toFixed(2)}]`);
      }

      // Zoom-level filtering: At low zoom levels, only show featured venues
      if (zoomLevel !== undefined && zoomLevel < 10) {
        // At world/country view, only show promoted/high-score venues
        query = query.or('is_promoted.eq.true,vibe_score.gte.80');
        console.log(`[dataService] Low zoom (${zoomLevel}), filtering to featured venues only`);
      }

      // Apply limit and order by vibe score
      query = query
        .order('vibe_score', { ascending: false })
        .limit(limit);

      const { data: venuesData, error: venuesError } = await query;

      if (venuesError) {
        console.error('[dataService] Error fetching venues:', venuesError);
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

  /**
   * Legacy method - kept for backward compatibility
   * Now redirects to bounding-box fetching with user location
   */
  fetchVenues: async (userLocation?: { lat: number; lng: number }): Promise<Venue[]> => {
    if (userLocation) {
      // Convert user location to a bounding box (~500km radius)
      const radiusKm = 500;
      const latDelta = radiusKm / 111;
      const lngDelta = radiusKm / (111 * Math.cos(userLocation.lat * Math.PI / 180));
      
      return dataService.fetchVenuesInBounds({
        bounds: {
          north: userLocation.lat + latDelta,
          south: userLocation.lat - latDelta,
          east: userLocation.lng + lngDelta,
          west: userLocation.lng - lngDelta
        },
        limit: 1000
      });
    }
    
    // No location - fetch first 1000 globally
    return dataService.fetchVenuesInBounds({ limit: 1000 });
  }
};

function getVibeConfidenceLabel(score: number): string {
  if (score >= 80) return 'High';
  if (score >= 60) return 'Medium';
  return 'Low';
}

export default dataService;

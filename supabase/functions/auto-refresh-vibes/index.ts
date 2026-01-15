import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// District bonuses (0-15 points)
const DISTRICT_BONUSES: Record<string, number> = {
  'Gombe': 15, 'Kinshasa': 15, 'Lingwala': 12, 'Matete': 10,
  'Lubumbashi': 12, 'Mbuji-Mayi': 8, 'Kananga': 7, 'Kisangani': 9,
  'Bukavu': 10, 'Goma': 11, 'Kikwit': 5, 'Mbandaka': 6,
  'Matadi': 7, 'Kolwezi': 8,
  'Johannesburg': 14, 'Cape Town': 13, 'Lagos': 12, 'Nairobi': 11,
  'Accra': 10, 'Dakar': 9, 'Abidjan': 10, 'Kampala': 9
};

// Venue type bonuses (0-15 points)
const VENUE_TYPE_BONUSES: Record<string, number> = {
  'NIGHT_CLUB': 15, 'BAR': 12, 'LOUNGE': 10, 'RESTAURANT': 8,
  'CAFE': 5, 'CULTURAL_CENTER': 7, 'LIVE_MUSIC': 13
};

// Day of week boost (0-20 points) - DYNAMIC
function getDayOfWeekBoost(venueType: string): number {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = now.getHours();
  
  if (venueType === 'NIGHT_CLUB' || venueType === 'BAR' || venueType === 'LOUNGE') {
    if ((dayOfWeek === 5 && hour >= 18) || dayOfWeek === 6) return 20; // Friday night & Saturday
    if (dayOfWeek === 4 && hour >= 18) return 15; // Thursday night
    if (dayOfWeek === 0) return 10; // Sunday
    return 5; // Weekdays
  }
  
  if (venueType === 'RESTAURANT' || venueType === 'CAFE') {
    if (dayOfWeek === 0 || dayOfWeek === 6) return 12; // Weekend brunch
    return 8; // Weekday
  }
  
  return 0;
}

// Time of day boost (0-15 points) - DYNAMIC
function getTimeBoost(venueType: string): number {
  const hour = new Date().getHours();
  
  if (venueType === 'NIGHT_CLUB' || venueType === 'BAR' || venueType === 'LOUNGE') {
    if (hour >= 22 || hour <= 3) return 15; // 10pm-3am peak
    if (hour >= 20 || hour <= 5) return 10; // 8pm-5am extended
    if (hour >= 18 || hour <= 6) return 5; // 6pm-6am transition
    return 0;
  }
  
  if (venueType === 'RESTAURANT') {
    if ((hour >= 12 && hour <= 14) || (hour >= 18 && hour <= 21)) return 8; // Meal times
    return 3;
  }
  
  return 0;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }
  
  // Allow GET requests for easy testing
  if (req.method === 'GET') {
    // Continue to main logic
  }

  try {
    console.log('[AutoRefresh] Starting auto-refresh of vibe scores...');
    const startTime = Date.now();
    
    // Get all venues
    const { data: venues, error } = await supabase
      .from('venues')
      .select('id, name, type, district, vibe_score, price_level');
    
    if (error) {
      console.error('[AutoRefresh] Error fetching venues:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch venues', details: error.message }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
    
    console.log(`[AutoRefresh] Processing ${venues.length} venues...`);
    
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();
    
    let updated = 0;
    const updates = [];
    
    for (const venue of venues) {
      // Base score (20-50 based on district + venue type)
      const districtBonus = DISTRICT_BONUSES[venue.district] || 5;
      const typeBonus = VENUE_TYPE_BONUSES[venue.type] || 5;
      const baseScore = 20 + districtBonus + typeBonus;
      
      // Venue quality (0-30 based on price level)
      const qualityScore = (venue.price_level || 2) * 10;
      
      // DYNAMIC: Day of week (0-20)
      const dayBoost = getDayOfWeekBoost(venue.type);
      
      // DYNAMIC: Time of day (0-15)
      const timeBoost = getTimeBoost(venue.type);
      
      // Calculate new score
      const newScore = Math.min(100, baseScore + qualityScore + dayBoost + timeBoost);
      
      // Determine confidence
      let confidence = 'DEAD';
      if (newScore >= 80) confidence = 'HOT';
      else if (newScore >= 60) confidence = 'POPPING';
      else if (newScore >= 40) confidence = 'WARMING';
      
      // Determine trend
      let trend = 'STABLE';
      if (newScore > venue.vibe_score + 10) trend = 'RISING';
      else if (newScore < venue.vibe_score - 10) trend = 'FALLING';
      
      updates.push({
        id: venue.id,
        vibe_score: newScore,
        vibe_confidence: confidence,
        vibe_trend: trend
      });
      
      updated++;
    }
    
    // Batch update all venues
    for (const update of updates) {
      await supabase
        .from('venues')
        .update({
          vibe_score: update.vibe_score,
          vibe_confidence: update.vibe_confidence,
          vibe_trend: update.vibe_trend
        })
        .eq('id', update.id);
    }
    
    const duration = Date.now() - startTime;
    console.log(`[AutoRefresh] Completed in ${duration}ms. Updated ${updated} venues`);
    console.log(`[AutoRefresh] Current time: ${now.toISOString()} (Day: ${dayOfWeek}, Hour: ${hour})`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        updated_count: updated,
        total_venues: venues.length,
        duration_ms: duration,
        current_day: dayOfWeek,
        current_hour: hour,
        is_weekend: dayOfWeek === 0 || dayOfWeek === 6,
        is_peak_hours: hour >= 22 || hour <= 3
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
    
  } catch (error) {
    console.error('[AutoRefresh] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});

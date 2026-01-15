import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WEATHER_API_KEY = Deno.env.get('WEATHER_API_COM_API_KEY');
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BATCH_SIZE = 20; // Process 20 venues at a time

// District bonuses (0-15 points)
const DISTRICT_BONUSES: Record<string, number> = {
  // DRC Cities
  'Gombe': 15, 'Kinshasa': 15, 'Lingwala': 12, 'Matete': 10,
  'Lubumbashi': 12, 'Mbuji-Mayi': 8, 'Kananga': 7, 'Kisangani': 9,
  'Bukavu': 10, 'Goma': 11, 'Kikwit': 5, 'Mbandaka': 6,
  'Matadi': 7, 'Kolwezi': 8,
  // Other cities
  'Johannesburg': 14, 'Cape Town': 13, 'Lagos': 12, 'Nairobi': 11,
  'Accra': 10, 'Dakar': 9, 'Abidjan': 10, 'Kampala': 9
};

// Venue type bonuses (0-15 points)
const VENUE_TYPE_BONUSES: Record<string, number> = {
  'NIGHT_CLUB': 15, 'BAR': 12, 'LOUNGE': 10, 'RESTAURANT': 8,
  'CAFE': 5, 'CULTURAL_CENTER': 7, 'LIVE_MUSIC': 13
};

// Day of week boost (0-20 points)
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

// Time of day boost (0-15 points)
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

// Calculate in-app engagement (0-25 points)
async function calculateInAppEngagement(venueId: string): Promise<number> {
  try {
    // Favorites (0.5 pts each, max 10)
    const { count: favCount } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId);
    const favPoints = Math.min((favCount || 0) * 0.5, 10);
    
    // Check-ins last 30 days (0.4 pts each, max 8)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { count: checkinCount } = await supabase
      .from('checkins')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .gte('created_at', thirtyDaysAgo.toISOString());
    const checkinPoints = Math.min((checkinCount || 0) * 0.4, 8);
    
    // Reviews (0.7 pts each, max 7)
    const { count: reviewCount } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId);
    const reviewPoints = Math.min((reviewCount || 0) * 0.7, 7);
    
    return favPoints + checkinPoints + reviewPoints;
  } catch (error) {
    console.error(`[Engagement] Error for venue ${venueId}:`, error);
    return 0;
  }
}

// Weather cache to avoid excessive API calls
const weatherCache: Record<string, { data: any; expires: number }> = {};
const WEATHER_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Get weather adjustment for a city
async function getWeatherAdjustment(city: string): Promise<number> {
  if (!WEATHER_API_KEY) {
    console.log('[Weather] No API key, returning neutral');
    return 0;
  }
  
  try {
    // Check cache
    const cached = weatherCache[city];
    if (cached && cached.expires > Date.now()) {
      return calculateWeatherImpact(cached.data);
    }
    
    // Fetch from API
    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(city)}&aqi=no`
    );
    
    if (!response.ok) {
      console.error(`[Weather] API error for ${city}: ${response.status}`);
      return 0;
    }
    
    const data = await response.json();
    
    // Cache the result
    weatherCache[city] = {
      data: data.current,
      expires: Date.now() + WEATHER_CACHE_DURATION
    };
    
    return calculateWeatherImpact(data.current);
  } catch (error) {
    console.error(`[Weather] Error fetching for ${city}:`, error);
    return 0;
  }
}

// Calculate weather impact from weather data
function calculateWeatherImpact(weather: any): number {
  let impact = 0;
  
  // Condition impact
  const condition = weather.condition?.text?.toLowerCase() || '';
  if (condition.includes('clear') || condition.includes('sunny')) {
    impact += 10;
  } else if (condition.includes('cloud')) {
    impact += 5;
  } else if (condition.includes('rain') || condition.includes('drizzle')) {
    impact -= 15;
  } else if (condition.includes('storm')) {
    impact -= 20;
  } else if (condition.includes('snow')) {
    impact -= 10;
  }
  
  // Temperature impact (optimal: 15-25°C)
  const temp = weather.temp_c || 20;
  if (temp < 10) {
    impact -= 5;
  } else if (temp > 30) {
    impact -= 5;
  } else if (temp >= 15 && temp <= 25) {
    impact += 5;
  }
  
  // Wind impact
  const wind = weather.wind_kph || 0;
  if (wind > 30) {
    impact -= 5;
  }
  
  return Math.max(-20, Math.min(12, impact));
}

// Calculate vibe score for a single venue
async function calculateVibeScore(venue: any): Promise<any> {
  try {
    // 1. Base Score (20-50)
    const districtBonus = DISTRICT_BONUSES[venue.district] || 3;
    const venueTypeBonus = VENUE_TYPE_BONUSES[venue.type] || 5;
    const baseScore = 20 + districtBonus + venueTypeBonus;
    
    // 2. Venue Quality (0-30)
    const ratingPoints = venue.rating ? (venue.rating / 5) * 20 : 10; // Default to 10 if no rating
    const pricePoints = venue.price_level ? venue.price_level * 2.5 : 5; // Default to 5
    const venueQuality = ratingPoints + pricePoints;
    
    // 3. Venue Density (0-12) - Simplified, no DB query
    const venueDensity = 6; // Average density
    
    // 4. Day of Week Boost (0-20)
    const dayOfWeekBoost = getDayOfWeekBoost(venue.type);
    
    // 5. Time Boost (0-15)
    const timeBoost = getTimeBoost(venue.type);
    
    // 6. Weather (-20 to +12) - Fetch from API
    const weatherAdjustment = await getWeatherAdjustment(venue.city || venue.district);
    
    // 7. In-App Engagement (0-25)
    const inAppEngagement = await calculateInAppEngagement(venue.id);
    
    // 8. Gemini AI (-15 to +15) - Simplified, no API call
    const geminiAdjustment = 0; // Neutral if no API key
    
    // Calculate final score
    let finalScore = baseScore + venueQuality + venueDensity + dayOfWeekBoost + 
                     timeBoost + weatherAdjustment + inAppEngagement + geminiAdjustment;
    
    // Clamp to 0-100
    finalScore = Math.max(0, Math.min(100, finalScore));
    
    // Determine confidence label
    let confidence = 'DEAD';
    if (finalScore >= 80) confidence = 'HOT';
    else if (finalScore >= 60) confidence = 'POPPING';
    else if (finalScore >= 40) confidence = 'WARMING';
    
    // Determine trend (simplified)
    const trend = finalScore > 60 ? 'RISING' : finalScore > 40 ? 'STABLE' : 'FALLING';
    
    // Generate simple AI narrative
    const aiNarrative = `${venue.name} is currently ${confidence.toLowerCase()} with a vibe score of ${finalScore.toFixed(1)}. ` +
      `Located in ${venue.district}, this ${venue.type.toLowerCase().replace('_', ' ')} is ${trend.toLowerCase()} in popularity. ` +
      `${inAppEngagement > 15 ? 'Highly recommended by the community!' : inAppEngagement > 5 ? 'Popular among locals.' : 'A hidden gem waiting to be discovered.'}`;
    
    // Update venue
    const { error } = await supabase
      .from('venues')
      .update({
        vibe_score: finalScore,
        vibe_confidence: confidence,
        vibe_trend: trend,
        ai_narrative: aiNarrative,
        updated_at: new Date().toISOString()
      })
      .eq('id', venue.id);
    
    if (error) {
      console.error(`[Vibe] Error updating venue ${venue.name}:`, error);
      return null;
    }
    
    return {
      venue_id: venue.id,
      name: venue.name,
      score: finalScore,
      confidence,
      components: {
        baseScore,
        venueQuality,
        venueDensity,
        dayOfWeekBoost,
        timeBoost,
        weatherAdjustment,
        inAppEngagement,
        geminiAdjustment
      }
    };
  } catch (error) {
    console.error(`[Vibe] Error processing venue ${venue.name}:`, error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    console.log('[Vibe] Starting vibe score calculation...');
    const startTime = Date.now();
    
    // Fetch all venues
    const { data: venues, error } = await supabase
      .from('venues')
      .select('id, name, type, district, rating, price_level, latitude, longitude')
      .limit(BATCH_SIZE); // Only process BATCH_SIZE venues per request
    
    if (error) {
      console.error('[Vibe] Error fetching venues:', error);
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
    
    console.log(`[Vibe] Processing ${venues.length} venues...`);
    
    // Process venues in parallel (max 5 at a time to avoid overwhelming DB)
    const results = [];
    for (let i = 0; i < venues.length; i += 5) {
      const batch = venues.slice(i, i + 5);
      const batchResults = await Promise.all(batch.map(calculateVibeScore));
      results.push(...batchResults.filter(r => r !== null));
    }
    
    const duration = Date.now() - startTime;
    console.log(`[Vibe] Completed in ${duration}ms. Processed ${results.length}/${venues.length} venues`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        total_venues: venues.length,
        duration_ms: duration,
        batch_size: BATCH_SIZE,
        message: `Processed ${results.length} venues. Run again to process more.`
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
    
  } catch (error) {
    console.error('[Vibe] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message,
        stack: error.stack 
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

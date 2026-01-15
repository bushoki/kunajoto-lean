import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BATCH_SIZE = 20; // Process 20 venues per request

// Day of week boost
function getDayOfWeekBoost(dayOfWeek: number, venueType: string): number {
  if (venueType === 'NIGHT_CLUB' || venueType === 'BAR' || venueType === 'LOUNGE') {
    if (dayOfWeek === 5 || dayOfWeek === 6) return 20; // Friday/Saturday
    if (dayOfWeek === 4) return 15; // Thursday
    if (dayOfWeek === 0) return 10; // Sunday
    return 5; // Weekdays
  }
  
  if (venueType === 'RESTAURANT' || venueType === 'CAFE') {
    if (dayOfWeek === 0 || dayOfWeek === 6) return 12; // Weekend
    return 8; // Weekday
  }
  
  return 0;
}

// Generate 7-day forecast for a venue
async function generateForecast(venue: any): Promise<any[]> {
  const forecasts = [];
  const today = new Date();
  
  // Base score from current vibe score
  const baseScore = venue.vibe_score || 50;
  
  for (let i = 0; i < 7; i++) {
    const forecastDate = new Date(today);
    forecastDate.setDate(today.getDate() + i);
    const dayOfWeek = forecastDate.getDay();
    
    // Calculate predicted score
    const dayBoost = getDayOfWeekBoost(dayOfWeek, venue.type);
    
    // Add some variation based on day
    const historicalPattern = Math.sin(dayOfWeek) * 5; // -5 to +5 variation
    
    // Rating bonus
    const ratingBonus = venue.rating ? (venue.rating - 3) * 3 : 0; // -9 to +6
    
    let predictedScore = baseScore + dayBoost + historicalPattern + ratingBonus;
    
    // Clamp to 0-100
    predictedScore = Math.max(0, Math.min(100, predictedScore));
    
    // Determine confidence
    let confidence = 'DEAD';
    if (predictedScore >= 80) confidence = 'HOT';
    else if (predictedScore >= 60) confidence = 'POPPING';
    else if (predictedScore >= 40) confidence = 'WARMING';
    
    forecasts.push({
      venue_id: venue.id,
      forecast_date: forecastDate.toISOString().split('T')[0],
      day_of_week: dayOfWeek,
      predicted_score: predictedScore,
      confidence: confidence,
      factors: {
        base_score: baseScore,
        day_of_week_boost: dayBoost,
        historical_pattern: historicalPattern,
        rating_bonus: ratingBonus
      }
    });
  }
  
  return forecasts;
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
    console.log('[Forecast] Starting forecast generation...');
    const startTime = Date.now();
    
    // Fetch venues
    const { data: venues, error } = await supabase
      .from('venues')
      .select('id, name, type, vibe_score, rating')
      .limit(BATCH_SIZE);
    
    if (error) {
      console.error('[Forecast] Error fetching venues:', error);
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
    
    console.log(`[Forecast] Generating forecasts for ${venues.length} venues...`);
    
    // Delete old forecasts for these venues
    const venueIds = venues.map(v => v.id);
    await supabase
      .from('vibe_forecasts')
      .delete()
      .in('venue_id', venueIds);
    
    // Generate and insert forecasts
    let totalForecasts = 0;
    for (const venue of venues) {
      const forecasts = await generateForecast(venue);
      
      const { error: insertError } = await supabase
        .from('vibe_forecasts')
        .insert(forecasts);
      
      if (insertError) {
        console.error(`[Forecast] Error inserting forecasts for ${venue.name}:`, insertError);
      } else {
        totalForecasts += forecasts.length;
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[Forecast] Completed in ${duration}ms. Generated ${totalForecasts} forecasts`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        venues_processed: venues.length,
        forecasts_generated: totalForecasts,
        duration_ms: duration,
        batch_size: BATCH_SIZE,
        message: `Generated ${totalForecasts} forecasts for ${venues.length} venues. Run again to process more.`
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
    
  } catch (error) {
    console.error('[Forecast] Fatal error:', error);
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

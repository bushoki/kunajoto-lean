import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
    console.log('[CityVibe] Starting city vibe aggregation...');
    const startTime = Date.now();
    
    // Get all venues with their scores
    const { data: venues, error } = await supabase
      .from('venues')
      .select('city, district, vibe_score, vibe_confidence, vibe_trend');
    
    if (error) {
      console.error('[CityVibe] Error fetching venues:', error);
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
    
    console.log(`[CityVibe] Processing ${venues.length} venues...`);
    
    // Group by city
    const cityData: Record<string, any> = {};
    
    for (const venue of venues) {
      const city = venue.city || 'Unknown';
      
      if (!cityData[city]) {
        cityData[city] = {
          totalVenues: 0,
          totalScore: 0,
          hot: 0,
          popping: 0,
          warming: 0,
          dead: 0,
          districts: {} as Record<string, number>
        };
      }
      
      cityData[city].totalVenues++;
      cityData[city].totalScore += venue.vibe_score || 0;
      
      // Count by confidence
      if (venue.vibe_confidence === 'HOT') cityData[city].hot++;
      else if (venue.vibe_confidence === 'POPPING') cityData[city].popping++;
      else if (venue.vibe_confidence === 'WARMING') cityData[city].warming++;
      else cityData[city].dead++;
      
      // Track districts
      const district = venue.district || 'Unknown';
      cityData[city].districts[district] = (cityData[city].districts[district] || 0) + 1;
    }
    
    // Calculate city scores and upsert
    const results = [];
    for (const [city, data] of Object.entries(cityData)) {
      const overallScore = data.totalScore / data.totalVenues;
      
      // Determine confidence
      let confidence = 'DEAD';
      if (overallScore >= 80) confidence = 'HOT';
      else if (overallScore >= 60) confidence = 'POPPING';
      else if (overallScore >= 40) confidence = 'WARMING';
      
      // Determine trend (simplified)
      const hotRatio = data.hot / data.totalVenues;
      let trend = 'STABLE';
      if (hotRatio > 0.3) trend = 'RISING';
      else if (hotRatio < 0.1) trend = 'FALLING';
      
      // Get top 3 districts
      const topDistricts = Object.entries(data.districts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([district, count]) => ({ district, venues: count }));
      
      const cityScore = {
        city,
        overall_score: overallScore,
        confidence,
        trend,
        total_venues: data.totalVenues,
        hot_venues: data.hot,
        popping_venues: data.popping,
        warming_venues: data.warming,
        dead_venues: data.dead,
        top_districts: topDistricts,
        updated_at: new Date().toISOString()
      };
      
      const { error: upsertError } = await supabase
        .from('city_vibe_scores')
        .upsert(cityScore, { onConflict: 'city' });
      
      if (upsertError) {
        console.error(`[CityVibe] Error upserting ${city}:`, upsertError);
      } else {
        results.push(cityScore);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[CityVibe] Completed in ${duration}ms. Processed ${results.length} cities`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        cities_processed: results.length,
        total_venues: venues.length,
        duration_ms: duration,
        results
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
    
  } catch (error) {
    console.error('[CityVibe] Fatal error:', error);
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function generateNarrativeWithGemini(venue: any): Promise<string> {
  if (!GEMINI_API_KEY) {
    console.log('[Gemini] API key not found, using fallback');
    return generateFallbackNarrative(venue);
  }

  try {
    const now = new Date();
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
    const hour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    const isPeakHours = hour >= 22 || hour <= 3;

    const prompt = `You are a nightlife expert providing real-time vibe analysis. Generate a brief, engaging 2-3 sentence narrative about this venue RIGHT NOW (${dayOfWeek} at ${hour}:00).

Venue: ${venue.name}
Type: ${venue.type}
District: ${venue.district}
Current Vibe Score: ${venue.vibe_score}/100 (${venue.vibe_confidence})
Price Level: ${'$'.repeat(venue.price_level || 2)}

Context:
- Current time: ${dayOfWeek} ${hour}:00
- Weekend: ${isWeekend ? 'Yes' : 'No'}
- Peak hours (10pm-3am): ${isPeakHours ? 'Yes' : 'No'}

Write a dynamic, present-tense narrative that:
1. Describes what's happening RIGHT NOW at this venue
2. Mentions the current energy level and crowd vibe
3. Gives a specific recommendation based on the current time/day

Keep it under 50 words, casual and exciting tone.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 150,
        }
      })
    });

    if (!response.ok) {
      console.error('[Gemini] API error:', response.status, await response.text());
      return generateFallbackNarrative(venue);
    }

    const data = await response.json();
    const narrative = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (narrative) {
      console.log(`[Gemini] Generated narrative for ${venue.name}`);
      return narrative.trim();
    } else {
      console.error('[Gemini] No narrative in response');
      return generateFallbackNarrative(venue);
    }

  } catch (error) {
    console.error('[Gemini] Error:', error);
    return generateFallbackNarrative(venue);
  }
}

function generateFallbackNarrative(venue: any): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isPeakHours = hour >= 22 || hour <= 3;

  const confidence = venue.vibe_confidence || 'WARMING';
  
  if (venue.type === 'NIGHT_CLUB' || venue.type === 'BAR') {
    if (isWeekend && isPeakHours) {
      if (confidence === 'HOT') {
        return `🔥 ${venue.name} is absolutely PACKED right now! The dance floor is electric and the energy is off the charts. This is THE place to be tonight - get here ASAP!`;
      } else if (confidence === 'POPPING') {
        return `🎉 Great vibes at ${venue.name} tonight! The crowd is building up and the DJ is dropping fire. Perfect time to grab your crew and head over!`;
      } else {
        return `🌟 ${venue.name} is warming up nicely. The night is young and the vibe is chill - great spot to start your evening before things get wild!`;
      }
    } else if (hour >= 18 && hour < 22) {
      return `🍸 Early evening at ${venue.name} - perfect for happy hour drinks and good conversations. The energy will pick up as the night goes on!`;
    } else if (hour >= 6 && hour < 18) {
      return `💤 ${venue.name} is currently closed. Check back after ${venue.type === 'NIGHT_CLUB' ? '10pm' : '6pm'} when the party starts!`;
    } else {
      return `🌙 Late night vibes at ${venue.name}. ${confidence === 'HOT' ? 'Still going strong!' : 'Winding down but still fun!'}`;
    }
  } else if (venue.type === 'RESTAURANT' || venue.type === 'CAFE') {
    if ((hour >= 12 && hour <= 14) || (hour >= 18 && hour <= 21)) {
      return `🍽️ ${venue.name} is buzzing right now! ${isWeekend ? 'Weekend brunch/dinner crowd' : 'Meal time rush'} - expect a lively atmosphere and great food!`;
    } else {
      return `☕ ${venue.name} offers a relaxed vibe perfect for ${hour < 12 ? 'morning coffee' : 'a casual hangout'}. Great spot to unwind!`;
    }
  } else {
    return `✨ ${venue.name} in ${venue.district} is ${confidence === 'HOT' ? 'the hottest spot' : 'a great choice'} right now. ${venue.vibe_score >= 70 ? 'Highly recommended!' : 'Worth checking out!'}`;
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
    const { venue_id, batch_size } = await req.json();
    
    console.log('[AIGen] Starting AI narrative generation...');
    const startTime = Date.now();
    
    let venues;
    
    if (venue_id) {
      // Single venue
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('id', venue_id)
        .single();
      
      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Venue not found' }),
          { 
            status: 404,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }
      venues = [data];
    } else {
      // Batch processing
      const limit = batch_size || 10;
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .is('ai_narrative', null)
        .limit(limit);
      
      if (error) {
        console.error('[AIGen] Error fetching venues:', error);
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
      venues = data || [];
    }
    
    console.log(`[AIGen] Processing ${venues.length} venues...`);
    
    let generated = 0;
    const results = [];
    
    for (const venue of venues) {
      const narrative = await generateNarrativeWithGemini(venue);
      
      const { error: updateError } = await supabase
        .from('venues')
        .update({ ai_narrative: narrative })
        .eq('id', venue.id);
      
      if (updateError) {
        console.error(`[AIGen] Error updating ${venue.name}:`, updateError);
      } else {
        generated++;
        results.push({
          id: venue.id,
          name: venue.name,
          narrative: narrative.substring(0, 100) + '...'
        });
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const duration = Date.now() - startTime;
    console.log(`[AIGen] Completed in ${duration}ms. Generated ${generated} narratives`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        generated_count: generated,
        total_venues: venues.length,
        duration_ms: duration,
        using_gemini: !!GEMINI_API_KEY,
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
    console.error('[AIGen] Fatal error:', error);
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

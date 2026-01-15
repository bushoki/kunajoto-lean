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
    const { venue_id } = await req.json();
    
    if (!venue_id) {
      return new Response(
        JSON.stringify({ error: 'venue_id is required' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    console.log(`[ProcessFeedback] Processing feedback for venue: ${venue_id}`);
    
    // Get current venue data
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('vibe_score')
      .eq('id', venue_id)
      .single();
    
    if (venueError || !venue) {
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
    
    let feedbackScore = 0;
    let totalWeight = 0;
    
    // 1. Reviews (weight: 30)
    const { data: reviews } = await supabase
      .from('venue_reviews')
      .select('rating, created_at')
      .eq('venue_id', venue_id);
    
    if (reviews && reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      feedbackScore += (avgRating / 5) * 100 * 30; // Convert to 0-100 scale
      totalWeight += 30;
      console.log(`[ProcessFeedback] Reviews: ${reviews.length} reviews, avg ${avgRating.toFixed(2)}`);
    }
    
    // 2. Check-ins (weight: 25)
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const { data: checkIns } = await supabase
      .from('venue_check_ins')
      .select('created_at, party_size')
      .eq('venue_id', venue_id)
      .gte('created_at', last7Days.toISOString());
    
    if (checkIns && checkIns.length > 0) {
      // More check-ins = higher score
      const checkInScore = Math.min(checkIns.length * 5, 100);
      feedbackScore += checkInScore * 25;
      totalWeight += 25;
      console.log(`[ProcessFeedback] Check-ins: ${checkIns.length} in last 7 days`);
    }
    
    // 3. Crowd Reports (weight: 20)
    const { data: crowdReports } = await supabase
      .from('crowd_reports')
      .select('crowd_level, energy_level, created_at')
      .eq('venue_id', venue_id)
      .gte('created_at', last7Days.toISOString());
    
    if (crowdReports && crowdReports.length > 0) {
      const crowdLevelMap: Record<string, number> = {
        'EMPTY': 20,
        'LIGHT': 40,
        'MODERATE': 60,
        'BUSY': 80,
        'PACKED': 100
      };
      
      const avgCrowdLevel = crowdReports.reduce((sum, r) => {
        return sum + (crowdLevelMap[r.crowd_level] || 50);
      }, 0) / crowdReports.length;
      
      feedbackScore += avgCrowdLevel * 20;
      totalWeight += 20;
      console.log(`[ProcessFeedback] Crowd reports: ${crowdReports.length} reports`);
    }
    
    // 4. Photos (weight: 15)
    const { data: photos } = await supabase
      .from('venue_photos')
      .select('created_at, likes_count')
      .eq('venue_id', venue_id)
      .eq('is_approved', true);
    
    if (photos && photos.length > 0) {
      const totalLikes = photos.reduce((sum, p) => sum + (p.likes_count || 0), 0);
      const photoScore = Math.min((photos.length * 10) + (totalLikes * 2), 100);
      feedbackScore += photoScore * 15;
      totalWeight += 15;
      console.log(`[ProcessFeedback] Photos: ${photos.length} photos, ${totalLikes} likes`);
    }
    
    // 5. Favorites (weight: 10)
    const { data: favorites } = await supabase
      .from('user_favorites')
      .select('created_at')
      .eq('venue_id', venue_id);
    
    if (favorites && favorites.length > 0) {
      const favoriteScore = Math.min(favorites.length * 5, 100);
      feedbackScore += favoriteScore * 10;
      totalWeight += 10;
      console.log(`[ProcessFeedback] Favorites: ${favorites.length} users`);
    }
    
    // Calculate final adjustment
    let adjustment = 0;
    if (totalWeight > 0) {
      const normalizedFeedbackScore = feedbackScore / totalWeight;
      adjustment = (normalizedFeedbackScore - venue.vibe_score) * 0.3; // 30% influence
    }
    
    const newScore = Math.max(0, Math.min(100, venue.vibe_score + adjustment));
    
    // Determine confidence
    let confidence = 'DEAD';
    if (newScore >= 80) confidence = 'HOT';
    else if (newScore >= 60) confidence = 'POPPING';
    else if (newScore >= 40) confidence = 'WARMING';
    
    // Update venue
    const { error: updateError } = await supabase
      .from('venues')
      .update({
        vibe_score: newScore,
        vibe_confidence: confidence,
        updated_at: new Date().toISOString()
      })
      .eq('id', venue_id);
    
    if (updateError) {
      console.error('[ProcessFeedback] Error updating venue:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update venue', details: updateError.message }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
    
    console.log(`[ProcessFeedback] Updated ${venue_id}: ${venue.vibe_score.toFixed(1)} → ${newScore.toFixed(1)} (${confidence})`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        venue_id,
        old_score: venue.vibe_score,
        new_score: newScore,
        adjustment,
        confidence,
        feedback_summary: {
          reviews: reviews?.length || 0,
          check_ins: checkIns?.length || 0,
          crowd_reports: crowdReports?.length || 0,
          photos: photos?.length || 0,
          favorites: favorites?.length || 0
        }
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
    
  } catch (error) {
    console.error('[ProcessFeedback] Fatal error:', error);
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

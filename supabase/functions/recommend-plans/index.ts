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
    const { user_id } = await req.json();
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    console.log(`[Recommend] Generating recommendations for user: ${user_id}`);
    
    // Get user preferences
    const { data: userPrefs, error: prefsError } = await supabase
      .from('user_profiles')
      .select('preferences')
      .eq('id', user_id)
      .single();
    
    if (prefsError) {
      console.error('[Recommend] Error fetching user preferences:', prefsError);
    }
    
    const preferences = userPrefs?.preferences || {};
    console.log('[Recommend] User preferences:', preferences);
    
    // Get user's existing plans to avoid duplicates
    const { data: existingPlans } = await supabase
      .from('user_plans')
      .select('title, description')
      .eq('user_id', user_id);
    
    // Get all active templates
    const { data: templates, error: templatesError } = await supabase
      .from('plan_templates')
      .select('*')
      .eq('is_active', true)
      .order('rating', { ascending: false });
    
    if (templatesError) {
      console.error('[Recommend] Error fetching templates:', templatesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch templates', details: templatesError.message }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
    
    // Score templates based on user preferences
    const scoredTemplates = templates.map(template => {
      let score = 0;
      
      // Match vibe preference
      if (preferences.vibe_preference && template.vibe_preference === preferences.vibe_preference) {
        score += 30;
      }
      
      // Match group size
      if (preferences.typical_group_size) {
        const sizeDiff = Math.abs(template.target_group_size - preferences.typical_group_size);
        score += Math.max(0, 20 - sizeDiff * 5);
      }
      
      // Match budget
      if (preferences.budget_level && template.estimated_budget === preferences.budget_level) {
        score += 20;
      }
      
      // Match tags with preferences
      if (preferences.interests && template.tags) {
        const matchingTags = template.tags.filter((tag: string) => 
          preferences.interests.some((interest: string) => 
            interest.toLowerCase().includes(tag.toLowerCase()) || 
            tag.toLowerCase().includes(interest.toLowerCase())
          )
        );
        score += matchingTags.length * 10;
      }
      
      // Boost popular templates
      score += Math.min(template.usage_count * 0.1, 10);
      score += template.rating * 5;
      
      // Penalize if similar plan exists
      if (existingPlans) {
        const hasSimilar = existingPlans.some(plan => 
          plan.title.toLowerCase().includes(template.title.toLowerCase()) ||
          template.title.toLowerCase().includes(plan.title.toLowerCase())
        );
        if (hasSimilar) score -= 20;
      }
      
      return {
        ...template,
        recommendation_score: score
      };
    });
    
    // Sort by score and return top 5
    const recommendations = scoredTemplates
      .sort((a, b) => b.recommendation_score - a.recommendation_score)
      .slice(0, 5);
    
    console.log(`[Recommend] Generated ${recommendations.length} recommendations`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        recommendations,
        user_preferences: preferences
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
    
  } catch (error) {
    console.error('[Recommend] Fatal error:', error);
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Generate random share code
function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
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

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'create';
    
    // CREATE SHARE LINK
    if (action === 'create') {
      const { plan_id, user_id, access_level, expires_in_hours } = await req.json();
      
      if (!plan_id || !user_id) {
        return new Response(
          JSON.stringify({ error: 'plan_id and user_id are required' }),
          { 
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }
      
      // Verify user owns the plan
      const { data: plan, error: planError } = await supabase
        .from('user_plans')
        .select('*')
        .eq('id', plan_id)
        .eq('user_id', user_id)
        .single();
      
      if (planError || !plan) {
        return new Response(
          JSON.stringify({ error: 'Plan not found or access denied' }),
          { 
            status: 404,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }
      
      // Generate unique share code
      let shareCode = generateShareCode();
      let attempts = 0;
      while (attempts < 10) {
        const { data: existing } = await supabase
          .from('plan_shares')
          .select('id')
          .eq('share_code', shareCode)
          .single();
        
        if (!existing) break;
        shareCode = generateShareCode();
        attempts++;
      }
      
      // Calculate expiration
      let expiresAt = null;
      if (expires_in_hours) {
        expiresAt = new Date(Date.now() + expires_in_hours * 60 * 60 * 1000).toISOString();
      }
      
      // Create share record
      const { data: share, error: shareError } = await supabase
        .from('plan_shares')
        .insert({
          plan_id,
          shared_by: user_id,
          share_code: shareCode,
          access_level: access_level || 'view',
          expires_at: expiresAt
        })
        .select()
        .single();
      
      if (shareError) {
        console.error('[Share] Error creating share:', shareError);
        return new Response(
          JSON.stringify({ error: 'Failed to create share link', details: shareError.message }),
          { 
            status: 500,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }
      
      const shareUrl = `${SUPABASE_URL}/plan/${shareCode}`;
      
      console.log(`[Share] Created share link: ${shareCode} for plan ${plan_id}`);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          share_code: shareCode,
          share_url: shareUrl,
          expires_at: expiresAt,
          plan_title: plan.title
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    }
    
    // GET SHARED PLAN
    else if (action === 'get') {
      const shareCode = url.searchParams.get('code');
      
      if (!shareCode) {
        return new Response(
          JSON.stringify({ error: 'share_code is required' }),
          { 
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }
      
      // Get share record
      const { data: share, error: shareError } = await supabase
        .from('plan_shares')
        .select('*')
        .eq('share_code', shareCode)
        .single();
      
      if (shareError || !share) {
        return new Response(
          JSON.stringify({ error: 'Invalid share code' }),
          { 
            status: 404,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }
      
      // Check expiration
      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'Share link has expired' }),
          { 
            status: 410,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }
      
      // Get plan details
      const { data: plan, error: planError } = await supabase
        .from('user_plans')
        .select('*')
        .eq('id', share.plan_id)
        .single();
      
      if (planError || !plan) {
        return new Response(
          JSON.stringify({ error: 'Plan not found' }),
          { 
            status: 404,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }
      
      // Increment view count
      await supabase
        .from('plan_shares')
        .update({ view_count: share.view_count + 1 })
        .eq('id', share.id);
      
      console.log(`[Share] Retrieved shared plan: ${shareCode}`);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          plan,
          access_level: share.access_level,
          shared_by: share.shared_by
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    }
    
    else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use ?action=create or ?action=get' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
    
  } catch (error) {
    console.error('[Share] Fatal error:', error);
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

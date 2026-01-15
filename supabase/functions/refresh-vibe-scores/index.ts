// Supabase Edge Function to Refresh Materialized View
// Trigger: Cron (every 5 minutes) or Manual

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('[refresh-vibe-scores] Starting materialized view refresh...')
    
    const startTime = Date.now()
    
    // Refresh the materialized view
    const { error } = await supabase.rpc('refresh_vibe_scores_view')
    
    if (error) {
      console.error('[refresh-vibe-scores] Error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const elapsed = Date.now() - startTime
    console.log(`[refresh-vibe-scores] Completed in ${elapsed}ms`)
    
    return new Response(JSON.stringify({
      success: true,
      elapsed_ms: elapsed,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (err) {
    console.error('[refresh-vibe-scores] Exception:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

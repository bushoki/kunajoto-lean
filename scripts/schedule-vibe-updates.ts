/**
 * Automated Vibe Score Update Scheduler
 * 
 * This script sets up automated vibe score recalculation with variable frequency
 * based on time of day to optimize API costs while maintaining accuracy.
 * 
 * Schedule:
 * - 6am-6pm: Every 4 hours (low activity period)
 * - 6pm-10pm: Every 2 hours (building up to peak)
 * - 10pm-2am: Every 30 minutes (PEAK nightlife hours)
 * - 2am-6am: Every 2 hours (winding down)
 * 
 * Total daily API calls: ~20-25 (vs 48 if every hour, or 288 if every 30min)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface ScheduleConfig {
  startHour: number;
  endHour: number;
  intervalMinutes: number;
  description: string;
}

const SCHEDULE: ScheduleConfig[] = [
  { startHour: 6, endHour: 18, intervalMinutes: 240, description: 'Daytime (low activity)' },
  { startHour: 18, endHour: 22, intervalMinutes: 120, description: 'Evening (building up)' },
  { startHour: 22, endHour: 26, intervalMinutes: 30, description: 'Peak nightlife' }, // 26 = 2am next day
  { startHour: 2, endHour: 6, intervalMinutes: 120, description: 'Late night (winding down)' }
];

async function triggerVibeScoreCalculation(): Promise<boolean> {
  try {
    console.log('[Scheduler] Triggering vibe score calculation...');
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('[Scheduler] No active session, cannot trigger calculation');
      return false;
    }
    
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/calculate-vibe-scores`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      console.error('[Scheduler] Edge Function error:', error);
      return false;
    }
    
    const result = await response.json();
    console.log(`[Scheduler] ✅ Vibe scores updated successfully! Processed ${result.processed} venues in ${result.duration_ms}ms`);
    
    // Log to database for monitoring
    await supabase
      .from('vibe_score_updates')
      .insert({
        triggered_at: new Date().toISOString(),
        venues_processed: result.processed,
        duration_ms: result.duration_ms,
        status: 'success'
      });
    
    return true;
  } catch (error) {
    console.error('[Scheduler] Fatal error:', error);
    
    // Log error to database
    await supabase
      .from('vibe_score_updates')
      .insert({
        triggered_at: new Date().toISOString(),
        status: 'error',
        error_message: error.message
      });
    
    return false;
  }
}

function getCurrentSchedule(): ScheduleConfig | null {
  const now = new Date();
  const hour = now.getHours();
  
  for (const config of SCHEDULE) {
    if (config.startHour <= config.endHour) {
      // Normal range (e.g., 6-18)
      if (hour >= config.startHour && hour < config.endHour) {
        return config;
      }
    } else {
      // Overnight range (e.g., 22-2 means 22-24 and 0-2)
      if (hour >= config.startHour || hour < config.endHour) {
        return config;
      }
    }
  }
  
  return null;
}

function getNextUpdateTime(): Date {
  const schedule = getCurrentSchedule();
  if (!schedule) {
    console.error('[Scheduler] No schedule found for current hour');
    return new Date(Date.now() + 60 * 60 * 1000); // Default to 1 hour
  }
  
  const next = new Date(Date.now() + schedule.intervalMinutes * 60 * 1000);
  return next;
}

async function runScheduler() {
  console.log('[Scheduler] ========== Vibe Score Scheduler Started ==========');
  console.log('[Scheduler] Schedule configuration:');
  SCHEDULE.forEach(config => {
    console.log(`  ${config.startHour}:00-${config.endHour}:00 → Every ${config.intervalMinutes}min (${config.description})`);
  });
  
  // Immediate first run
  console.log('[Scheduler] Running initial calculation...');
  await triggerVibeScoreCalculation();
  
  // Schedule subsequent runs
  setInterval(async () => {
    const schedule = getCurrentSchedule();
    if (schedule) {
      console.log(`[Scheduler] Current period: ${schedule.description} (every ${schedule.intervalMinutes}min)`);
      await triggerVibeScoreCalculation();
    }
  }, 60 * 1000); // Check every minute to see if we should run
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runScheduler();
}

export { triggerVibeScoreCalculation, getCurrentSchedule, getNextUpdateTime };

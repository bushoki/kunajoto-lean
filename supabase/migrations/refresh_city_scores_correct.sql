-- Simple script to refresh city vibe scores from realtime venue data
-- Run this manually or via cron to keep city scores in sync

-- Delete all existing city scores
TRUNCATE TABLE public.city_vibe_scores;

-- Insert fresh scores from materialized view
INSERT INTO public.city_vibe_scores (
  city, 
  overall_score, 
  confidence, 
  trend, 
  total_venues,
  hot_venues,
  popping_venues,
  warming_venues,
  dead_venues,
  updated_at
)
SELECT 
  city,
  ROUND(AVG(realtime_vibe_score)::numeric, 2) as overall_score,
  CASE 
    WHEN AVG(realtime_vibe_score) >= 90 THEN 'HOT'
    WHEN AVG(realtime_vibe_score) >= 70 THEN 'POPPING'
    WHEN AVG(realtime_vibe_score) >= 40 THEN 'WARMING'
    ELSE 'DEAD'
  END as confidence,
  CASE
    WHEN AVG(realtime_vibe_score) > 70 THEN 'RISING'
    WHEN AVG(realtime_vibe_score) < 40 THEN 'FALLING'
    ELSE 'STABLE'
  END as trend,
  COUNT(*) as total_venues,
  SUM(CASE WHEN realtime_vibe_score >= 90 THEN 1 ELSE 0 END) as hot_venues,
  SUM(CASE WHEN realtime_vibe_score >= 70 AND realtime_vibe_score < 90 THEN 1 ELSE 0 END) as popping_venues,
  SUM(CASE WHEN realtime_vibe_score >= 40 AND realtime_vibe_score < 70 THEN 1 ELSE 0 END) as warming_venues,
  SUM(CASE WHEN realtime_vibe_score < 40 THEN 1 ELSE 0 END) as dead_venues,
  NOW() as updated_at
FROM public.venues_with_realtime_vibe
WHERE city IS NOT NULL AND city != ''
GROUP BY city;

-- Show results for key cities
SELECT 
  city, 
  overall_score, 
  ROUND((overall_score/10)::numeric, 1) as display_score, 
  confidence, 
  trend, 
  total_venues,
  hot_venues,
  popping_venues
FROM public.city_vibe_scores
WHERE city IN ('Kinshasa', 'Nairobi', 'Johannesburg', 'Bali', 'Santorini')
ORDER BY overall_score DESC;

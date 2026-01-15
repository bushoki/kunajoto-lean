-- Vibe Score System Tables
-- Phase 2: Real vibe score calculation infrastructure

-- 1. Vibe Score Inputs (processed data for scoring)
CREATE TABLE IF NOT EXISTS public.vibe_score_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id TEXT NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  district TEXT NOT NULL,
  static_prior INTEGER DEFAULT 50,
  google_rating NUMERIC,
  google_user_ratings_total INTEGER,
  google_price_level INTEGER,
  google_is_open_now BOOLEAN,
  popular_times_current INTEGER,
  popular_times_avg INTEGER,
  weather_temp NUMERIC,
  weather_condition TEXT,
  weather_precipitation_prob INTEGER,
  nearby_venue_count INTEGER,
  nearby_venue_avg_rating NUMERIC,
  data_freshness TIMESTAMPTZ DEFAULT NOW(),
  confidence_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venue_id)
);

CREATE INDEX IF NOT EXISTS idx_vibe_inputs_venue ON public.vibe_score_inputs(venue_id);

-- 2. Historical Vibe Data
CREATE TABLE IF NOT EXISTS public.historical_vibe_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id TEXT NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  vibe_score INTEGER NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  day_of_week INTEGER,
  hour_of_day INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historical_venue ON public.historical_vibe_data(venue_id);

-- 3. Vibe Forecasts
CREATE TABLE IF NOT EXISTS public.vibe_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id TEXT NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,
  forecast_hour INTEGER,
  predicted_score INTEGER NOT NULL,
  confidence INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venue_id, forecast_date, forecast_hour)
);

CREATE INDEX IF NOT EXISTS idx_forecast_venue ON public.vibe_forecasts(venue_id);

-- 4. Trigger to store historical data
CREATE OR REPLACE FUNCTION store_historical_vibe_data()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.vibe_score IS DISTINCT FROM OLD.vibe_score THEN
    INSERT INTO public.historical_vibe_data (venue_id, vibe_score, recorded_at, day_of_week, hour_of_day)
    VALUES (NEW.id, NEW.vibe_score, NOW(), EXTRACT(DOW FROM NOW())::INTEGER, EXTRACT(HOUR FROM NOW())::INTEGER);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_store_historical_vibe ON public.venues;
CREATE TRIGGER trigger_store_historical_vibe AFTER UPDATE ON public.venues FOR EACH ROW EXECUTE FUNCTION store_historical_vibe_data();

-- RLS policies
ALTER TABLE public.vibe_score_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historical_vibe_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibe_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vibe inputs" ON public.vibe_score_inputs FOR SELECT USING (true);
CREATE POLICY "Anyone can view historical data" ON public.historical_vibe_data FOR SELECT USING (true);
CREATE POLICY "Anyone can view forecasts" ON public.vibe_forecasts FOR SELECT USING (true);

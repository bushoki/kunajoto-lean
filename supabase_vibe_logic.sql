-- 1. Create a table for Vibe Forecasts (as per 4.C)
CREATE TABLE public.vibe_forecasts (
    venue_id text REFERENCES public.venues(id) NOT NULL,
    forecast_date date NOT NULL,
    vibe_score_forecast integer NOT NULL, -- 0-100 scale
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (venue_id, forecast_date)
);

-- Enable RLS for vibe_forecasts (Read-only for all)
ALTER TABLE public.vibe_forecasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to read vibe forecasts." ON public.vibe_forecasts FOR SELECT USING (true);

-- 2. Create a table for Vibe Score Inputs (as per 4.A.i)
-- This table will store the clean, linked data before Vibe Score calculation
CREATE TABLE public.vibe_score_inputs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    venue_id text REFERENCES public.venues(id) NOT NULL,
    source text NOT NULL, -- e.g., 'foursquare', 'eventbrite', 'checkin'
    data jsonb NOT NULL, -- The clean, linked data payload
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS for vibe_score_inputs (Admin only)
ALTER TABLE public.vibe_score_inputs ENABLE ROW LEVEL SECURITY;

-- 3. Create the Vibe Score Calculation Function (Simplified V1 Methodology)
-- This function will be called by a trigger or an Edge Function after new data is inserted into vibe_score_inputs
CREATE OR REPLACE FUNCTION public.calculate_vibe_score()
RETURNS trigger AS $$
DECLARE
    -- Deterministic Calculation (Base Score) - Simplified for V1
    base_score INTEGER;
    vibe_confidence TEXT;
    
    -- AI Interpretation & Confidence Scoring - Simplified for V1
    ai_adjustment INTEGER := 0; -- Placeholder for AI adjustment
    ai_summary TEXT := 'Vibe score calculated based on available data.';
    final_score INTEGER;
BEGIN
    -- For V1, we will use a simple average of all recent vibe_score_inputs for the venue
    SELECT 
        COALESCE(FLOOR(AVG((data->>'vibe_score')::numeric)), 75),
        CASE 
            WHEN COUNT(*) > 5 THEN 'High'
            WHEN COUNT(*) > 2 THEN 'Medium'
            ELSE 'Low'
        END
    INTO 
        base_score,
        vibe_confidence
    FROM 
        public.vibe_score_inputs
    WHERE 
        venue_id = NEW.venue_id
        AND created_at > NOW() - INTERVAL '24 hours'; -- Only consider last 24 hours of data

    -- Apply AI Adjustment (Placeholder for future Gemini integration)
    final_score := base_score + ai_adjustment;
    
    -- Ensure score is within 0-100 range
    IF final_score > 100 THEN
        final_score := 100;
    ELSIF final_score < 0 THEN
        final_score := 0;
    END IF;

    -- Update the venues table with the new Vibe Score
    UPDATE public.venues
    SET 
        vibe_score = final_score,
        vibe_confidence = vibe_confidence,
        vibe_trend = 'Stable', -- Placeholder for V1
        description = ai_summary -- Using description as a temporary field for AI summary
    WHERE 
        id = NEW.venue_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create a Trigger to run the Vibe Score calculation after new data is inserted
CREATE TRIGGER on_vibe_input_insert
AFTER INSERT ON public.vibe_score_inputs
FOR EACH ROW EXECUTE FUNCTION public.calculate_vibe_score();

-- 5. Create a placeholder function for the 7-Day Forecast (fn_generate_forecast)
CREATE OR REPLACE FUNCTION public.fn_generate_forecast()
RETURNS void AS $$
BEGIN
    -- Placeholder for the actual time-series model logic (Weighted Moving Average)
    -- For V1, we will just insert a static forecast for the next 7 days
    INSERT INTO public.vibe_forecasts (venue_id, forecast_date, vibe_score_forecast)
    SELECT 
        v.id,
        generate_series(current_date + interval '1 day', current_date + interval '7 days', '1 day')::date,
        FLOOR(RANDOM() * 30 + 60) -- Random score between 60 and 90
    FROM 
        public.venues v
    ON CONFLICT (venue_id, forecast_date) DO UPDATE SET vibe_score_forecast = EXCLUDED.vibe_score_forecast;
END;
$$ LANGUAGE plpgsql;

-- 6. Schedule the forecast generation to run daily (e.g., 3 AM UTC)
-- NOTE: Scheduling is typically done outside of the database (e.g., Supabase Scheduled Jobs or a cron job)
-- We will just execute the function once for setup.
SELECT public.fn_generate_forecast();

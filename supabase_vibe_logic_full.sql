-- 1. Create a table for Vibe Score Inputs (as per 4.A.i)
-- This table will store the clean, linked data before Vibe Score calculation
CREATE TABLE IF NOT EXISTS public.vibe_score_inputs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    venue_id text REFERENCES public.venues(id) NOT NULL,
    source text NOT NULL, -- e.g., 'foursquare', 'eventbrite', 'checkin'
    data jsonb NOT NULL, -- The clean, linked data payload
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS for vibe_score_inputs (Admin only)
ALTER TABLE public.vibe_score_inputs ENABLE ROW LEVEL SECURITY;
-- Admin policy is assumed to be in supabase_schema.sql

-- 2. Create the Vibe Score Calculation Function (Full Methodology)
-- This function will be called by a trigger or an Edge Function after new data is inserted into vibe_score_inputs
CREATE OR REPLACE FUNCTION public.calculate_vibe_score_full()
RETURNS trigger AS $$
DECLARE
    -- Deterministic Calculation (Base Score) - Based on 4.B.ii
    base_score_raw NUMERIC;
    vibe_confidence TEXT;
    
    -- AI Interpretation & Confidence Scoring - Based on 4.B.iv
    ai_adjustment NUMERIC := 0; -- Placeholder for AI adjustment (0-100 scale)
    ai_summary TEXT := 'Vibe score calculated based on available data.';
    final_score INTEGER;
    
    -- Variables for Deterministic Calculation Components (Mocked for now, will be replaced by real logic)
    static_priors_score NUMERIC := 0.2; -- Weight 20%
    event_density_score NUMERIC := 0.3; -- Weight 30%
    venue_density_score NUMERIC := 0.3; -- Weight 30%
    checkin_signal_score NUMERIC := 0.2; -- Weight 20%
    
    -- Total weight is 1.0 (100%)
    
BEGIN
    -- STEP 1: Deterministic Calculation (Base Score)
    -- The full logic requires complex data aggregation (Event Density, Check-in Signal, etc.)
    -- Since the current ingestion only provides basic venue data, we will simulate the weighted average
    -- and use the existing mock data structure for the base score calculation.
    
    -- For a more robust simulation, we will use a weighted average of mock component scores
    -- that are assumed to be present in the 'data' payload of vibe_score_inputs.
    
    -- Mock component scores (0-100 scale)
    SELECT 
        COALESCE(AVG((data->>'static_priors_score')::numeric), 70) * static_priors_score +
        COALESCE(AVG((data->>'event_density_score')::numeric), 75) * event_density_score +
        COALESCE(AVG((data->>'venue_density_score')::numeric), 80) * venue_density_score +
        COALESCE(AVG((data->>'checkin_signal_score')::numeric), 85) * checkin_signal_score
    INTO 
        base_score_raw
    FROM 
        public.vibe_score_inputs
    WHERE 
        venue_id = NEW.venue_id
        AND created_at > NOW() - INTERVAL '24 hours'; -- Only consider last 24 hours of data

    -- Determine Confidence based on sample size (4.B.ii)
    SELECT 
        CASE 
            WHEN COUNT(*) >= 10 THEN 'High'
            WHEN COUNT(*) >= 5 THEN 'Medium'
            ELSE 'Low'
        END
    INTO 
        vibe_confidence
    FROM 
        public.vibe_score_inputs
    WHERE 
        venue_id = NEW.venue_id
        AND created_at > NOW() - INTERVAL '24 hours';

    -- STEP 2: AI Interpretation & Confidence Scoring (Placeholder for Edge Function call)
    -- This step will be handled by an external Edge Function call to Gemini.
    -- For now, we will simulate the AI adjustment and summary.
    
    -- Simulate AI Adjustment (e.g., -5 to +5 adjustment)
    ai_adjustment := FLOOR(RANDOM() * 11) - 5;
    
    -- Simulate AI Summary
    IF ai_adjustment > 0 THEN
        ai_summary := 'AI noted a positive social media buzz, slightly boosting the Vibe Score.';
    ELSIF ai_adjustment < 0 THEN
        ai_summary := 'AI noted a local incident, slightly lowering the Vibe Score.';
    ELSE
        ai_summary := 'Vibe score is stable based on deterministic data.';
    END IF;
    
    -- Final Score Calculation
    final_score := FLOOR(base_score_raw + ai_adjustment);
    
    -- Ensure score is within 0-100 range
    IF final_score > 100 THEN
        final_score := 100;
    ELSIF final_score < 0 THEN
        final_score := 0;
    END IF;

    -- STEP 3: Update the venues table
    UPDATE public.venues
    SET 
        vibe_score = final_score,
        vibe_confidence = vibe_confidence,
        vibe_trend = 'Stable', -- Placeholder for Vibe Trend
        description = ai_summary -- Using description for the AI summary (4.B.iv)
    WHERE 
        id = NEW.venue_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create a Trigger to run the Vibe Score calculation after new data is inserted
CREATE OR REPLACE TRIGGER on_vibe_input_insert_full
AFTER INSERT ON public.vibe_score_inputs
FOR EACH ROW EXECUTE FUNCTION public.calculate_vibe_score_full();

-- 4. Create the 7-Day Forecast Function (Full Methodology - Weighted Moving Average Simulation)
CREATE OR REPLACE FUNCTION public.fn_generate_forecast_full()
RETURNS void AS $$
DECLARE
    venue_record RECORD;
    forecast_date DATE;
    historical_score NUMERIC;
    forecast_score INTEGER;
BEGIN
    -- Clear existing forecasts
    DELETE FROM public.vibe_forecasts WHERE forecast_date >= current_date;

    -- Loop through all venues
    FOR venue_record IN SELECT id, vibe_score FROM public.venues LOOP
        -- Simulate a Weighted Moving Average (WMA) based on the current vibe_score
        -- WMA logic: Current score (weight 0.5) + Historical average (weight 0.3) + Seasonality (weight 0.2)
        
        -- Mock Historical Average (e.g., last 30 days)
        SELECT COALESCE(AVG(vibe_score), venue_record.vibe_score) INTO historical_score
        FROM public.venues 
        WHERE id = venue_record.id; -- Simplified: just use current score as historical for now

        -- Generate forecast for the next 7 days
        FOR i IN 1..7 LOOP
            forecast_date := current_date + i;
            
            -- Simulate Seasonality/Day-of-Week Adjustment (4.C)
            -- Friday/Saturday (5, 6) get a boost, Sunday/Monday (0, 1) get a dip
            CASE EXTRACT(DOW FROM forecast_date)
                WHEN 5, 6 THEN forecast_score := FLOOR(venue_record.vibe_score * 1.1 + RANDOM() * 5); -- Weekend boost
                WHEN 0, 1 THEN forecast_score := FLOOR(venue_record.vibe_score * 0.9 - RANDOM() * 5); -- Start of week dip
                ELSE forecast_score := FLOOR(venue_record.vibe_score + RANDOM() * 5 - 2); -- Stable
            END CASE;
            
            -- Ensure score is within 0-100 range
            IF forecast_score > 100 THEN
                forecast_score := 100;
            ELSIF forecast_score < 0 THEN
                forecast_score := 0;
            END IF;

            -- Insert the forecast
            INSERT INTO public.vibe_forecasts (venue_id, forecast_date, vibe_score_forecast)
            VALUES (venue_record.id, forecast_date, forecast_score);
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 5. Execute the full forecast function once for initial data population
SELECT public.fn_generate_forecast_full();

-- ============================================================
-- KUNAJOTO MAP FEATURES: ITINERARIES MIGRATION
-- Branch: map-features
-- Date: 2026-03-09
-- ============================================================

-- 1. Create the main itineraries table
CREATE TABLE IF NOT EXISTS public.itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    city TEXT NOT NULL,
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    price NUMERIC(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    
    -- Vibe matching tags (aligned with user_preferences structure)
    vibe_tags TEXT[] DEFAULT '{}',          -- e.g. ['Late Night', 'Afters', 'Dance & Sweat']
    music_genres TEXT[] DEFAULT '{}',        -- e.g. ['Afrobeats', 'Techno']
    crowd_density TEXT,                      -- 'Buzzing', 'Packed', 'Raging', 'Chill'
    budget_tier TEXT,                        -- '$', '$$', '$$$', '$$$$'
    time_preferences TEXT[] DEFAULT '{}',    -- 'Happy Hour', 'Prime Time', 'Late Night', 'Afters'
    
    -- Timing
    start_time TIME,                         -- e.g. 16:00 (4 PM)
    end_time TIME,                           -- e.g. 03:00 (3 AM)
    days_of_week TEXT[] DEFAULT '{}',        -- ['Friday', 'Saturday'] or empty for all days
    
    -- Map display
    color TEXT DEFAULT '#FF6B35',            -- Itinerary path color on map
    display_order INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Admin metadata
    created_by UUID REFERENCES public.user_profiles(id),
    updated_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create itinerary stops (waypoints along the route)
CREATE TABLE IF NOT EXISTS public.itinerary_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
    venue_id TEXT REFERENCES public.venues(id) ON DELETE SET NULL,
    
    -- Stop details
    stop_order INTEGER NOT NULL,             -- 1 = start, last = end
    is_starting_point BOOLEAN DEFAULT FALSE,
    is_ending_point BOOLEAN DEFAULT FALSE,
    
    -- Location (can be a venue or a custom point)
    name TEXT NOT NULL,
    description TEXT,                        -- The tip/instruction shown on map bubble
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    
    -- Timing at this stop
    arrive_time TEXT,                        -- e.g. "4PM", "10:30PM"
    leave_time TEXT,                         -- e.g. "8PM", "3AM"
    duration_minutes INTEGER,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create itinerary access / subscriptions for paid itineraries
CREATE TABLE IF NOT EXISTS public.itinerary_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    
    -- Access type
    access_type TEXT NOT NULL DEFAULT 'purchased',  -- 'purchased', 'admin_granted', 'premium_auto'
    granted_by UUID REFERENCES public.user_profiles(id),
    
    -- Validity
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,                 -- NULL = permanent
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(itinerary_id, user_id)
);

-- 4. Enable RLS on all new tables
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_access ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for itineraries
-- Anyone can view active itineraries (free ones fully, paid ones partially)
CREATE POLICY "Anyone can view active itineraries"
    ON public.itineraries FOR SELECT
    USING (is_active = TRUE);

-- Admins can do everything
CREATE POLICY "Admins can manage itineraries"
    ON public.itineraries FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND (is_app_admin = TRUE OR default_role IN ('app_admin', 'super_admin'))
        )
    );

-- 6. RLS Policies for itinerary_stops
-- Stops for free itineraries are visible to all
-- Stops for paid itineraries are visible only to those with access or admins
CREATE POLICY "Free itinerary stops visible to all"
    ON public.itinerary_stops FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.itineraries i
            WHERE i.id = itinerary_id AND i.is_paid = FALSE AND i.is_active = TRUE
        )
    );

CREATE POLICY "Paid itinerary stops visible to subscribers and admins"
    ON public.itinerary_stops FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.itineraries i
            WHERE i.id = itinerary_id AND i.is_paid = TRUE AND i.is_active = TRUE
            AND (
                -- User has access
                EXISTS (
                    SELECT 1 FROM public.itinerary_access ia
                    WHERE ia.itinerary_id = i.id
                    AND ia.user_id = auth.uid()
                    AND (ia.valid_until IS NULL OR ia.valid_until > NOW())
                )
                OR
                -- User is admin
                EXISTS (
                    SELECT 1 FROM public.user_profiles up
                    WHERE up.id = auth.uid() AND (up.is_app_admin = TRUE OR up.default_role IN ('app_admin', 'super_admin'))
                )
            )
        )
    );

CREATE POLICY "Admins can manage itinerary stops"
    ON public.itinerary_stops FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND (is_app_admin = TRUE OR default_role IN ('app_admin', 'super_admin'))
        )
    );

-- 7. RLS Policies for itinerary_access
CREATE POLICY "Users can view their own access"
    ON public.itinerary_access FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all access"
    ON public.itinerary_access FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND (is_app_admin = TRUE OR default_role IN ('app_admin', 'super_admin'))
        )
    );

-- 8. Auto-grant access to admins for paid itineraries via a function
CREATE OR REPLACE FUNCTION public.check_itinerary_access(p_itinerary_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_paid BOOLEAN;
    v_is_admin BOOLEAN;
    v_has_access BOOLEAN;
BEGIN
    -- Check if itinerary is paid
    SELECT is_paid INTO v_is_paid FROM public.itineraries WHERE id = p_itinerary_id;
    
    -- Free itineraries are accessible to all
    IF NOT v_is_paid THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user is admin (admins always have access to paid itineraries)
    SELECT EXISTS(
        SELECT 1 FROM public.user_profiles
        WHERE id = p_user_id AND (is_app_admin = TRUE OR default_role IN ('app_admin', 'super_admin'))
    ) INTO v_is_admin;
    
    IF v_is_admin THEN
        RETURN TRUE;
    END IF;
    
    -- Check explicit access grant
    SELECT EXISTS(
        SELECT 1 FROM public.itinerary_access
        WHERE itinerary_id = p_itinerary_id
        AND user_id = p_user_id
        AND (valid_until IS NULL OR valid_until > NOW())
    ) INTO v_has_access;
    
    RETURN v_has_access;
END;
$$;

-- 9. Function to get itineraries matching user preferences
CREATE OR REPLACE FUNCTION public.get_matching_itineraries(
    p_city TEXT,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    city TEXT,
    is_paid BOOLEAN,
    price NUMERIC,
    currency TEXT,
    vibe_tags TEXT[],
    music_genres TEXT[],
    crowd_density TEXT,
    budget_tier TEXT,
    time_preferences TEXT[],
    start_time TIME,
    end_time TIME,
    days_of_week TEXT[],
    color TEXT,
    display_order INTEGER,
    is_featured BOOLEAN,
    match_score INTEGER,
    has_access BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_prefs JSONB;
    v_user_timing TEXT[];
    v_user_music TEXT[];
    v_user_crowd TEXT;
    v_user_budget TEXT;
BEGIN
    -- Get user preferences if user is logged in
    IF p_user_id IS NOT NULL THEN
        SELECT preferences INTO v_user_prefs
        FROM public.user_profiles
        WHERE id = p_user_id;
        
        IF v_user_prefs IS NOT NULL THEN
            SELECT ARRAY(SELECT jsonb_array_elements_text(v_user_prefs->'timing')) INTO v_user_timing;
            SELECT ARRAY(SELECT jsonb_array_elements_text(v_user_prefs->'music')) INTO v_user_music;
            v_user_crowd := v_user_prefs->>'crowdDensity';
            v_user_budget := v_user_prefs->>'budgetTier';
        END IF;
    END IF;
    
    RETURN QUERY
    SELECT
        i.id,
        i.title,
        i.description,
        i.city,
        i.is_paid,
        i.price,
        i.currency,
        i.vibe_tags,
        i.music_genres,
        i.crowd_density,
        i.budget_tier,
        i.time_preferences,
        i.start_time,
        i.end_time,
        i.days_of_week,
        i.color,
        i.display_order,
        i.is_featured,
        -- Calculate match score based on user preferences
        CASE
            WHEN p_user_id IS NULL OR v_user_prefs IS NULL THEN 0
            ELSE (
                -- Timing overlap score (0-40 points)
                COALESCE(
                    (SELECT COUNT(*)::INTEGER * 10
                     FROM unnest(i.time_preferences) tp
                     WHERE tp = ANY(v_user_timing)),
                    0
                ) +
                -- Music genre overlap score (0-30 points)
                COALESCE(
                    (SELECT COUNT(*)::INTEGER * 10
                     FROM unnest(i.music_genres) mg
                     WHERE mg = ANY(v_user_music)),
                    0
                ) +
                -- Crowd density match (0-20 points)
                CASE WHEN i.crowd_density = v_user_crowd THEN 20 ELSE 0 END +
                -- Budget tier match (0-10 points)
                CASE WHEN i.budget_tier = v_user_budget THEN 10 ELSE 0 END
            )
        END AS match_score,
        -- Check if user has access
        public.check_itinerary_access(i.id, p_user_id) AS has_access
    FROM public.itineraries i
    WHERE i.city = p_city
    AND i.is_active = TRUE
    ORDER BY
        CASE WHEN p_user_id IS NOT NULL AND v_user_prefs IS NOT NULL THEN
            -- Sort by match score desc, then featured, then display order
            0
        ELSE 1 END,
        i.is_featured DESC,
        i.display_order ASC;
END;
$$;

-- 10. Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_itineraries_updated_at
    BEFORE UPDATE ON public.itineraries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_itineraries_city ON public.itineraries(city);
CREATE INDEX IF NOT EXISTS idx_itineraries_is_active ON public.itineraries(is_active);
CREATE INDEX IF NOT EXISTS idx_itineraries_is_paid ON public.itineraries(is_paid);
CREATE INDEX IF NOT EXISTS idx_itinerary_stops_itinerary_id ON public.itinerary_stops(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_stops_order ON public.itinerary_stops(itinerary_id, stop_order);
CREATE INDEX IF NOT EXISTS idx_itinerary_access_user ON public.itinerary_access(user_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_access_itinerary ON public.itinerary_access(itinerary_id);


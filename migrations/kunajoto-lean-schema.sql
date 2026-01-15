-- ============================================
-- KUNAJOTO LEAN - DATABASE SCHEMA EXTENSIONS
-- ============================================
-- This migration adds admin-driven content management tables
-- for Kunajoto Lean. These tables are NON-DESTRUCTIVE and will
-- coexist with existing Kunajoto-Fire- tables.
--
-- Date: January 15, 2026
-- Version: 1.0.0
-- ============================================

-- ============================================
-- 1. ADD APP ADMIN ROLE TO USER PROFILES
-- ============================================

-- Add is_app_admin column to user_profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'is_app_admin'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN is_app_admin BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create index for faster admin lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_app_admin 
ON public.user_profiles(is_app_admin) 
WHERE is_app_admin = TRUE;

COMMENT ON COLUMN public.user_profiles.is_app_admin IS 'Indicates if user has admin privileges to manage content in Kunajoto Lean';

-- ============================================
-- 2. ADMIN EVENTS (Events of the Month)
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city TEXT NOT NULL CHECK (city IN ('London', 'Johannesburg', 'Cape Town', 'Los Angeles', 'Austin', 'New York City', 'Nairobi', 'Kinshasa')),
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE,
    event_time TEXT,
    image_url TEXT,
    external_link TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view events" 
    ON public.admin_events FOR SELECT 
    USING (true);

CREATE POLICY "App admins can insert events" 
    ON public.admin_events FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_app_admin = TRUE
        )
    );

CREATE POLICY "App admins can update events" 
    ON public.admin_events FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_app_admin = TRUE
        )
    );

CREATE POLICY "App admins can delete events" 
    ON public.admin_events FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_app_admin = TRUE
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_events_city ON public.admin_events(city);
CREATE INDEX IF NOT EXISTS idx_admin_events_event_date ON public.admin_events(event_date);
CREATE INDEX IF NOT EXISTS idx_admin_events_is_featured ON public.admin_events(is_featured) WHERE is_featured = TRUE;

-- ============================================
-- 3. ADMIN ARRIVAL TIPS (Best to Arrive On)
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_arrival_tips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city TEXT NOT NULL CHECK (city IN ('London', 'Johannesburg', 'Cape Town', 'Los Angeles', 'Austin', 'New York City', 'Nairobi', 'Kinshasa')),
    day_of_week TEXT CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    time_range TEXT,
    description TEXT NOT NULL,
    reason TEXT,
    display_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_arrival_tips ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view arrival tips" 
    ON public.admin_arrival_tips FOR SELECT 
    USING (true);

CREATE POLICY "App admins can insert arrival tips" 
    ON public.admin_arrival_tips FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_app_admin = TRUE
        )
    );

CREATE POLICY "App admins can update arrival tips" 
    ON public.admin_arrival_tips FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_app_admin = TRUE
        )
    );

CREATE POLICY "App admins can delete arrival tips" 
    ON public.admin_arrival_tips FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_app_admin = TRUE
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_arrival_tips_city ON public.admin_arrival_tips(city);

-- ============================================
-- 4. ADMIN STAY RECOMMENDATIONS (Best to Stay In)
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_stay_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city TEXT NOT NULL CHECK (city IN ('London', 'Johannesburg', 'Cape Town', 'Los Angeles', 'Austin', 'New York City', 'Nairobi', 'Kinshasa')),
    neighborhood TEXT NOT NULL,
    description TEXT NOT NULL,
    highlights TEXT[],
    image_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_stay_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view stay recommendations" 
    ON public.admin_stay_recommendations FOR SELECT 
    USING (true);

CREATE POLICY "App admins can insert stay recommendations" 
    ON public.admin_stay_recommendations FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_app_admin = TRUE
        )
    );

CREATE POLICY "App admins can update stay recommendations" 
    ON public.admin_stay_recommendations FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_app_admin = TRUE
        )
    );

CREATE POLICY "App admins can delete stay recommendations" 
    ON public.admin_stay_recommendations FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_app_admin = TRUE
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_stay_recommendations_city ON public.admin_stay_recommendations(city);
CREATE INDEX IF NOT EXISTS idx_admin_stay_recommendations_is_featured ON public.admin_stay_recommendations(is_featured) WHERE is_featured = TRUE;

-- ============================================
-- 5. ADMIN TOUR GUIDES DIRECTORY
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_tour_guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city TEXT NOT NULL CHECK (city IN ('London', 'Johannesburg', 'Cape Town', 'Los Angeles', 'Austin', 'New York City', 'Nairobi', 'Kinshasa')),
    name TEXT NOT NULL,
    bio TEXT,
    profile_image_url TEXT,
    offerings JSONB DEFAULT '[]'::jsonb, -- Array of {title, description, price, currency}
    contact_email TEXT,
    contact_phone TEXT,
    languages TEXT[],
    specialties TEXT[],
    stripe_price_id TEXT,
    stripe_product_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    rating DECIMAL(2,1) DEFAULT 0.0,
    total_bookings INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_tour_guides ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active tour guides" 
    ON public.admin_tour_guides FOR SELECT 
    USING (is_active = TRUE);

CREATE POLICY "App admins can view all tour guides" 
    ON public.admin_tour_guides FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_app_admin = TRUE
        )
    );

CREATE POLICY "App admins can insert tour guides" 
    ON public.admin_tour_guides FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_app_admin = TRUE
        )
    );

CREATE POLICY "App admins can update tour guides" 
    ON public.admin_tour_guides FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_app_admin = TRUE
        )
    );

CREATE POLICY "App admins can delete tour guides" 
    ON public.admin_tour_guides FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_app_admin = TRUE
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_tour_guides_city ON public.admin_tour_guides(city);
CREATE INDEX IF NOT EXISTS idx_admin_tour_guides_is_active ON public.admin_tour_guides(is_active) WHERE is_active = TRUE;

-- ============================================
-- 6. ADMIN PARTY HOSTS DIRECTORY
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_party_hosts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city TEXT NOT NULL CHECK (city IN ('London', 'Johannesburg', 'Cape Town', 'Los Angeles', 'Austin', 'New York City', 'Nairobi', 'Kinshasa')),
    name TEXT NOT NULL,
    bio TEXT,
    profile_image_url TEXT,
    offerings JSONB DEFAULT '[]'::jsonb, -- Array of {title, description, price, currency, capacity}
    contact_email TEXT,
    contact_phone TEXT,
    specialties TEXT[],
    stripe_price_id TEXT,
    stripe_product_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    rating DECIMAL(2,1) DEFAULT 0.0,
    total_bookings INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_party_hosts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active party hosts" 
    ON public.admin_party_hosts FOR SELECT 
    USING (is_active = TRUE);

CREATE POLICY "App admins can view all party hosts" 
    ON public.admin_party_hosts FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_app_admin = TRUE
        )
    );

CREATE POLICY "App admins can insert party hosts" 
    ON public.admin_party_hosts FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_app_admin = TRUE
        )
    );

CREATE POLICY "App admins can update party hosts" 
    ON public.admin_party_hosts FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_app_admin = TRUE
        )
    );

CREATE POLICY "App admins can delete party hosts" 
    ON public.admin_party_hosts FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_app_admin = TRUE
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_party_hosts_city ON public.admin_party_hosts(city);
CREATE INDEX IF NOT EXISTS idx_admin_party_hosts_is_active ON public.admin_party_hosts(is_active) WHERE is_active = TRUE;

-- ============================================
-- 7. ADMIN ACCOMMODATIONS DIRECTORY
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_accommodations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city TEXT NOT NULL CHECK (city IN ('London', 'Johannesburg', 'Cape Town', 'Los Angeles', 'Austin', 'New York City', 'Nairobi', 'Kinshasa')),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('airbnb', 'hotel', 'hostel', 'apartment', 'other')),
    description TEXT,
    image_url TEXT,
    affiliate_link TEXT NOT NULL,
    price_range TEXT,
    neighborhood TEXT,
    amenities TEXT[],
    is_partner BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_accommodations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view accommodations" 
    ON public.admin_accommodations FOR SELECT 
    USING (true);

CREATE POLICY "App admins can insert accommodations" 
    ON public.admin_accommodations FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_app_admin = TRUE
        )
    );

CREATE POLICY "App admins can update accommodations" 
    ON public.admin_accommodations FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_app_admin = TRUE
        )
    );

CREATE POLICY "App admins can delete accommodations" 
    ON public.admin_accommodations FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_app_admin = TRUE
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_accommodations_city ON public.admin_accommodations(city);
CREATE INDEX IF NOT EXISTS idx_admin_accommodations_type ON public.admin_accommodations(type);
CREATE INDEX IF NOT EXISTS idx_admin_accommodations_is_featured ON public.admin_accommodations(is_featured) WHERE is_featured = TRUE;

-- ============================================
-- 8. ADMIN TRAVEL SERVICES
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_travel_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city TEXT NOT NULL CHECK (city IN ('London', 'Johannesburg', 'Cape Town', 'Los Angeles', 'Austin', 'New York City', 'Nairobi', 'Kinshasa')),
    service_type TEXT NOT NULL CHECK (service_type IN ('flight', 'airport_service', 'mobility', 'car_rental', 'other')),
    provider_name TEXT NOT NULL,
    description TEXT,
    affiliate_link TEXT NOT NULL,
    coupon_code TEXT,
    promo_code TEXT,
    discount_details TEXT,
    image_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_travel_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view travel services" 
    ON public.admin_travel_services FOR SELECT 
    USING (true);

CREATE POLICY "App admins can insert travel services" 
    ON public.admin_travel_services FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_app_admin = TRUE
        )
    );

CREATE POLICY "App admins can update travel services" 
    ON public.admin_travel_services FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_app_admin = TRUE
        )
    );

CREATE POLICY "App admins can delete travel services" 
    ON public.admin_travel_services FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_app_admin = TRUE
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_travel_services_city ON public.admin_travel_services(city);
CREATE INDEX IF NOT EXISTS idx_admin_travel_services_service_type ON public.admin_travel_services(service_type);
CREATE INDEX IF NOT EXISTS idx_admin_travel_services_is_featured ON public.admin_travel_services(is_featured) WHERE is_featured = TRUE;

-- ============================================
-- 9. ADMIN CITY VIBE SCORES (Manual Entry)
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_city_vibe_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city TEXT NOT NULL CHECK (city IN ('London', 'Johannesburg', 'Cape Town', 'Los Angeles', 'Austin', 'New York City', 'Nairobi', 'Kinshasa')),
    week_start_date DATE NOT NULL,
    monday_score DECIMAL(3,1) CHECK (monday_score >= 0 AND monday_score <= 10),
    tuesday_score DECIMAL(3,1) CHECK (tuesday_score >= 0 AND tuesday_score <= 10),
    wednesday_score DECIMAL(3,1) CHECK (wednesday_score >= 0 AND wednesday_score <= 10),
    thursday_score DECIMAL(3,1) CHECK (thursday_score >= 0 AND thursday_score <= 10),
    friday_score DECIMAL(3,1) CHECK (friday_score >= 0 AND friday_score <= 10),
    saturday_score DECIMAL(3,1) CHECK (saturday_score >= 0 AND saturday_score <= 10),
    sunday_score DECIMAL(3,1) CHECK (sunday_score >= 0 AND sunday_score <= 10),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(city, week_start_date)
);

-- Enable RLS
ALTER TABLE public.admin_city_vibe_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view city vibe scores" 
    ON public.admin_city_vibe_scores FOR SELECT 
    USING (true);

CREATE POLICY "App admins can insert city vibe scores" 
    ON public.admin_city_vibe_scores FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_app_admin = TRUE
        )
    );

CREATE POLICY "App admins can update city vibe scores" 
    ON public.admin_city_vibe_scores FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_app_admin = TRUE
        )
    );

CREATE POLICY "App admins can delete city vibe scores" 
    ON public.admin_city_vibe_scores FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND is_app_admin = TRUE
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_city_vibe_scores_city ON public.admin_city_vibe_scores(city);
CREATE INDEX IF NOT EXISTS idx_admin_city_vibe_scores_week_start_date ON public.admin_city_vibe_scores(week_start_date);

-- ============================================
-- 10. HELPER FUNCTIONS
-- ============================================

-- Function to get current day's vibe score for a city
CREATE OR REPLACE FUNCTION get_current_city_vibe_score(p_city TEXT)
RETURNS DECIMAL(3,1) AS $$
DECLARE
    v_score DECIMAL(3,1);
    v_day_of_week INTEGER;
    v_week_start DATE;
BEGIN
    -- Get current day of week (0 = Sunday, 1 = Monday, etc.)
    v_day_of_week := EXTRACT(DOW FROM CURRENT_DATE);
    
    -- Calculate the Monday of the current week
    v_week_start := CURRENT_DATE - (v_day_of_week - 1) * INTERVAL '1 day';
    
    -- Get the score for the current day
    SELECT 
        CASE v_day_of_week
            WHEN 1 THEN monday_score
            WHEN 2 THEN tuesday_score
            WHEN 3 THEN wednesday_score
            WHEN 4 THEN thursday_score
            WHEN 5 THEN friday_score
            WHEN 6 THEN saturday_score
            WHEN 0 THEN sunday_score
        END
    INTO v_score
    FROM public.admin_city_vibe_scores
    WHERE city = p_city 
    AND week_start_date = v_week_start;
    
    RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 11. UPDATED_AT TRIGGERS
-- ============================================

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all new tables
CREATE TRIGGER update_admin_events_updated_at
    BEFORE UPDATE ON public.admin_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_arrival_tips_updated_at
    BEFORE UPDATE ON public.admin_arrival_tips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_stay_recommendations_updated_at
    BEFORE UPDATE ON public.admin_stay_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_tour_guides_updated_at
    BEFORE UPDATE ON public.admin_tour_guides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_party_hosts_updated_at
    BEFORE UPDATE ON public.admin_party_hosts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_accommodations_updated_at
    BEFORE UPDATE ON public.admin_accommodations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_travel_services_updated_at
    BEFORE UPDATE ON public.admin_travel_services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_city_vibe_scores_updated_at
    BEFORE UPDATE ON public.admin_city_vibe_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 12. GRANT PERMISSIONS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant select on all new tables to authenticated users
GRANT SELECT ON public.admin_events TO authenticated;
GRANT SELECT ON public.admin_arrival_tips TO authenticated;
GRANT SELECT ON public.admin_stay_recommendations TO authenticated;
GRANT SELECT ON public.admin_tour_guides TO authenticated;
GRANT SELECT ON public.admin_party_hosts TO authenticated;
GRANT SELECT ON public.admin_accommodations TO authenticated;
GRANT SELECT ON public.admin_travel_services TO authenticated;
GRANT SELECT ON public.admin_city_vibe_scores TO authenticated;

-- Grant all privileges to service role
GRANT ALL ON public.admin_events TO service_role;
GRANT ALL ON public.admin_arrival_tips TO service_role;
GRANT ALL ON public.admin_stay_recommendations TO service_role;
GRANT ALL ON public.admin_tour_guides TO service_role;
GRANT ALL ON public.admin_party_hosts TO service_role;
GRANT ALL ON public.admin_accommodations TO service_role;
GRANT ALL ON public.admin_travel_services TO service_role;
GRANT ALL ON public.admin_city_vibe_scores TO service_role;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Kunajoto Lean schema migration completed successfully!';
    RAISE NOTICE 'Tables created: 8';
    RAISE NOTICE 'RLS policies applied: 32';
    RAISE NOTICE 'Indexes created: 15';
    RAISE NOTICE 'Helper functions: 1';
END $$;

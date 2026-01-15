#!/usr/bin/env python3
"""
Script to set up Kunajoto Lean admin content tables in Supabase
"""

import subprocess
import json
import sys

PROJECT_ID = "grnekxrkypgighmxyveh"

def execute_sql(query):
    """Execute SQL query using manus-mcp-cli"""
    try:
        result = subprocess.run([
            'manus-mcp-cli', 'tool', 'call', 'execute_sql',
            '--server', 'supabase',
            '--input', json.dumps({"project_id": PROJECT_ID, "query": query})
        ], capture_output=True, text=True, check=True)
        print(f"✓ Executed: {query[:80]}...")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Error: {e.stderr}")
        return False

# SQL statements to execute in order
statements = [
    # 1. Add is_app_admin column to user_profiles
    """
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
    """,
    
    # 2. Create index for is_app_admin
    "CREATE INDEX IF NOT EXISTS idx_user_profiles_is_app_admin ON public.user_profiles(is_app_admin) WHERE is_app_admin = TRUE;",
    
    # 3. Create admin_events table
    """
    CREATE TABLE IF NOT EXISTS public.admin_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        city TEXT NOT NULL,
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
    """,
    
    # 4. Enable RLS on admin_events
    "ALTER TABLE public.admin_events ENABLE ROW LEVEL SECURITY;",
    
    # 5-8. Create RLS policies for admin_events
    "CREATE POLICY IF NOT EXISTS admin_events_select ON public.admin_events FOR SELECT USING (true);",
    "CREATE POLICY IF NOT EXISTS admin_events_insert ON public.admin_events FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_app_admin = TRUE));",
    "CREATE POLICY IF NOT EXISTS admin_events_update ON public.admin_events FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_app_admin = TRUE));",
    "CREATE POLICY IF NOT EXISTS admin_events_delete ON public.admin_events FOR DELETE USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_app_admin = TRUE));",
    
    # 9-11. Create indexes for admin_events
    "CREATE INDEX IF NOT EXISTS idx_admin_events_city ON public.admin_events(city);",
    "CREATE INDEX IF NOT EXISTS idx_admin_events_event_date ON public.admin_events(event_date);",
    "CREATE INDEX IF NOT EXISTS idx_admin_events_is_featured ON public.admin_events(is_featured) WHERE is_featured = TRUE;",
    
    # 12. Create admin_arrival_tips table
    """
    CREATE TABLE IF NOT EXISTS public.admin_arrival_tips (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        city TEXT NOT NULL,
        day_of_week TEXT,
        time_range TEXT,
        description TEXT NOT NULL,
        reason TEXT,
        display_order INTEGER DEFAULT 0,
        created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    """,
    
    # 13. Enable RLS on admin_arrival_tips
    "ALTER TABLE public.admin_arrival_tips ENABLE ROW LEVEL SECURITY;",
    
    # 14-17. Create RLS policies for admin_arrival_tips
    "CREATE POLICY IF NOT EXISTS admin_arrival_tips_select ON public.admin_arrival_tips FOR SELECT USING (true);",
    "CREATE POLICY IF NOT EXISTS admin_arrival_tips_insert ON public.admin_arrival_tips FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_app_admin = TRUE));",
    "CREATE POLICY IF NOT EXISTS admin_arrival_tips_update ON public.admin_arrival_tips FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_app_admin = TRUE));",
    "CREATE POLICY IF NOT EXISTS admin_arrival_tips_delete ON public.admin_arrival_tips FOR DELETE USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_app_admin = TRUE));",
    
    # 18. Create index for admin_arrival_tips
    "CREATE INDEX IF NOT EXISTS idx_admin_arrival_tips_city ON public.admin_arrival_tips(city);",
    
    # 19. Create admin_stay_recommendations table
    """
    CREATE TABLE IF NOT EXISTS public.admin_stay_recommendations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        city TEXT NOT NULL,
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
    """,
    
    # 20. Enable RLS on admin_stay_recommendations
    "ALTER TABLE public.admin_stay_recommendations ENABLE ROW LEVEL SECURITY;",
    
    # 21-24. Create RLS policies for admin_stay_recommendations
    "CREATE POLICY IF NOT EXISTS admin_stay_recommendations_select ON public.admin_stay_recommendations FOR SELECT USING (true);",
    "CREATE POLICY IF NOT EXISTS admin_stay_recommendations_insert ON public.admin_stay_recommendations FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_app_admin = TRUE));",
    "CREATE POLICY IF NOT EXISTS admin_stay_recommendations_update ON public.admin_stay_recommendations FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_app_admin = TRUE));",
    "CREATE POLICY IF NOT EXISTS admin_stay_recommendations_delete ON public.admin_stay_recommendations FOR DELETE USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_app_admin = TRUE));",
    
    # 25-26. Create indexes for admin_stay_recommendations
    "CREATE INDEX IF NOT EXISTS idx_admin_stay_recommendations_city ON public.admin_stay_recommendations(city);",
    "CREATE INDEX IF NOT EXISTS idx_admin_stay_recommendations_is_featured ON public.admin_stay_recommendations(is_featured) WHERE is_featured = TRUE;",
    
    # 27. Create admin_tour_guides table
    """
    CREATE TABLE IF NOT EXISTS public.admin_tour_guides (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        city TEXT NOT NULL,
        name TEXT NOT NULL,
        bio TEXT,
        profile_image_url TEXT,
        offerings JSONB DEFAULT '[]'::jsonb,
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
    """,
    
    # 28. Enable RLS on admin_tour_guides
    "ALTER TABLE public.admin_tour_guides ENABLE ROW LEVEL SECURITY;",
    
    # 29-33. Create RLS policies for admin_tour_guides
    "CREATE POLICY IF NOT EXISTS admin_tour_guides_select_active ON public.admin_tour_guides FOR SELECT USING (is_active = TRUE);",
    "CREATE POLICY IF NOT EXISTS admin_tour_guides_select_all ON public.admin_tour_guides FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_app_admin = TRUE));",
    "CREATE POLICY IF NOT EXISTS admin_tour_guides_insert ON public.admin_tour_guides FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_app_admin = TRUE));",
    "CREATE POLICY IF NOT EXISTS admin_tour_guides_update ON public.admin_tour_guides FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_app_admin = TRUE));",
    "CREATE POLICY IF NOT EXISTS admin_tour_guides_delete ON public.admin_tour_guides FOR DELETE USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_app_admin = TRUE));",
    
    # 34-35. Create indexes for admin_tour_guides
    "CREATE INDEX IF NOT EXISTS idx_admin_tour_guides_city ON public.admin_tour_guides(city);",
    "CREATE INDEX IF NOT EXISTS idx_admin_tour_guides_is_active ON public.admin_tour_guides(is_active) WHERE is_active = TRUE;",
    
    # 36. Create admin_party_hosts table
    """
    CREATE TABLE IF NOT EXISTS public.admin_party_hosts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        city TEXT NOT NULL,
        name TEXT NOT NULL,
        bio TEXT,
        profile_image_url TEXT,
        offerings JSONB DEFAULT '[]'::jsonb,
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
    """,
    
    # 37. Enable RLS on admin_party_hosts
    "ALTER TABLE public.admin_party_hosts ENABLE ROW LEVEL SECURITY;",
    
    # 38-42. Create RLS policies for admin_party_hosts
    "CREATE POLICY IF NOT EXISTS admin_party_hosts_select_active ON public.admin_party_hosts FOR SELECT USING (is_active = TRUE);",
    "CREATE POLICY IF NOT EXISTS admin_party_hosts_select_all ON public.admin_party_hosts FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_app_admin = TRUE));",
    "CREATE POLICY IF NOT EXISTS admin_party_hosts_insert ON public.admin_party_hosts FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_app_admin = TRUE));",
    "CREATE POLICY IF NOT EXISTS admin_party_hosts_update ON public.admin_party_hosts FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_app_admin = TRUE));",
    "CREATE POLICY IF NOT EXISTS admin_party_hosts_delete ON public.admin_party_hosts FOR DELETE USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_app_admin = TRUE));",
    
    # 43-44. Create indexes for admin_party_hosts
    "CREATE INDEX IF NOT EXISTS idx_admin_party_hosts_city ON public.admin_party_hosts(city);",
    "CREATE INDEX IF NOT EXISTS idx_admin_party_hosts_is_active ON public.admin_party_hosts(is_active) WHERE is_active = TRUE;",
    
    # 45. Create admin_accommodations table
    """
    CREATE TABLE IF NOT EXISTS public.admin_accommodations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        city TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        accommodation_type TEXT,
        image_url TEXT,
        affiliate_link TEXT,
        booking_url TEXT,
        price_range TEXT,
        is_featured BOOLEAN DEFAULT FALSE,
        display_order INTEGER DEFAULT 0,
        created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    """,
    
    # 46. Enable RLS on admin_accommodations
    "ALTER TABLE public.admin_accommodations ENABLE ROW LEVEL SECURITY;",
    
    # 47-50. Create RLS policies for admin_accommodations
    "CREATE POLICY IF NOT EXISTS admin_accommodations_select ON public.admin_accommodations FOR SELECT USING (true);",
    "CREATE POLICY IF NOT EXISTS admin_accommodations_insert ON public.admin_accommodations FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_app_admin = TRUE));",
    "CREATE POLICY IF NOT EXISTS admin_accommodations_update ON public.admin_accommodations FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_app_admin = TRUE));",
    "CREATE POLICY IF NOT EXISTS admin_accommodations_delete ON public.admin_accommodations FOR DELETE USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_app_admin = TRUE));",
    
    # 51-52. Create indexes for admin_accommodations
    "CREATE INDEX IF NOT EXISTS idx_admin_accommodations_city ON public.admin_accommodations(city);",
    "CREATE INDEX IF NOT EXISTS idx_admin_accommodations_is_featured ON public.admin_accommodations(is_featured) WHERE is_featured = TRUE;",
    
    # 53. Create admin_travel_services table
    """
    CREATE TABLE IF NOT EXISTS public.admin_travel_services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        city TEXT NOT NULL,
        service_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        affiliate_link TEXT,
        promo_code TEXT,
        discount_details TEXT,
        image_url TEXT,
        display_order INTEGER DEFAULT 0,
        created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    """,
    
    # 54. Enable RLS on admin_travel_services
    "ALTER TABLE public.admin_travel_services ENABLE ROW LEVEL SECURITY;",
    
    # 55-58. Create RLS policies for admin_travel_services
    "CREATE POLICY IF NOT EXISTS admin_travel_services_select ON public.admin_travel_services FOR SELECT USING (true);",
    "CREATE POLICY IF NOT EXISTS admin_travel_services_insert ON public.admin_travel_services FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_app_admin = TRUE));",
    "CREATE POLICY IF NOT EXISTS admin_travel_services_update ON public.admin_travel_services FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_app_admin = TRUE));",
    "CREATE POLICY IF NOT EXISTS admin_travel_services_delete ON public.admin_travel_services FOR DELETE USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_app_admin = TRUE));",
    
    # 59-60. Create indexes for admin_travel_services
    "CREATE INDEX IF NOT EXISTS idx_admin_travel_services_city ON public.admin_travel_services(city);",
    "CREATE INDEX IF NOT EXISTS idx_admin_travel_services_service_type ON public.admin_travel_services(service_type);",
    
    # 61. Create admin_city_vibe_scores table
    """
    CREATE TABLE IF NOT EXISTS public.admin_city_vibe_scores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        city TEXT NOT NULL,
        day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
        vibe_score DECIMAL(3,1) NOT NULL CHECK (vibe_score >= 0 AND vibe_score <= 10),
        week_start_date DATE NOT NULL,
        notes TEXT,
        created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(city, week_start_date, day_of_week)
    );
    """,
    
    # 62. Enable RLS on admin_city_vibe_scores
    "ALTER TABLE public.admin_city_vibe_scores ENABLE ROW LEVEL SECURITY;",
    
    # 63-66. Create RLS policies for admin_city_vibe_scores
    "CREATE POLICY IF NOT EXISTS admin_city_vibe_scores_select ON public.admin_city_vibe_scores FOR SELECT USING (true);",
    "CREATE POLICY IF NOT EXISTS admin_city_vibe_scores_insert ON public.admin_city_vibe_scores FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_app_admin = TRUE));",
    "CREATE POLICY IF NOT EXISTS admin_city_vibe_scores_update ON public.admin_city_vibe_scores FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_app_admin = TRUE));",
    "CREATE POLICY IF NOT EXISTS admin_city_vibe_scores_delete ON public.admin_city_vibe_scores FOR DELETE USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_app_admin = TRUE));",
    
    # 67-69. Create indexes for admin_city_vibe_scores
    "CREATE INDEX IF NOT EXISTS idx_admin_city_vibe_scores_city ON public.admin_city_vibe_scores(city);",
    "CREATE INDEX IF NOT EXISTS idx_admin_city_vibe_scores_week_start_date ON public.admin_city_vibe_scores(week_start_date);",
    "CREATE INDEX IF NOT EXISTS idx_admin_city_vibe_scores_city_week ON public.admin_city_vibe_scores(city, week_start_date);",
    
    # 70. Create helper function to get current day's vibe score
    """
    CREATE OR REPLACE FUNCTION public.get_current_vibe_score(p_city TEXT)
    RETURNS DECIMAL(3,1) AS $$
    DECLARE
        v_score DECIMAL(3,1);
        v_day_of_week INTEGER;
        v_week_start DATE;
    BEGIN
        v_day_of_week := EXTRACT(DOW FROM CURRENT_DATE);
        v_week_start := DATE_TRUNC('week', CURRENT_DATE)::DATE;
        
        SELECT vibe_score INTO v_score
        FROM public.admin_city_vibe_scores
        WHERE city = p_city
          AND week_start_date = v_week_start
          AND day_of_week = v_day_of_week
        LIMIT 1;
        
        RETURN COALESCE(v_score, 5.0);
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    """,
]

def main():
    print("=" * 60)
    print("Setting up Kunajoto Lean Admin Tables")
    print("=" * 60)
    
    success_count = 0
    fail_count = 0
    
    for i, stmt in enumerate(statements, 1):
        print(f"\n[{i}/{len(statements)}] Executing statement...")
        if execute_sql(stmt.strip()):
            success_count += 1
        else:
            fail_count += 1
            print(f"Failed statement: {stmt[:200]}...")
    
    print("\n" + "=" * 60)
    print(f"Setup Complete: {success_count} succeeded, {fail_count} failed")
    print("=" * 60)
    
    return 0 if fail_count == 0 else 1

if __name__ == "__main__":
    sys.exit(main())

-- Test creating admin_events table
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

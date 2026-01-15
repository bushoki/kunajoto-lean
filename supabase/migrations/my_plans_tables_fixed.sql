-- My Plans System Tables (Fixed order)

-- 1. User Suggested Venues (must be created first)
CREATE TABLE IF NOT EXISTS public.user_suggested_venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Plans table
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  is_template BOOLEAN DEFAULT FALSE,
  template_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (status IN ('draft', 'active', 'scheduled', 'in_progress', 'completed', 'postponed', 'cancelled'))
);

-- 3. Plan Venues
CREATE TABLE IF NOT EXISTS public.plan_venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  venue_id TEXT REFERENCES public.venues(id) ON DELETE CASCADE,
  user_suggested_venue_id UUID REFERENCES public.user_suggested_venues(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  arrival_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK ((venue_id IS NOT NULL AND user_suggested_venue_id IS NULL) OR (venue_id IS NULL AND user_suggested_venue_id IS NOT NULL))
);

-- 4. Plan Shares
CREATE TABLE IF NOT EXISTS public.plan_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  can_edit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_id, shared_with_user_id)
);

-- 5. Plan Feedback
CREATE TABLE IF NOT EXISTS public.plan_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  venue_ratings JSONB,
  comments TEXT,
  would_recommend BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_id, user_id)
);

-- 6. Plan Templates
CREATE TABLE IF NOT EXISTS public.plan_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  city TEXT NOT NULL,
  preferences_match JSONB,
  is_featured BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_plans_user ON public.plans(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_status ON public.plans(status);
CREATE INDEX IF NOT EXISTS idx_plan_venues_plan ON public.plan_venues(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_venues_user ON public.user_suggested_venues(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_shares_plan ON public.plan_shares(plan_id);
CREATE INDEX IF NOT EXISTS idx_feedback_plan ON public.plan_feedback(plan_id);
CREATE INDEX IF NOT EXISTS idx_templates_city ON public.plan_templates(city);

-- RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_suggested_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plans" ON public.plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create plans" ON public.plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plans" ON public.plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plans" ON public.plans FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can manage plan venues" ON public.plan_venues FOR ALL USING (EXISTS (SELECT 1 FROM public.plans WHERE id = plan_id AND user_id = auth.uid()));
CREATE POLICY "Users can manage suggested venues" ON public.user_suggested_venues FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view templates" ON public.plan_templates FOR SELECT USING (true);

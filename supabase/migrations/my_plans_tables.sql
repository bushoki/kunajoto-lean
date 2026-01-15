-- My Plans System Tables
-- Full CRUD with 7 status types and user-suggested venues

-- 1. Plans table
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

CREATE INDEX IF NOT EXISTS idx_plans_user ON public.plans(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_status ON public.plans(status);
CREATE INDEX IF NOT EXISTS idx_plans_template ON public.plans(is_template);

-- 2. Plan Venues (many-to-many)
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

CREATE INDEX IF NOT EXISTS idx_plan_venues_plan ON public.plan_venues(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_venues_venue ON public.plan_venues(venue_id);

-- 3. User Suggested Venues (user-created venues)
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

CREATE INDEX IF NOT EXISTS idx_user_venues_user ON public.user_suggested_venues(user_id);

-- 4. Plan Shares (collaborative plans)
CREATE TABLE IF NOT EXISTS public.plan_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  can_edit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_id, shared_with_user_id)
);

CREATE INDEX IF NOT EXISTS idx_plan_shares_plan ON public.plan_shares(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_shares_user ON public.plan_shares(shared_with_user_id);

-- 5. Plan Feedback (for completed plans)
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

CREATE INDEX IF NOT EXISTS idx_feedback_plan ON public.plan_feedback(plan_id);

-- 6. Plan Templates (admin-curated)
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

CREATE INDEX IF NOT EXISTS idx_templates_city ON public.plan_templates(city);
CREATE INDEX IF NOT EXISTS idx_templates_featured ON public.plan_templates(is_featured);

-- RLS Policies
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_suggested_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_templates ENABLE ROW LEVEL SECURITY;

-- Plans policies
CREATE POLICY "Users can view own plans" ON public.plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view shared plans" ON public.plans FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.plan_shares WHERE plan_id = id AND shared_with_user_id = auth.uid())
);
CREATE POLICY "Users can create plans" ON public.plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plans" ON public.plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plans" ON public.plans FOR DELETE USING (auth.uid() = user_id);

-- Plan venues policies
CREATE POLICY "Users can view plan venues" ON public.plan_venues FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.plans WHERE id = plan_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.plan_shares WHERE plan_id = plans.id AND shared_with_user_id = auth.uid())))
);
CREATE POLICY "Users can manage plan venues" ON public.plan_venues FOR ALL USING (
  EXISTS (SELECT 1 FROM public.plans WHERE id = plan_id AND user_id = auth.uid())
);

-- User suggested venues policies
CREATE POLICY "Users can view own suggested venues" ON public.user_suggested_venues FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create suggested venues" ON public.user_suggested_venues FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own suggested venues" ON public.user_suggested_venues FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own suggested venues" ON public.user_suggested_venues FOR DELETE USING (auth.uid() = user_id);

-- Plan shares policies
CREATE POLICY "Users can view shares for their plans" ON public.plan_shares FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.plans WHERE id = plan_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create shares for their plans" ON public.plan_shares FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.plans WHERE id = plan_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete shares for their plans" ON public.plan_shares FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.plans WHERE id = plan_id AND user_id = auth.uid())
);

-- Feedback policies
CREATE POLICY "Users can view feedback for their plans" ON public.plan_feedback FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.plans WHERE id = plan_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create feedback" ON public.plan_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Templates policies (public read, admin write)
CREATE POLICY "Anyone can view templates" ON public.plan_templates FOR SELECT USING (true);
CREATE POLICY "Admins can manage templates" ON public.plan_templates FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND default_role IN ('super_admin', 'app_admin'))
);

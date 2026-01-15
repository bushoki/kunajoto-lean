# Kunajoto-Lean: Codebase Analysis & Implementation Plan

## Date: January 15, 2026

---

## 1. Existing Kunajoto-Fire- Architecture Analysis

### 1.1 Technology Stack
- **Frontend**: React 19.2.0 + TypeScript + Vite
- **Styling**: Tailwind CSS 4.1.17
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Mapping**: Google Maps API with Marker Clusterer
- **AI**: Google Gemini API (@google/genai)
- **State Management**: React Hooks (useState, useEffect)
- **Deployment**: Netlify (https://devtests-kunajoto.netlify.app/)

### 1.2 Current App Structure

#### Main Components
1. **App.tsx** (883 lines) - Main application orchestrator
2. **Components Structure**:
   - `components/admin/` - Admin dashboard and scoring editor
   - `components/common/` - Shared components (CountrySelect, ImageUpload)
   - `components/features/` - Core features (ExploreTab, Profile, CityGauge, etc.)
   - `components/layout/` - Layout components (TopBar, BottomNav, SplashScreen)
   - `components/map/` - Map container variants
   - `components/modals/` - Modal dialogs

#### Key Services
- `services/authService.ts` - Authentication management
- `services/dataService.ts` - Data fetching and management

#### Current App Flow
1. **SPLASH** screen → Brief intro
2. **GUEST_MAP** or **PREFERENCE_FLOW** (if authenticated without prefs)
3. **MAIN_APP** (if authenticated with prefs)
4. Bottom navigation: Map, Explore, CityGauge, Profile
5. Optional auth modal for guest users

### 1.3 Database Schema (Supabase)

#### Core Tables
- `user_profiles` - User data with role, preferences, onboarding status
- `user_preferences` - Detailed user preferences (venue types, music, budget, etc.)
- `venues` - Venue data with vibe scores, location, images
- `favorites` - User favorite venues
- `check_ins` - User check-in history
- `reviews` - User reviews for venues
- `app_data` - App configuration data
- `plans` - User trip plans
- `plan_venues` - Venues associated with plans

#### Authentication
- Uses Supabase Auth with PKCE flow
- Row Level Security (RLS) policies enabled
- Role-based access: USER, ADMIN, MODERATOR
- BaseJump configured for super admin management

### 1.4 Current Features to Preserve
- ✅ Geolocation with city detection
- ✅ Google Maps integration
- ✅ Venue data from Supabase
- ✅ Authentication flow
- ✅ User favorites
- ✅ User plans
- ✅ Bottom navigation
- ✅ Splash screen
- ✅ Profile management

### 1.5 Current Features to Remove/Modify for Lean Version
- ❌ Vibe scores display (remove from UI, keep in DB)
- ❌ Vibe forecasts (7-day predictions)
- ❌ Preference onboarding flow (move to profile settings)
- ❌ Subscription/plan selection modal
- ❌ Advanced AI features (keep basic chat if needed)
- ❌ Automated vibe score calculation
- ✏️ ExploreTab - Complete redesign with admin-driven content

---

## 2. Kunajoto-Lean Requirements Summary

### 2.1 Core Differences from Kunajoto-Fire-

| Feature | Kunajoto-Fire- | Kunajoto-Lean |
|---------|----------------|---------------|
| **Data Entry** | Automated (APIs, AI) | Manual (Admin-driven) |
| **Vibe Scores** | Displayed prominently | Hidden from users |
| **Vibe Forecasts** | 7-day predictions | Not displayed |
| **Onboarding** | Preference flow required | Brief splash → Auth → Explore |
| **Landing Tab** | Map tab | Explore tab |
| **Auth Flow** | Optional for guests | Mandatory after splash |
| **Location Restriction** | Global | 8 cities only |
| **Admin Dashboard** | Basic scoring editor | Comprehensive content CMS |
| **Explore Tab** | Simple recommendations | Rich admin-curated content |
| **Profile** | With subscription panel | No subscription, preferences in settings |

### 2.2 Target Cities
1. London
2. Johannesburg
3. Cape Town
4. Los Angeles
5. Austin
6. New York City
7. Nairobi
8. Kinshasa

### 2.3 Admin Content Management Features

The admin dashboard must allow app admins to create/edit/delete:

1. **Events of the Month** - Featured monthly events
2. **Best to Arrive On** - Recommended arrival days/times
3. **Best to Stay In** - Recommended neighborhoods/areas
4. **Local Tour Guides Directory** - Tour guide profiles with offerings
5. **Local Party Hosts Directory** - Party host profiles with offerings
6. **Airbnb & Hotel Directory** - Partnered accommodations with affiliate links
7. **Air Ticket, Airport Services, Mobility Solutions** - Affiliate links, coupons, promo codes
8. **City Vibe Score (Manual)** - Weekly manual entry by admins

All content must be **location-targeted** to specific cities.

### 2.4 New UX Flow

```
1. App Launch
   ↓
2. Splash Screen (brief onboarding cards)
   ↓
3. Auth Screen (Sign Up / Login) - MANDATORY
   ↓
4. Explore Tab (Landing page)
   ↓
5. Bottom Nav: Explore | Map | CityGauge | Profile
```

### 2.5 Location Access Control

- **Geolocation**: Detect user's current city
- **Manual Selection**: Allow users to select from 8 target cities
- **Out-of-Range Message**: Display friendly message if user is not in target cities
- **Trip Planning Mode**: Allow manual city selection for trip planning

---

## 3. Database Schema Extensions for Kunajoto-Lean

### 3.1 New Tables Required

```sql
-- Admin-managed content tables

-- Events of the Month
CREATE TABLE IF NOT EXISTS public.admin_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE,
    image_url TEXT,
    external_link TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Best to Arrive On
CREATE TABLE IF NOT EXISTS public.admin_arrival_tips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city TEXT NOT NULL,
    day_of_week TEXT,
    time_range TEXT,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Best to Stay In
CREATE TABLE IF NOT EXISTS public.admin_stay_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city TEXT NOT NULL,
    neighborhood TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tour Guides Directory
CREATE TABLE IF NOT EXISTS public.admin_tour_guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city TEXT NOT NULL,
    name TEXT NOT NULL,
    bio TEXT,
    profile_image_url TEXT,
    offerings JSONB, -- Array of offerings with prices
    contact_email TEXT,
    contact_phone TEXT,
    stripe_price_id TEXT, -- For payment integration
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Party Hosts Directory
CREATE TABLE IF NOT EXISTS public.admin_party_hosts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city TEXT NOT NULL,
    name TEXT NOT NULL,
    bio TEXT,
    profile_image_url TEXT,
    offerings JSONB, -- Array of offerings with prices
    contact_email TEXT,
    contact_phone TEXT,
    stripe_price_id TEXT, -- For payment integration
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accommodation Directory
CREATE TABLE IF NOT EXISTS public.admin_accommodations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT, -- 'airbnb', 'hotel', 'hostel'
    description TEXT,
    image_url TEXT,
    affiliate_link TEXT,
    price_range TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Travel Services (Flights, Airport, Mobility)
CREATE TABLE IF NOT EXISTS public.admin_travel_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city TEXT NOT NULL,
    service_type TEXT, -- 'flight', 'airport_service', 'mobility'
    provider_name TEXT NOT NULL,
    description TEXT,
    affiliate_link TEXT,
    coupon_code TEXT,
    promo_code TEXT,
    image_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Manual City Vibe Scores
CREATE TABLE IF NOT EXISTS public.admin_city_vibe_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city TEXT NOT NULL,
    week_start_date DATE NOT NULL,
    monday_score DECIMAL(3,1),
    tuesday_score DECIMAL(3,1),
    wednesday_score DECIMAL(3,1),
    thursday_score DECIMAL(3,1),
    friday_score DECIMAL(3,1),
    saturday_score DECIMAL(3,1),
    sunday_score DECIMAL(3,1),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(city, week_start_date)
);

-- App Admin Roles (extends user_profiles)
-- Add column to user_profiles: is_app_admin BOOLEAN DEFAULT FALSE
```

### 3.2 RLS Policies for New Tables

All admin content tables:
- **SELECT**: Public (all users can view)
- **INSERT/UPDATE/DELETE**: Only users with `is_app_admin = true`

---

## 4. Implementation Phases

### Phase 1: Repository Setup & Base Structure
- Create new GitHub repository: `kunajoto-lean`
- Clone kunajoto-fire- as base
- Update package.json and project metadata
- Configure environment variables for Supabase (same as kunajoto-fire-)
- Remove unnecessary files and dependencies

### Phase 2: Database Schema Extensions
- Create SQL migration scripts for new admin tables
- Add `is_app_admin` column to `user_profiles`
- Set up RLS policies for admin content
- Test database connectivity

### Phase 3: Authentication Flow Redesign
- Modify App.tsx to enforce auth after splash
- Remove preference onboarding flow
- Update splash screen to show brief cards
- Implement direct landing on Explore tab after auth
- Test auth flow end-to-end

### Phase 4: Explore Tab Redesign
- Design new Explore tab layout based on reference image
- Implement admin content display sections:
  - City Vibe Score (manual, no forecast)
  - Events of the Month
  - Best to Arrive On
  - Best to Stay In
  - Tour Guides & Party Hosts (with CTA buttons)
  - Accommodations
  - Travel Services
- Add responsive design for mobile
- Remove vibe score and forecast displays

### Phase 5: Admin Dashboard Development
- Create comprehensive admin CMS interface
- Implement CRUD operations for all content types
- Add location targeting dropdown (8 cities)
- Implement image upload functionality
- Add manual city vibe score entry form (weekly)
- Add Stripe integration fields for Tour Guides & Party Hosts

### Phase 6: Location Access Control
- Implement 8-city restriction logic
- Add out-of-range message display
- Implement manual city selection for trip planning
- Update map to reflect manual city selection
- Test geolocation and manual selection

### Phase 7: Profile Tab Updates
- Remove subscription panel
- Move preferences to settings section (no onboarding)
- Update profile UI to be cleaner
- Test profile functionality

### Phase 8: Stripe Payment Integration
- Set up Stripe test mode
- Create payment flow for Tour Guides
- Create payment flow for Party Hosts
- Test payment integration
- Add payment history to user profile

### Phase 9: Testing & Deployment
- End-to-end testing of all features
- Cross-browser testing
- Mobile responsiveness testing
- Deploy to Netlify (https://devtests-kunajoto.netlify.app/)
- Push all changes to GitHub in feature branches

### Phase 10: Documentation & Handoff
- Create comprehensive documentation
- Document admin dashboard usage
- Document database schema
- Create deployment guide
- Prepare final report

---

## 5. Key Technical Decisions

### 5.1 Shared Supabase Database
- ✅ Use same Supabase instance as kunajoto-fire-
- ✅ Same `venues` table (just hide vibe scores in UI)
- ✅ Same authentication system
- ✅ New tables for admin content (non-destructive)
- ✅ Both apps can coexist without conflicts

### 5.2 Code Simplification Strategy
- Remove AI-powered vibe score calculation
- Remove preference onboarding complexity
- Simplify state management (fewer states)
- Remove subscription logic
- Focus on admin-driven content display

### 5.3 Performance Optimization
- Lazy load admin content
- Cache city-specific data
- Optimize image loading
- Minimize API calls

---

## 6. Risk Mitigation

### 6.1 Database Conflicts
- **Risk**: Schema changes affecting kunajoto-fire-
- **Mitigation**: Only add new tables, don't modify existing ones

### 6.2 Authentication Issues
- **Risk**: Auth changes breaking kunajoto-fire-
- **Mitigation**: Use same auth system, no modifications

### 6.3 Deployment Conflicts
- **Risk**: Both apps using same Netlify URL
- **Mitigation**: Confirm separate deployment or use subdomain

---

## 7. Next Steps

1. ✅ Complete codebase analysis (DONE)
2. 🔄 Create kunajoto-lean repository
3. 🔄 Set up base project structure
4. 🔄 Implement database schema extensions
5. 🔄 Begin authentication flow redesign

---

**Analysis Complete. Ready to proceed with implementation.**

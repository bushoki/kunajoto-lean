# Kunajoto Lean

**Simplified, Admin-Driven Nightlife Discovery App**

Kunajoto Lean is a streamlined version of Kunajoto, focusing on admin-curated content and manual data entry rather than automated vibe score calculations. This version provides a lighter, more nimble user experience while maintaining the core nightlife discovery features.

---

## 🎯 Key Differences from Kunajoto-Fire-

| Feature | Kunajoto-Fire- | Kunajoto-Lean |
|---------|----------------|---------------|
| **Data Entry** | Automated (APIs, AI) | Manual (Admin-driven) |
| **Vibe Scores** | Displayed prominently | Hidden from users |
| **Vibe Forecasts** | 7-day predictions | Not displayed |
| **Onboarding** | Preference flow required | Brief splash → Auth → Explore |
| **Landing Tab** | Map tab | Explore tab |
| **Auth Flow** | Optional for guests | Mandatory after splash |
| **Location Coverage** | Global | 8 cities only |
| **Admin Dashboard** | Basic scoring editor | Comprehensive content CMS |

---

## 🌍 Supported Cities

Kunajoto Lean currently supports the following cities:

1. **London** 🇬🇧
2. **Johannesburg** 🇿🇦
3. **Cape Town** 🇿🇦
4. **Los Angeles** 🇺🇸
5. **Austin** 🇺🇸
6. **New York City** 🇺🇸
7. **Nairobi** 🇰🇪
8. **Kinshasa** 🇨🇩

Users outside these cities will be prompted to manually select a city for trip planning purposes.

---

## 🚀 Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS 4.1
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Mapping**: Google Maps API
- **Payment**: Stripe (Development Mode)
- **Deployment**: Netlify

---

## 📱 User Experience Flow

```
1. App Launch
   ↓
2. Splash Screen (brief onboarding cards)
   ↓
3. Auth Screen (Sign Up / Login) - MANDATORY
   ↓
4. Explore Tab (Landing page with admin-curated content)
   ↓
5. Bottom Nav: Explore | Map | CityGauge | Profile
```

---

## 🎨 Features

### For Users
- **Explore Tab**: Admin-curated content including:
  - Events of the Month
  - Best Days to Arrive
  - Recommended Neighborhoods
  - Local Tour Guides Directory
  - Local Party Hosts Directory
  - Accommodation Directory (Airbnb, Hotels)
  - Travel Services (Flights, Airport, Mobility)
  - Manual City Vibe Score (weekly)
  
- **Map Tab**: Interactive map with venue markers
- **CityGauge Tab**: City-specific insights
- **Profile Tab**: User settings and preferences (no subscription)

### For Admins
- **Comprehensive CMS Dashboard**:
  - Create/Edit/Delete all content types
  - Location targeting for 8 cities
  - Image upload functionality
  - Manual city vibe score entry (weekly)
  - Stripe integration for Tour Guides & Party Hosts
  - User management (appoint/revoke admin status)

---

## 🗄️ Database Schema

### Shared Tables (from Kunajoto-Fire-)
- `user_profiles` - User data with roles and preferences
- `venues` - Venue data (vibe scores hidden in UI)
- `favorites` - User favorite venues
- `plans` - User trip plans
- `reviews` - User reviews

### New Tables (Kunajoto-Lean Specific)
- `admin_events` - Events of the Month
- `admin_arrival_tips` - Best Days to Arrive
- `admin_stay_recommendations` - Best Neighborhoods
- `admin_tour_guides` - Tour Guides Directory
- `admin_party_hosts` - Party Hosts Directory
- `admin_accommodations` - Accommodation Directory
- `admin_travel_services` - Travel Services
- `admin_city_vibe_scores` - Manual City Vibe Scores (weekly)

---

## 🔐 Authentication & Roles

### User Roles
- **Guest (Reveller)**: Standard user with full app access after login
- **App Admin**: Can manage all content via admin dashboard
- **Super Admin**: BaseJump-configured admins who can appoint/revoke admin status

### Authentication Flow
- Uses Supabase Auth with PKCE flow
- Mandatory sign-up/login after splash screen
- Session persistence across app restarts
- Row Level Security (RLS) policies for data access

---

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- pnpm (preferred) or npm
- Supabase account (same as Kunajoto-Fire-)
- Google Maps API key
- Stripe account (test mode)

### Environment Variables

Create a `.env` file in the root directory:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### Installation

```bash
# Clone the repository
git clone https://github.com/bushoki/kunajoto-lean.git
cd kunajoto-lean

# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

---

## 🚢 Deployment

### Netlify Deployment

1. Connect your GitHub repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy from `main` branch
4. Development URL: https://devtests-kunajoto.netlify.app/

### Build Settings
- **Build command**: `pnpm build`
- **Publish directory**: `dist`
- **Node version**: 18+

---

## 📊 Database Migrations

Database schema extensions are located in `/migrations/kunajoto-lean-schema.sql`

To apply migrations:

```bash
# Using Supabase CLI
supabase db push

# Or manually execute SQL in Supabase Dashboard
```

---

## 🧪 Testing

```bash
# Run tests (coming soon)
pnpm test

# E2E tests (coming soon)
pnpm test:e2e
```

---

## 📝 Admin Dashboard Access

To access the admin dashboard:

1. Log in with an admin account
2. Navigate to Profile tab
3. Click "Admin Dashboard" button (only visible to admins)

Super admins can appoint new admins via the BaseJump interface in Supabase.

---

## 🔄 Git Workflow

All development work is done in feature branches:

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: your feature description"

# Push to GitHub
git push origin feature/your-feature-name

# Create Pull Request on GitHub
```

**Main branch** is protected and requires PR approval.

---

## 📚 Documentation

- [Codebase Analysis](/docs/kunajoto-lean-analysis.md)
- [Database Schema](/migrations/kunajoto-lean-schema.sql)
- [Admin Dashboard Guide](/docs/admin-dashboard-guide.md) (coming soon)
- [Deployment Guide](/docs/deployment-guide.md) (coming soon)

---

## 🤝 Contributing

This is a private project. For questions or issues, contact the project maintainer.

---

## 📄 License

Proprietary - All Rights Reserved

---

## 🔗 Links

- **Production URL**: https://devtests-kunajoto.netlify.app/
- **GitHub Repository**: https://github.com/bushoki/kunajoto-lean
- **Supabase Dashboard**: [Your Supabase Project URL]

---

## 📞 Support

For support, contact: catalystcongo@gmail.com

---

**Built with ❤️ for the nightlife community**

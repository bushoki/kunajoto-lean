# Explore Tab Redesign - Kunajoto Lean

## Date: January 15, 2026

---

## Overview

This document outlines the redesign of the Explore tab for Kunajoto Lean, transforming it from a simple recommendation view to a comprehensive, admin-curated content hub.

---

## Design Reference Analysis

Based on the provided reference image, the Explore tab should include:

### 1. City Header
- **Large city name** at the top (e.g., "JOHANNESBURG")
- Clean, bold typography
- Subtle shadow/reflection effect

### 2. City Vibe Score Card (Modified for Lean)
- **Manual score display** (entered by admins weekly)
- Score out of 10 (e.g., "6.1 out of 10")
- Trend indicator (e.g., "STABLE")
- **NO 7-day forecast** (removed for Lean version)
- **NO venue breakdown** (Hot/Popping/Warming/Dead - removed)
- Simple, clean card design

### 3. Quick Info Section
- **Events this Month**: Comma-separated list of events
- **Best to arrive on**: Day/time recommendations
- **Best to stay in**: Neighborhood recommendations

### 4. Action Cards Grid (2x2)
- **Top Left**: Flight & Airport Services
  - Icon: Airplane
  - Partner logos (e.g., Uber)
  - CTA: "BOOK A FLIGHT, PRE-BOOK AIRPORT PICKUP & MORE"
  
- **Top Right**: Tour Guides
  - Background image of local landmarks
  - CTA: "EXPLORE LOCAL SITES WITH OUR AWARD-WINNING TOUR GUIDES!"
  
- **Bottom Left**: Accommodations
  - Partner logos (Airbnb, Booking.com)
  - CTA: "STAY AT CAREFULLY VETTED AIRBNBs & HOTELS"
  
- **Bottom Right**: Party Hosts
  - Background image with party theme
  - CTA: "PARTY LIKE A LOCAL WITH OUR EXPERIENCED HOSTS!"

### 5. Bottom Ticker
- Weather or event alerts
- Blue background
- Scrolling text

---

## New Explore Tab Structure

### Layout Hierarchy

```
┌─────────────────────────────────────┐
│         CITY NAME (Large)           │
├─────────────────────────────────────┤
│                                     │
│   City Vibe Score Card (Manual)    │
│   - Score: X.X / 10                 │
│   - Trend: STABLE/RISING/FALLING    │
│                                     │
├─────────────────────────────────────┤
│                                     │
│   ◆ Events this Month:              │
│     Event 1, Event 2, Event 3...    │
│                                     │
│   ◆ Best to arrive on:              │
│     Thursday, Stay until Monday     │
│                                     │
│   ◆ Best to stay in:                │
│     Neighborhood 1, Neighborhood 2  │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────┬─────────┐              │
│  │ Flight  │  Tour   │              │
│  │ & Air-  │ Guides  │              │
│  │ port    │         │              │
│  └─────────┴─────────┘              │
│  ┌─────────┬─────────┐              │
│  │ Accom-  │ Party   │              │
│  │ moda-   │ Hosts   │              │
│  │ tions   │         │              │
│  └─────────┴─────────┘              │
│                                     │
└─────────────────────────────────────┘
```

---

## Component Structure

### ExploreTab.tsx (Redesigned)

```typescript
interface ExploreTabProps {
  locationName: string;
  isAuthenticated: boolean;
  onVenueSelect: (venue: Venue) => void;
}
```

### New Data Services

```typescript
// Fetch admin-curated content for a specific city
dataService.fetchCityEvents(city: string)
dataService.fetchArrivalTips(city: string)
dataService.fetchStayRecommendations(city: string)
dataService.fetchTourGuides(city: string)
dataService.fetchPartyHosts(city: string)
dataService.fetchAccommodations(city: string)
dataService.fetchTravelServices(city: string)
dataService.fetchCityVibeScore(city: string)
```

---

## Removed Features (vs. kunajoto-fire-)

❌ **7-Day Vibe Forecast** - No longer displayed
❌ **Venue Breakdown** (Hot/Popping/Warming/Dead) - Removed
❌ **Automated Vibe Calculation** - Replaced with manual entry
❌ **My Plans Section** - Moved to Plans tab
❌ **Recommended Venues Grid** - Simplified or removed

---

## New Features (Kunajoto Lean)

✅ **Manual City Vibe Score** - Admin-entered weekly
✅ **Events of the Month** - Admin-curated event list
✅ **Arrival Tips** - Best days/times to arrive
✅ **Stay Recommendations** - Best neighborhoods
✅ **Tour Guides Directory** - With offerings and booking
✅ **Party Hosts Directory** - With offerings and booking
✅ **Accommodations Directory** - Affiliate-linked hotels/Airbnbs
✅ **Travel Services** - Flights, airport, mobility with coupons
✅ **Location Targeting** - Content specific to 8 cities

---

## Responsive Design Considerations

### Mobile (< 640px)
- Single column layout
- Action cards stack vertically (1 column)
- City name font size: 32px
- Vibe score card: Full width

### Tablet (640px - 1024px)
- 2-column action cards grid
- City name font size: 40px
- Comfortable spacing

### Desktop (> 1024px)
- 2-column action cards grid
- City name font size: 48px
- Max width: 1200px, centered

---

## Color Scheme

Based on reference image:

- **Primary Orange**: `#FF6B35` (action cards, CTAs)
- **Secondary Orange**: `#FF8C5A` (hover states)
- **Dark Text**: `#1F2937` (headings)
- **Gray Text**: `#6B7280` (body text)
- **Light Background**: `#F9FAFB` (page background)
- **Card Background**: `#FFFFFF` (white cards)
- **Ticker Blue**: `#1E3A8A` (bottom ticker)

---

## Typography

- **City Name**: 48px, Bold, Uppercase
- **Section Titles**: 18px, Semibold
- **Body Text**: 14px, Regular
- **Card CTAs**: 14px, Bold, Uppercase

---

## Implementation Steps

### Step 1: Create Data Service Functions
- Add functions to fetch admin content from new tables
- Implement city-based filtering
- Add error handling

### Step 2: Update ExploreTab Component
- Remove old recommendation logic
- Add city header
- Implement manual vibe score display
- Add quick info section (events, arrival, stay)
- Create action cards grid

### Step 3: Create Action Card Components
- FlightServicesCard
- TourGuidesCard
- AccommodationsCard
- PartyHostsCard

### Step 4: Implement Click Handlers
- Navigate to detail views
- Open external affiliate links
- Show booking modals for Tour Guides & Party Hosts

### Step 5: Add Location Restriction Logic
- Check if user's city is in the 8 target cities
- Show appropriate message if not
- Allow manual city selection

### Step 6: Responsive Styling
- Mobile-first approach
- Tailwind CSS responsive classes
- Test on multiple screen sizes

---

## API Integration Points

### Supabase Queries

```sql
-- Get city events
SELECT * FROM admin_events 
WHERE city = $1 
ORDER BY event_date ASC;

-- Get arrival tips
SELECT * FROM admin_arrival_tips 
WHERE city = $1 
ORDER BY display_order ASC;

-- Get stay recommendations
SELECT * FROM admin_stay_recommendations 
WHERE city = $1 AND is_featured = true 
ORDER BY display_order ASC;

-- Get current week's vibe score
SELECT * FROM admin_city_vibe_scores 
WHERE city = $1 
AND week_start_date <= CURRENT_DATE 
AND week_start_date > CURRENT_DATE - INTERVAL '7 days'
LIMIT 1;
```

---

## Testing Checklist

- [ ] City name displays correctly
- [ ] Manual vibe score loads from database
- [ ] Events list displays (comma-separated)
- [ ] Arrival tips display correctly
- [ ] Stay recommendations display correctly
- [ ] Action cards render in 2x2 grid
- [ ] Action cards are clickable
- [ ] Responsive layout works on mobile
- [ ] Responsive layout works on tablet
- [ ] Responsive layout works on desktop
- [ ] Location restriction works for non-target cities
- [ ] Manual city selection works
- [ ] Loading states display properly
- [ ] Error states display properly
- [ ] No vibe forecast is shown
- [ ] No venue breakdown is shown

---

## Next Steps

1. ✅ Create implementation notes (DONE)
2. 🔄 Update dataService.ts with new functions
3. 🔄 Redesign ExploreTab.tsx component
4. 🔄 Create action card components
5. 🔄 Implement location restriction logic
6. 🔄 Test responsive design
7. 🔄 Push changes to feature branch

---

**Implementation Status: In Progress**

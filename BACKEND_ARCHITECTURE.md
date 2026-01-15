
# Kunajoto Backend Architecture Strategy

This document details the technical requirements to make the **Kunajoto** frontend fully functional. It compares two viable paths: **Supabase (Recommended)** and **Firebase**.

---

## 1. Core Requirements (The "Engine")

To enable Real-time Vibe Scores, Forecasts, and User Data, the backend must perform these tasks:

### A. Data Ingestion Pipeline
*   **Task:** Fetch venue data (Google Places, Yelp, Eventbrite) on a schedule.
*   **Challenge:** API keys must be hidden server-side. Data must be normalized to a single "Venue" schema.
*   **Frequency:** High Vibe areas = Every 15 mins. Low Vibe areas = Every 2 hours.

### B. Vibe Scoring Algorithm
*   **Input:** Check-ins, Event Capacity, Review Recency, Historical Averages.
*   **Process:** Weighted algorithm running on the server.
*   **Output:** A score (0-100) stored in the DB.

### C. The "Real-time" Link
*   **Requirement:** When the score changes on the server, the App Map must update *instantly* without the user refreshing.

---

## 2. Option A: Supabase (The "SQL Powerhouse") - RECOMMENDED

Supabase is the best fit for Kunajoto due to its PostGIS (Geospatial) support and SQL relational power.

### Architecture
1.  **Database:** PostgreSQL.
    *   *Why?* You need to query: "Find all venues within 5km of User X". PostgreSQL has **PostGIS**, the industry standard for this.
2.  **Compute:** Supabase Edge Functions (Deno/TypeScript).
3.  **Realtime:** Supabase Realtime (Broadcasts DB changes to Flutter/React).

### Implementation Plan

#### Step 1: Database Schema (SQL)
```sql
-- Enable PostGIS for map queries
create extension postgis;

create table venues (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  location geography(POINT), -- The magic field for maps
  vibe_score float, -- 0-100
  last_updated timestamp
);

create table checkins (
  id uuid primary key,
  user_id uuid references auth.users,
  venue_id uuid references venues,
  created_at timestamp default now()
);
```

#### Step 2: Edge Functions (The Logic)
Create a function `ingest-google-places`:
```typescript
// Supabase Edge Function
serve(async (req) => {
  // 1. Fetch from Google API
  const places = await fetchGooglePlaces(lat, lng, API_KEY);
  
  // 2. Calculate Vibe Score
  const score = calculateVibe(places.rating, places.user_ratings_total);
  
  // 3. Upsert to Database
  const { data, error } = await supabase
    .from('venues')
    .upsert({ name: places.name, vibe_score: score })
});
```

#### Step 3: Realtime Subscription (Frontend)
In `MapContainer.tsx`:
```typescript
supabase
  .channel('public:venues')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'venues' }, (payload) => {
    updateVenueOnMap(payload.new); // Instant Pulse Update
  })
  .subscribe();
```

---

## 3. Option B: Firebase (The "NoSQL Rapid Scale")

Good if you want extremely fast setup and are willing to sacrifice complex relational queries.

### Architecture
1.  **Database:** Firestore (NoSQL).
    *   *Limitation:* Geo-queries are harder. You often need a helper library like `Geofire` to find "venues near me".
2.  **Compute:** Cloud Functions (Node.js).
3.  **Realtime:** Firestore Listeners (Native).

### Implementation Plan

#### Step 1: Data Structure (NoSQL)
Collections:
*   `venues/{venueId}` -> `{ name: "Club X", lat: 40.1, lng: -74.0, vibeScore: 85 }`
*   `users/{userId}/preferences`

#### Step 2: Cloud Functions (The Logic)
```javascript
// Firebase Cloud Function (Scheduled Trigger)
exports.updateVibeScores = onSchedule("every 15 minutes", async (event) => {
   const venues = await getVenuesList();
   // ... logic similar to Supabase ...
   await db.collection('venues').doc(id).update({ vibeScore: newScore });
});
```

#### Step 3: Frontend Listener
```javascript
import { onSnapshot, collection } from "firebase/firestore";

onSnapshot(collection(db, "venues"), (snapshot) => {
   const venues = snapshot.docs.map(doc => doc.data());
   setVenues(venues); // React State Update
});
```

---

## 4. Summary Recommendation

| Feature | Supabase (SQL) | Firebase (NoSQL) |
| :--- | :--- | :--- |
| **Geo-Location Queries** | **Excellent** (PostGIS is native and fast) | **Fair** (Requires Geohashing workarounds) |
| **Complex Data** | **Great** (Relational tables for bookings, reviews) | **Hard** (NoSQL joins are difficult) |
| **Realtime** | Good (Broadcasts) | **Excellent** (Native Sync) |
| **Cost** | Predictable (Open Source based) | Scales with usage (Can get expensive) |

**Verdict:** Use **Supabase**.
The "Map-Centric" nature of Kunajoto requires robust Geospatial queries ("Show me venues in this radius"). PostGIS in Supabase handles this natively with milliseconds latency. Firebase requires complex workarounds for radius searches.

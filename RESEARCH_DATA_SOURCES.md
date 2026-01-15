# Alternative Data Sources Research
**Date**: December 12, 2025  
**Purpose**: Research alternative nightlife data APIs and graceful degradation strategies

---

## 1. EVENTBRITE API

### Capabilities:
✅ **Events by location** - Can search events by city/coordinates  
✅ **Event categories** - Filter by nightlife, music, entertainment  
✅ **Venue information** - Venue name, address, capacity  
✅ **Event timing** - Start/end times, recurring events  
✅ **Ticket sales data** - Can indicate popularity  
✅ **Free API key** - Easy to get started  

### Limitations:
⚠️ **Only covers ticketed events** - Misses walk-in bars/clubs  
⚠️ **Not real-time** - Events are scheduled, not live  
⚠️ **Limited to Eventbrite users** - Not comprehensive  

### Use for Kunajoto:
- **Event density calculation** (high event count = higher vibe)
- **Scheduled events** (concerts, DJ nights boost vibe)
- **Venue popularity** (ticket sales as signal)

### API Endpoints:
```
GET /events/search/?location.address={city}&categories=103
GET /events/{id}/
GET /venues/{id}/
```

**Status**: ✅ **Recommended** - Good for event density component

---

## 2. YELP FUSION API

### Capabilities:
✅ **Business search by location** - Bars, clubs, lounges  
✅ **Reviews and ratings** - User sentiment  
✅ **Check-in data** - Popularity signals  
✅ **Price level** - $ to $$$$  
✅ **Hours of operation** - Open now status  
✅ **Photos** - Venue images  
✅ **Categories** - Nightlife, bars, dance clubs  

### Limitations:
⚠️ **Rate limits** - 500 calls/day (free tier)  
⚠️ **No real-time crowd data** - Reviews are historical  
⚠️ **US-centric** - Better coverage in US than international  

### Use for Kunajoto:
- **Venue metadata** (name, address, type, price)
- **User ratings** (4.5+ stars = higher base score)
- **Review velocity** (recent reviews = active venue)
- **Check-in counts** (popularity signal)

### API Endpoints:
```
GET /businesses/search?term=nightlife&location={city}
GET /businesses/{id}
GET /businesses/{id}/reviews
```

**Status**: ✅ **Recommended** - Essential for venue metadata

---

## 3. FACEBOOK EVENTS API

### Capabilities:
⚠️ **Deprecated for public use** - No longer available  
⚠️ **Requires Page ownership** - Can only manage own events  
❌ **Cannot search public events by location** - API removed in 2018  

### Workarounds:
- **Web scraping** (violates TOS, unreliable)
- **Manual curation** (not scalable)
- **User-submitted events** (requires user base)

**Status**: ❌ **NOT RECOMMENDED** - API no longer public

---

## 4. FOURSQUARE PLACES API

### Capabilities:
✅ **Venue search by location** - Comprehensive POI database  
✅ **Check-in data** - Historical popularity  
✅ **Tips and reviews** - User sentiment  
✅ **Venue categories** - Nightlife, bars, clubs  
✅ **Trending venues** - Popularity signals  
✅ **Hours and menus** - Venue details  

### Limitations:
⚠️ **Check-ins declining** - Less active than peak years  
⚠️ **Paid tiers** - Free tier has limits  
⚠️ **No real-time crowd** - Historical data only  

### Use for Kunajoto:
- **Venue discovery** (comprehensive database)
- **Historical popularity** (check-in trends)
- **Venue categorization** (nightlife types)
- **Fuzzy matching** (link venues across sources)

### API Endpoints:
```
GET /places/search?near={city}&categories=10032
GET /places/{id}
GET /places/{id}/tips
```

**Status**: ✅ **Recommended** - Good for venue discovery

---

## 5. GOOGLE PLACES API (ALREADY INTEGRATED)

### Current Usage:
✅ **Already implemented** in foursquare-ingestion function  
✅ **14 cities configured**  
✅ **Venue metadata** (name, address, photos, ratings)  

### Capabilities:
✅ **Comprehensive venue database** - Best coverage globally  
✅ **User ratings** - 1-5 stars  
✅ **Price level** - 0-4 scale  
✅ **Opening hours** - Open now status  
✅ **Popular times** - Historical crowd patterns  
✅ **Photos** - Venue images  

### Limitations:
⚠️ **No real-time crowd data** - Popular times are historical  
⚠️ **Expensive** - $17 per 1000 requests (after free tier)  
⚠️ **Rate limits** - Need to manage quota  

### Enhancements Needed:
- **Popular Times API** - Extract historical crowd patterns
- **Place Details** - Get full venue information
- **Nearby Search** - Venue density calculation

**Status**: ✅ **Keep and enhance** - Foundation of data pipeline

---

## 6. WEATHER APIs

### Options:
1. **OpenWeatherMap** (Free tier: 1000 calls/day)
2. **WeatherAPI.com** (Free tier: 1M calls/month)
3. **Tomorrow.io** (Free tier: 500 calls/day)

### Capabilities:
✅ **Current weather** - Temperature, precipitation  
✅ **Hourly forecast** - Next 48 hours  
✅ **Weather alerts** - Storms, extreme conditions  
✅ **Historical data** - Past weather patterns  

### Use for Kunajoto:
- **Vibe adjustment** - Rain/cold = lower outdoor vibe
- **Forecast context** - "Rooftop may close due to rain"
- **Seasonal patterns** - Summer vs winter vibes

**Status**: ✅ **Recommended** - Easy to integrate

---

## 7. ALTERNATIVE/EMERGING SOURCES

### A. Social Media APIs (Limited)
- **Instagram Graph API** - Requires business account, limited hashtag search
- **Twitter API** - Expensive ($100/month), limited free tier
- **TikTok API** - No public venue search

**Status**: ❌ **Not viable** for MVP

### B. Foot Traffic Data (Expensive)
- **SafeGraph** - $1000+/month, US-only
- **Placer.ai** - Enterprise pricing
- **Unacast** - Enterprise pricing

**Status**: ❌ **Too expensive** for MVP

### C. Ticketing Platforms
- **Ticketmaster API** - Events and venues
- **Dice.fm** - Electronic music events
- **Resident Advisor** - No public API

**Status**: ⚠️ **Consider for Phase 2**

### D. Local Government APIs
- **Liquor license databases** - Venue discovery
- **Business registrations** - Venue metadata
- **Noise complaints** - Negative signal

**Status**: ⚠️ **Too complex** for MVP

---

## 8. RECOMMENDED DATA STACK FOR KUNAJOTO

### MVP (Phase 1-2): Single Source + Enhancements
```
1. Google Places API (already integrated)
   - Venue discovery
   - Ratings and reviews
   - Popular times (historical)
   - Price level
   
2. OpenWeatherMap API (new)
   - Weather adjustments
   - Forecast context
   
3. Gemini AI (new)
   - Contextual interpretation
   - External search grounding
```

**Rationale**:
- ✅ **Fastest to implement** (Google already working)
- ✅ **Best global coverage** (14 cities)
- ✅ **Lowest cost** (Google free tier: $200/month credit)
- ✅ **Sufficient for real vibe scores** (vs current random)

### Phase 2: Add Event Density
```
4. Eventbrite API (new)
   - Event density calculation
   - Scheduled events boost
```

### Phase 3: Multi-Source Fusion
```
5. Yelp Fusion API (new)
   - Cross-validation
   - Review velocity
   
6. Foursquare Places API (new)
   - Venue linking
   - Historical trends
```

---

## 9. GRACEFUL DEGRADATION STRATEGY

### If API calls fail:

**Level 1: Single source failure**
```
Google fails → Use cached data + confidence penalty
Eventbrite fails → Skip event density component
Weather fails → Use default seasonal adjustment
```

**Level 2: Multiple source failures**
```
2+ sources fail → Use cached scores with "Outdated" label
All sources fail → Show last known scores with warning
```

**Level 3: Gemini AI timeout**
```
Gemini timeout (>3s) → Use deterministic score only
Gemini error → Retry once, then use deterministic
```

### Confidence labeling:
```
All sources fresh → "Hot" (90-100)
1 source stale → "Popping" (70-89)
2+ sources stale → "Warming" (40-69)
All sources stale → "Dead" (0-39) + "Data outdated" warning
```

---

## 10. COST ANALYSIS (MVP)

### Monthly API costs (assuming 10,000 users):

**Google Places API**:
- Venue search: 10,000 requests/day × $17/1000 = $170/day
- Free tier: $200/month credit
- **Net cost**: ~$5,000/month (after free tier)

**OpenWeatherMap**:
- Weather calls: 1,000 requests/day
- Free tier: 1,000 calls/day
- **Net cost**: $0/month

**Gemini AI**:
- Vibe interpretation: 10,000 requests/day × $0.00025/request
- **Net cost**: $75/month

**Total MVP cost**: ~$5,075/month

### Cost optimization strategies:
1. **Cache aggressively** - Update venues every 15 min, not per request
2. **Batch requests** - Combine nearby venues
3. **Use free tiers** - Stay under Google's $200/month credit initially
4. **Lazy loading** - Only calculate vibe for viewed venues

**Optimized cost**: ~$500/month (with caching)

---

## 11. IMPLEMENTATION PRIORITY

### Phase 1 (MVP): Google + Weather + Gemini
**Effort**: 2-3 days  
**Cost**: ~$500/month  
**Value**: Real vibe scores, 7-day forecasts  

### Phase 2: Add Eventbrite
**Effort**: 1 day  
**Cost**: +$0/month (free tier)  
**Value**: Event density boost  

### Phase 3: Add Yelp + Foursquare
**Effort**: 2 days  
**Cost**: +$100/month  
**Value**: Cross-validation, better accuracy  

---

## NEXT STEPS

1. ✅ **Confirm MVP scope** (Google + Weather + Gemini only)
2. ✅ **Set up API keys** (OpenWeatherMap, Gemini)
3. ✅ **Enhance existing Google Places function**
4. ✅ **Implement deterministic base score**
5. ✅ **Add Gemini AI interpretation**
6. ✅ **Create 7-day forecast**


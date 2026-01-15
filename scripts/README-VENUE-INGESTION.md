# Global Venue Ingestion System

Automated system for fetching and updating nightlife venue data from Google Places API for 520+ cities worldwide.

## Overview

The venue ingestion system ensures the Kunajoto app always has fresh, up-to-date venue data regardless of where users travel. It fetches venues from Google Places API and updates the Supabase database automatically.

### Coverage

- **520+ cities** across all continents
- **North America:** 100 cities (USA, Canada, Mexico)
- **South America:** 80 cities (Brazil, Argentina, Colombia, Peru, Chile)
- **Europe:** 120 cities (UK, France, Germany, Spain, Italy, Netherlands, Belgium, Austria)
- **Africa:** 60 cities (Egypt, Nigeria, South Africa, DR Congo, Kenya, Ghana, Morocco, Ethiopia)
- **Asia:** 100 cities (Japan, South Korea, China, India, Thailand, Singapore, Malaysia, Philippines)
- **Middle East:** 40 cities (UAE, Saudi Arabia, Israel, Turkey, Iran)
- **Oceania:** 20 cities (Australia, New Zealand)

## Features

✅ **Batch Processing** - Process cities in configurable batches  
✅ **Rate Limiting** - Respects Google API quotas (150ms between requests)  
✅ **Incremental Updates** - Upserts existing venues, adds new ones  
✅ **Error Handling** - Continues processing even if some cities fail  
✅ **Progress Tracking** - Real-time console output with progress indicators  
✅ **Automated Scheduling** - Runs every 3 days via GitHub Actions  

## Manual Usage

### Process All Cities

```bash
npm run ingest-venues
```

### Process Specific Batch

```bash
# Process first 50 cities
npm run ingest-venues -- --limit=50

# Process cities 100-150
npm run ingest-venues -- --offset=100 --limit=50

# Process next batch after previous run
npm run ingest-venues -- --offset=150 --limit=50
```

### Environment Variables Required

```bash
GOOGLE_API_KEY=your_google_api_key
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Automated Scheduling

The system runs automatically every 3 days via GitHub Actions workflow (`.github/workflows/update-venues.yml`).

### Workflow Features

- **Scheduled Runs:** Every 3 days at 2 AM UTC
- **Manual Trigger:** Can be triggered manually from GitHub Actions tab
- **Parallel Processing:** Processes cities in 6 parallel batches (100 cities each)
- **Logs:** Uploads ingestion logs as artifacts for debugging

### Manual Trigger

1. Go to GitHub repository → Actions tab
2. Select "Update Global Venues" workflow
3. Click "Run workflow"
4. (Optional) Specify custom offset/limit
5. Click "Run workflow" button

## How It Works

### 1. City List

The `global-cities.ts` file contains a comprehensive list of 520 major cities organized by region.

### 2. Google Places API

For each city, the script queries:
```
https://maps.googleapis.com/maps/api/place/textsearch/json?query=nightlife+in+{city}&type=bar|night_club|restaurant
```

### 3. Data Transformation

Each venue is transformed to match the Supabase schema:
- `id`: Google Place ID
- `name`: Venue name
- `type`: Primary type (bar, night_club, restaurant)
- `image_url`: Photo from Google Places
- `latitude`, `longitude`: GPS coordinates
- `vibe_score`: Initial score (50-99)
- `vibe_confidence`: Hot/Popping/Warming/Dead
- `district`: Vicinity or formatted address
- `city`: City name for filtering
- `price_level`: 1-4 scale from Google

### 4. Supabase Upsert

Venues are upserted to the `venues` table:
- **New venues:** Inserted with all data
- **Existing venues:** Updated with latest data
- **Conflict resolution:** Uses `id` (place_id) as unique key

## Monitoring

### Check Ingestion Status

```sql
-- Total venues by city
SELECT city, COUNT(*) as venue_count 
FROM venues 
GROUP BY city 
ORDER BY venue_count DESC;

-- Recently added venues
SELECT city, name, created_at 
FROM venues 
ORDER BY created_at DESC 
LIMIT 20;

-- Cities with no venues
SELECT city 
FROM (SELECT UNNEST(ARRAY['New York', 'London', ...]) as city) cities
WHERE city NOT IN (SELECT DISTINCT city FROM venues);
```

### GitHub Actions Logs

1. Go to repository → Actions tab
2. Click on latest "Update Global Venues" run
3. View logs for each batch
4. Download artifacts for detailed logs

## Troubleshooting

### API Quota Exceeded

**Error:** `OVER_QUERY_LIMIT`

**Solution:**
- Reduce batch size: `--limit=25`
- Increase rate limit delay in script (line 66)
- Wait 24 hours for quota reset

### Supabase Connection Error

**Error:** `Failed to connect to Supabase`

**Solution:**
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Verify service role key has write permissions to `venues` table
- Check Supabase project is not paused

### No Venues Found

**Error:** `ZERO_RESULTS` for multiple cities

**Solution:**
- Verify city names are spelled correctly
- Try alternative city names (e.g., "New York City" vs "New York")
- Check Google Places API is enabled in Google Cloud Console

## Cost Estimation

### Google Places API

- **Text Search:** $32 per 1000 requests
- **Photo:** $7 per 1000 requests

**Per Run (520 cities):**
- Text Search: 520 requests × $0.032 = **$16.64**
- Photos: ~5000 venues × $0.007 = **$35.00**
- **Total per run: ~$51.64**

**Monthly (10 runs):**
- **~$516.40**

### Optimization Tips

1. Cache venue photos instead of fetching URLs each time
2. Only update venues that haven't been updated in 7+ days
3. Use Nearby Search instead of Text Search ($17/1000 vs $32/1000)
4. Implement incremental updates based on last_updated timestamp

## Future Enhancements

- [ ] Implement venue update frequency based on popularity
- [ ] Add venue verification (check if still open)
- [ ] Fetch additional details (hours, reviews, ratings)
- [ ] Implement smart caching to reduce API costs
- [ ] Add webhook notifications for ingestion completion
- [ ] Create admin dashboard for monitoring ingestion status
- [ ] Add support for custom city lists per region
- [ ] Implement A/B testing for different search queries

## Support

For issues or questions:
1. Check GitHub Actions logs
2. Review Supabase logs
3. Contact development team

---

Last updated: December 2025

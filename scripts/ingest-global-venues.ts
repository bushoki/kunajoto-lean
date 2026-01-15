/**
 * Global Venue Ingestion Script
 * 
 * Fetches nightlife venues from Google Places API for 520+ cities worldwide
 * and updates the Supabase venues table.
 * 
 * Features:
 * - Batch processing with configurable batch size
 * - Rate limiting to respect API quotas
 * - Incremental updates (upsert existing venues)
 * - Progress tracking and error handling
 * - Can be scheduled to run every 2-3 days
 * 
 * Usage:
 *   npm run ingest-venues              # Process all cities
 *   npm run ingest-venues -- --batch=50  # Process 50 cities
 *   npm run ingest-venues -- --offset=100 --limit=50  # Process cities 100-150
 */

import { createClient } from '@supabase/supabase-js';
import { GLOBAL_CITIES } from './global-cities';

// Configuration
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.VITE_GOOGLE_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GOOGLE_API_KEY) {
  console.error('❌ GOOGLE_API_KEY not found in environment variables');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase credentials not found in environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface Venue {
  id: string;
  name: string;
  type: string | null;
  image_url: string | null;
  latitude: number;
  longitude: number;
  vibe_score: number | null;
  vibe_confidence: string | null;
  vibe_trend: string | null;
  district: string | null;
  description: string | null;
  price_level: number | null;
  is_promoted: boolean;
  city: string;
}

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name: string, defaultValue: number): number => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? parseInt(arg.split('=')[1]) : defaultValue;
};

const BATCH_SIZE = getArg('batch', 50); // Process 50 cities per run by default
const OFFSET = getArg('offset', 0);
const LIMIT = getArg('limit', BATCH_SIZE);
const RATE_LIMIT_MS = 150; // 150ms between requests (400 requests/minute max)

// Helper function to get vibe confidence label
function getVibeConfidenceLabel(score: number): string {
  if (score >= 90) return 'Hot';
  if (score >= 70) return 'Popping';
  if (score >= 40) return 'Warming';
  return 'Dead';
}

// Transform Google Places result to Venue
function transformGooglePlaceVenue(place: any, city: string): Venue {
  const vibeScore = Math.floor(Math.random() * 50) + 50; // Mock 50-99 for now
  const vibeConfidence = getVibeConfidenceLabel(vibeScore);

  return {
    id: place.place_id,
    name: place.name,
    type: place.types?.[0] || null,
    image_url: place.photos?.[0]?.photo_reference 
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
      : null,
    latitude: place.geometry.location.lat,
    longitude: place.geometry.location.lng,
    vibe_score: vibeScore,
    vibe_confidence: vibeConfidence,
    vibe_trend: 'Stable',
    district: place.vicinity || place.formatted_address || null,
    description: place.name,
    price_level: place.price_level || null,
    is_promoted: false,
    city: city,
  };
}

// Fetch venues for a single city
async function fetchVenuesForCity(city: string): Promise<Venue[]> {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=nightlife+in+${encodeURIComponent(city)}&key=${GOOGLE_API_KEY}&type=bar|night_club|restaurant`;
  
  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
  }

  if (data.status === 'ZERO_RESULTS') {
    return [];
  }

  return data.results.map((place: any) => transformGooglePlaceVenue(place, city));
}

// Main ingestion function
async function ingestVenues() {
  console.log('🌍 Global Venue Ingestion Script');
  console.log('================================\n');
  console.log(`📊 Total cities in database: ${GLOBAL_CITIES.length}`);
  console.log(`🎯 Processing cities ${OFFSET} to ${OFFSET + LIMIT}`);
  console.log(`⏱️  Rate limit: ${RATE_LIMIT_MS}ms between requests\n`);

  const citiesToProcess = GLOBAL_CITIES.slice(OFFSET, OFFSET + LIMIT);
  
  let totalVenuesIngested = 0;
  let successfulCities = 0;
  let failedCities: string[] = [];

  for (let i = 0; i < citiesToProcess.length; i++) {
    const city = citiesToProcess[i];
    const progress = `[${i + 1}/${citiesToProcess.length}]`;

    try {
      console.log(`${progress} 🔍 Fetching venues for ${city}...`);
      
      // Fetch venues from Google Places API
      const venues = await fetchVenuesForCity(city);
      
      if (venues.length === 0) {
        console.log(`${progress} ⚠️  No venues found for ${city}`);
        continue;
      }

      // Upsert venues to Supabase
      const { data, error } = await supabase
        .from('venues')
        .upsert(venues, { onConflict: 'id', ignoreDuplicates: false });

      if (error) {
        throw error;
      }

      totalVenuesIngested += venues.length;
      successfulCities++;
      console.log(`${progress} ✅ Ingested ${venues.length} venues for ${city}`);

      // Rate limiting
      if (i < citiesToProcess.length - 1) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS));
      }

    } catch (error: any) {
      console.error(`${progress} ❌ Error processing ${city}:`, error.message);
      failedCities.push(city);
    }
  }

  // Summary
  console.log('\n================================');
  console.log('📈 Ingestion Summary');
  console.log('================================');
  console.log(`✅ Successful cities: ${successfulCities}/${citiesToProcess.length}`);
  console.log(`🏢 Total venues ingested: ${totalVenuesIngested}`);
  console.log(`❌ Failed cities: ${failedCities.length}`);
  
  if (failedCities.length > 0) {
    console.log('\nFailed cities:', failedCities.join(', '));
  }

  // Next batch suggestion
  const nextOffset = OFFSET + LIMIT;
  if (nextOffset < GLOBAL_CITIES.length) {
    console.log(`\n💡 To process the next batch, run:`);
    console.log(`   npm run ingest-venues -- --offset=${nextOffset} --limit=${LIMIT}`);
  } else {
    console.log('\n🎉 All cities processed!');
  }
}

// Run the ingestion
ingestVenues()
  .then(() => {
    console.log('\n✅ Ingestion completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

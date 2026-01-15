/**
 * Kunajoto Backend Endpoint Test Suite
 * 
 * This script tests all Supabase endpoints to verify backend integration
 * Run with: npx tsx test-endpoints.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Environment variables (will be set in .env)
// Note: For Node.js scripts, we use non-VITE_ prefixed vars
// For frontend, Vite requires VITE_ prefix
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

// Test user credentials
const TEST_EMAIL = 'test-' + Date.now() + '@kunajoto.test';
const TEST_PASSWORD = 'TestPassword123!';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

function logTest(name: string, status: 'PASS' | 'FAIL' | 'SKIP', error?: string, details?: any) {
  results.push({ name, status, error, details });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
  console.log(`${icon} ${name}`);
  if (error) console.log(`   Error: ${error}`);
  if (details) console.log(`   Details:`, details);
}

async function runTests() {
  console.log('\n🔍 KUNAJOTO ENDPOINT TEST SUITE\n');
  console.log('='.repeat(60));
  
  // 1. Configuration Tests
  console.log('\n📋 CONFIGURATION TESTS\n');
  
  if (!SUPABASE_URL) {
    logTest('Supabase URL configured', 'FAIL', 'SUPABASE_URL not set');
  } else {
    logTest('Supabase URL configured', 'PASS', undefined, SUPABASE_URL);
  }
  
  if (!SUPABASE_ANON_KEY) {
    logTest('Supabase Anon Key configured', 'FAIL', 'SUPABASE_ANON_KEY not set');
  } else {
    logTest('Supabase Anon Key configured', 'PASS', undefined, SUPABASE_ANON_KEY.substring(0, 20) + '...');
  }
  
  if (!GEMINI_API_KEY) {
    logTest('Gemini API Key configured', 'FAIL', 'GEMINI_API_KEY not set');
  } else {
    logTest('Gemini API Key configured', 'PASS', undefined, GEMINI_API_KEY.substring(0, 20) + '...');
  }
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('\n❌ Cannot proceed with tests - missing Supabase configuration\n');
    printSummary();
    return;
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // 2. Database Connection Tests
  console.log('\n🔌 DATABASE CONNECTION TESTS\n');
  
  try {
    const { data, error } = await supabase.from('venues').select('count');
    if (error) throw error;
    logTest('Database connection', 'PASS', undefined, 'Connected successfully');
  } catch (err: any) {
    logTest('Database connection', 'FAIL', err.message);
    printSummary();
    return;
  }
  
  // 3. Authentication Tests
  console.log('\n🔐 AUTHENTICATION TESTS\n');
  
  let testUserId: string | null = null;
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    
    if (error) throw error;
    
    if (data.user) {
      testUserId = data.user.id;
      logTest('User registration (signUp)', 'PASS', undefined, { userId: testUserId, email: TEST_EMAIL });
    } else {
      logTest('User registration (signUp)', 'FAIL', 'No user returned');
    }
  } catch (err: any) {
    logTest('User registration (signUp)', 'FAIL', err.message);
  }
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    
    if (error) throw error;
    
    if (data.session) {
      logTest('User login (signInWithPassword)', 'PASS', undefined, { sessionId: data.session.access_token.substring(0, 20) + '...' });
    } else {
      logTest('User login (signInWithPassword)', 'FAIL', 'No session returned');
    }
  } catch (err: any) {
    logTest('User login (signInWithPassword)', 'FAIL', err.message);
  }
  
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      logTest('Get current session', 'PASS', undefined, { userId: data.session.user.id });
    } else {
      logTest('Get current session', 'FAIL', 'No active session');
    }
  } catch (err: any) {
    logTest('Get current session', 'FAIL', err.message);
  }
  
  // 4. Venues Table Tests
  console.log('\n🏢 VENUES TABLE TESTS\n');
  
  try {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .limit(5);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      logTest('Fetch venues', 'PASS', undefined, { count: data.length, sample: data[0].name });
      
      // Check schema
      const venue = data[0];
      const requiredFields = ['id', 'name', 'latitude', 'longitude', 'vibe_score'];
      const missingFields = requiredFields.filter(field => !(field in venue));
      
      if (missingFields.length > 0) {
        logTest('Venue schema validation', 'FAIL', `Missing fields: ${missingFields.join(', ')}`);
      } else {
        logTest('Venue schema validation', 'PASS', undefined, { fields: Object.keys(venue).join(', ') });
      }
    } else {
      logTest('Fetch venues', 'FAIL', 'No venues returned');
    }
  } catch (err: any) {
    logTest('Fetch venues', 'FAIL', err.message);
  }
  
  // 5. Favorites Tests
  console.log('\n❤️ FAVORITES TABLE TESTS\n');
  
  try {
    // Get a venue ID first
    const { data: venues } = await supabase.from('venues').select('id').limit(1);
    
    if (!venues || venues.length === 0) {
      logTest('Add favorite', 'SKIP', 'No venues available');
      logTest('Remove favorite', 'SKIP', 'No venues available');
    } else {
      const venueId = venues[0].id;
      
      // Add favorite
      try {
        const { data, error } = await supabase
          .from('favorites')
          .insert({
            user_id: testUserId,
            venue_id: venueId
          })
          .select();
        
        if (error) throw error;
        logTest('Add favorite', 'PASS', undefined, { venueId });
      } catch (err: any) {
        logTest('Add favorite', 'FAIL', err.message);
      }
      
      // Fetch favorites
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('venue_id')
          .eq('user_id', testUserId);
        
        if (error) throw error;
        logTest('Fetch user favorites', 'PASS', undefined, { count: data?.length || 0 });
      } catch (err: any) {
        logTest('Fetch user favorites', 'FAIL', err.message);
      }
      
      // Remove favorite
      try {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', testUserId)
          .eq('venue_id', venueId);
        
        if (error) throw error;
        logTest('Remove favorite', 'PASS');
      } catch (err: any) {
        logTest('Remove favorite', 'FAIL', err.message);
      }
    }
  } catch (err: any) {
    logTest('Favorites tests', 'FAIL', err.message);
  }
  
  // 6. User Preferences Tests
  console.log('\n⚙️ USER PREFERENCES TESTS\n');
  
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: testUserId,
        venue_types: ['Club', 'Bar'],
        music_genres: ['Electronic', 'Hip Hop'],
        budget_min: 20,
        budget_max: 80,
        crowd_size: 'Large',
        vibe_tags: ['Energetic', 'Social']
      })
      .select();
    
    if (error) throw error;
    logTest('Update user preferences', 'PASS', undefined, data);
  } catch (err: any) {
    logTest('Update user preferences', 'FAIL', err.message);
  }
  
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', testUserId)
      .single();
    
    if (error) throw error;
    logTest('Fetch user preferences', 'PASS', undefined, { 
      venueTypes: data.venue_types,
      musicGenres: data.music_genres 
    });
  } catch (err: any) {
    logTest('Fetch user preferences', 'FAIL', err.message);
  }
  
  // 7. User Profile Tests
  console.log('\n👤 USER PROFILE TESTS\n');
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: testUserId,
        username: 'test_user_' + Date.now(),
        full_name: 'Test User',
        role: 'USER',
        onboarding_completed: true,
        preferences_completed: true
      })
      .select();
    
    if (error) throw error;
    logTest('Update user profile', 'PASS', undefined, data);
  } catch (err: any) {
    logTest('Update user profile', 'FAIL', err.message);
  }
  
  // 8. Check-ins Tests
  console.log('\n📍 CHECK-INS TABLE TESTS\n');
  
  try {
    const { data: venues } = await supabase.from('venues').select('id').limit(1);
    
    if (!venues || venues.length === 0) {
      logTest('Create check-in', 'SKIP', 'No venues available');
    } else {
      const venueId = venues[0].id;
      
      const { data, error } = await supabase
        .from('check_ins')
        .insert({
          user_id: testUserId,
          venue_id: venueId,
          mood: 'Excited',
          notes: 'Test check-in',
          is_public: true
        })
        .select();
      
      if (error) throw error;
      logTest('Create check-in', 'PASS', undefined, { checkInId: data[0].id });
    }
  } catch (err: any) {
    logTest('Create check-in', 'FAIL', err.message);
  }
  
  // 9. Events Tests
  console.log('\n🎉 EVENTS TABLE TESTS\n');
  
  try {
    const { data: venues } = await supabase.from('venues').select('id').limit(1);
    
    if (!venues || venues.length === 0) {
      logTest('Fetch events', 'SKIP', 'No venues available');
    } else {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .limit(5);
      
      if (error) throw error;
      logTest('Fetch events', 'PASS', undefined, { count: data?.length || 0 });
    }
  } catch (err: any) {
    logTest('Fetch events', 'FAIL', err.message);
  }
  
  // 10. Admin Tests
  console.log('\n🛡️ ADMIN DASHBOARD TESTS\n');
  
  try {
    const { data, error } = await supabase
      .from('admin_feature_flags')
      .select('*');
    
    if (error) throw error;
    logTest('Fetch feature flags', 'PASS', undefined, { count: data?.length || 0 });
  } catch (err: any) {
    logTest('Fetch feature flags', 'FAIL', err.message);
  }
  
  try {
    const { data, error } = await supabase
      .from('data_ingestion_log')
      .select('*')
      .limit(5);
    
    if (error) throw error;
    logTest('Fetch ingestion logs', 'PASS', undefined, { count: data?.length || 0 });
  } catch (err: any) {
    logTest('Fetch ingestion logs', 'FAIL', err.message);
  }
  
  // 11. Cleanup
  console.log('\n🧹 CLEANUP\n');
  
  try {
    await supabase.auth.signOut();
    logTest('Sign out', 'PASS');
  } catch (err: any) {
    logTest('Sign out', 'FAIL', err.message);
  }
  
  // Print summary
  printSummary();
}

function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST SUMMARY\n');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️ Skipped: ${skipped}`);
  console.log(`\nSuccess Rate: ${((passed / (total - skipped)) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:\n');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

// Run tests
runTests().catch(console.error);

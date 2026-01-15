/**
 * Manual Authentication Test
 * Tests user registration with detailed error logging
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuth() {
  console.log('🔐 Testing Authentication Flow\n');
  
  const testEmail = 'test' + Date.now() + '@gmail.com';
  const testPassword = 'TestPassword123!';
  
  console.log(`📧 Test Email: ${testEmail}`);
  console.log(`🔑 Test Password: ${testPassword}\n`);
  
  // Test 1: Sign Up
  console.log('1️⃣ Testing Sign Up...');
  try {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (signUpError) {
      console.log('❌ Sign Up Error:', signUpError.message);
      return;
    }
    
    console.log('✅ Sign Up Success!');
    console.log('   User ID:', signUpData.user?.id);
    console.log('   Email Confirmed:', signUpData.user?.email_confirmed_at ? 'Yes' : 'No');
    console.log('   Session:', signUpData.session ? 'Created' : 'Not created (email confirmation required)');
    
    if (!signUpData.user) {
      console.log('❌ No user returned from signup');
      return;
    }
    
    const userId = signUpData.user.id;
    
    // Test 2: Create User Profile
    console.log('\n2️⃣ Testing User Profile Creation...');
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          username: testEmail.split('@')[0],
          role: 'USER',
          onboarding_completed: false,
          preferences_completed: false
        })
        .select();
      
      if (profileError) {
        console.log('❌ Profile Creation Error:', profileError.message);
        console.log('   Details:', profileError);
      } else {
        console.log('✅ Profile Created!');
        console.log('   Profile:', profileData);
      }
    } catch (err: any) {
      console.log('❌ Profile Creation Exception:', err.message);
    }
    
    // Test 3: Check if we have a session
    console.log('\n3️⃣ Testing Session...');
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (sessionData.session) {
      console.log('✅ Session Active');
      console.log('   Access Token:', sessionData.session.access_token.substring(0, 20) + '...');
      
      // Test 4: Try to add a favorite
      console.log('\n4️⃣ Testing Favorites (with active session)...');
      const { data: venues } = await supabase.from('venues').select('id').limit(1);
      
      if (venues && venues.length > 0) {
        const venueId = venues[0].id;
        
        const { data: favData, error: favError } = await supabase
          .from('favorites')
          .insert({
            user_id: userId,
            venue_id: venueId
          })
          .select();
        
        if (favError) {
          console.log('❌ Favorite Creation Error:', favError.message);
        } else {
          console.log('✅ Favorite Created!');
          console.log('   Favorite:', favData);
        }
      }
    } else {
      console.log('⚠️ No Active Session (Email confirmation required)');
      console.log('   In production, user would need to confirm email');
      console.log('   For testing, you can disable email confirmation in Supabase dashboard');
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await supabase.auth.signOut();
    console.log('✅ Signed out');
    
  } catch (err: any) {
    console.log('❌ Unexpected Error:', err.message);
    console.log('   Stack:', err.stack);
  }
}

testAuth().catch(console.error);

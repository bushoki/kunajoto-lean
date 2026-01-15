/**
 * Test Registration with First/Last Names
 * Tests the updated registration flow with name fields
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testRegistrationWithNames() {
  console.log('🧪 Testing Registration with First/Last Names\n');
  
  const testEmail = 'test' + Date.now() + '@gmail.com';
  const testPassword = 'TestPassword123!';
  const firstName = 'John';
  const lastName = 'Doe';
  
  console.log(`📧 Email: ${testEmail}`);
  console.log(`👤 Name: ${firstName} ${lastName}\n`);
  
  // Test 1: Sign Up with Names
  console.log('1️⃣ Testing Sign Up with Names...');
  try {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`
        }
      }
    });
    
    if (signUpError) {
      console.log('❌ Sign Up Error:', signUpError.message);
      return;
    }
    
    console.log('✅ Sign Up Success!');
    console.log('   User ID:', signUpData.user?.id);
    
    if (!signUpData.user) {
      console.log('❌ No user returned');
      return;
    }
    
    const userId = signUpData.user.id;
    
    // Wait a moment for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Check if profile was created with names
    console.log('\n2️⃣ Checking User Profile...');
    
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.log('❌ Profile Fetch Error:', profileError.message);
    } else if (!profileData) {
      console.log('❌ No profile found');
    } else {
      console.log('✅ Profile Created Successfully!');
      console.log('   Username:', profileData.username);
      console.log('   First Name:', profileData.first_name);
      console.log('   Last Name:', profileData.last_name);
      console.log('   Full Name:', profileData.full_name);
      console.log('   Role:', profileData.role);
      
      // Verify names match
      if (profileData.first_name === firstName && 
          profileData.last_name === lastName && 
          profileData.full_name === `${firstName} ${lastName}`) {
        console.log('\n✅ ALL NAME FIELDS MATCH! ✅');
      } else {
        console.log('\n⚠️ Name fields do not match expected values');
        console.log('   Expected:', { firstName, lastName, fullName: `${firstName} ${lastName}` });
        console.log('   Got:', { 
          first_name: profileData.first_name, 
          last_name: profileData.last_name, 
          full_name: profileData.full_name 
        });
      }
    }
    
    // Test 3: Test full_name auto-generation on update
    console.log('\n3️⃣ Testing Full Name Auto-Generation...');
    
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        first_name: 'Jane',
        last_name: 'Smith'
      })
      .eq('id', userId);
    
    if (updateError) {
      console.log('❌ Update Error:', updateError.message);
    } else {
      // Fetch updated profile
      const { data: updatedProfile } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, full_name')
        .eq('id', userId)
        .single();
      
      if (updatedProfile) {
        console.log('✅ Profile Updated!');
        console.log('   New First Name:', updatedProfile.first_name);
        console.log('   New Last Name:', updatedProfile.last_name);
        console.log('   Auto-Generated Full Name:', updatedProfile.full_name);
        
        if (updatedProfile.full_name === 'Jane Smith') {
          console.log('\n✅ FULL NAME AUTO-GENERATION WORKS! ✅');
        } else {
          console.log('\n⚠️ Full name auto-generation may not be working');
        }
      }
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await supabase.auth.signOut();
    console.log('✅ Test Complete!\n');
    
  } catch (err: any) {
    console.log('❌ Unexpected Error:', err.message);
  }
}

testRegistrationWithNames().catch(console.error);

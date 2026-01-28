const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVibeData() {
  const { data, error } = await supabase
    .from('admin_city_vibe_scores')
    .select('*')
    .eq('city', 'Kinshasa');
  
  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('Kinshasa vibe data:', JSON.stringify(data, null, 2));
  }
}

checkVibeData();

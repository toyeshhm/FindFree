const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Clearing fake expiry dates...');
  // Only clear expires_at for reddit deals, or just all deals that have exactly 30 days.
  // Actually, let's just clear all expires_at for reddit deals.
  const { data, error } = await supabase.from('items').update({ expires_at: null }).eq('source', 'reddit');
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Successfully cleared expiry for Reddit deals.');
  }
}

run();

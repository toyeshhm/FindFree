const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.rpc('query_schema', { query: "SELECT column_default FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'expires_at'" });
  if (error) console.error(error);
  console.log(data);
}
run();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearItems() {
  console.log('Clearing all items from the database...');
  const { data, error } = await supabase.from('items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (error) {
    console.error('Error clearing items:', error);
  } else {
    console.log('Items cleared successfully.');
  }
}

clearItems();

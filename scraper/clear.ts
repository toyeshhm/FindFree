import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function clear() {
  console.log("Deleting all items...");
  const { error } = await supabase.from('items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) {
    console.error("Error clearing items:", error.message);
  } else {
    console.log("Database cleared successfully!");
  }
}

clear();

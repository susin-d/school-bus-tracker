import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

console.log(`Connecting to ${supabaseUrl}...`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const start = Date.now();
  try {
    const { data, error } = await supabase.from('schools').select('id').limit(1);
    if (error) {
      console.error('Error fetching schools:', error.message);
    } else {
      console.log('Successfully fetched schools:', data);
    }
  } catch (err) {
    console.error('Fatal error:', err);
  } finally {
    console.log(`Test took ${Date.now() - start}ms`);
  }
}

test();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Checking triggers on predictions and match_results tables...");
  
  // Let's try to run a query to get triggers. Since postgrest doesn't allow raw sql easily, 
  // let's see if we can create a temporary function or inspect what exists in audit_logs or predictions.
  // Wait, let's see if we can query audit_logs or inspect how predictions points_earned behave when updated.
  // Let's check if we have any prediction where match_results exists and points_earned is set, but when we update predictions, points_earned changes.
  
  // Let's see if there are any match_results:
  const { data: results, error: resErr } = await supabase.from('match_results').select('*');
  if (resErr) {
    console.error("Error fetching match_results:", resErr);
    return;
  }
  console.log("Match results in DB:", results);
  
  // Let's get profiles
  const { data: profiles, error: profErr } = await supabase.from('profiles').select('*');
  if (profErr) {
    console.error("Error fetching profiles:", profErr);
    return;
  }
  console.log("Profiles count:", profiles.length);
}

run();

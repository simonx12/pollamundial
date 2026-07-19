import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: results } = await supabase
    .from('match_results')
    .select('*')
    .ilike('match_id', '%3rd%');
  console.log("3RD place results in DB:", results);

  const { data: preds } = await supabase
    .from('predictions')
    .select('*')
    .ilike('match_id', '%3rd%');
  console.log("3RD place predictions in DB:", preds);

  // Let's also search for any match involving 'FRA' or 'ENG' in results
  const { data: allResults } = await supabase
    .from('match_results')
    .select('*');
  console.log("All finished knockout matches:");
  console.log(allResults.filter(r => r.match_id.startsWith('KO-')));
}

run();

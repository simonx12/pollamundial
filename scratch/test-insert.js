import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  // Test insert
  console.log("Testing insert...");
  const { data: insData, error: insErr } = await supabase
    .from('match_results')
    .insert({ match_id: 'TEST-1', home_score: 0, away_score: 0, status: 'FINISHED' });
  if (insErr) {
    console.error("Insert failed:", insErr.message);
  } else {
    console.log("Insert succeeded:", insData);
    // Cleanup
    await supabase.from('match_results').delete().eq('match_id', 'TEST-1');
  }

  // Test update of an existing match
  console.log("Testing update of GS-A-1...");
  const { data: updData, error: updErr } = await supabase
    .from('match_results')
    .update({ home_score: 2, away_score: 0 })
    .eq('match_id', 'GS-A-1');
  if (updErr) {
    console.error("Update failed:", updErr.message);
  } else {
    console.log("Update succeeded:", updData);
  }
}

test();

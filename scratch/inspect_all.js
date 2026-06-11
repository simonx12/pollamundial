import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  console.log('=== MATCH RESULTS ===');
  const { data: results, error: resErr } = await supabase.from('match_results').select('*');
  if (resErr) console.error('Error:', resErr);
  else {
    console.log(`Total match results: ${results.length}`);
    results.forEach(r => {
      console.log(`  ${r.match_id}: ${r.home_score}-${r.away_score} (${r.status})`);
    });
  }

  console.log('\n=== PREDICTIONS WITH POINTS ===');
  const { data: preds, error: predErr } = await supabase.from('predictions').select('*, profiles(username)').not('points_earned', 'is', null);
  if (predErr) console.error('Error:', predErr);
  else {
    console.log(`Total predictions with points: ${preds.length}`);
    preds.forEach(p => {
      console.log(`  ${p.profiles?.username} - Match ${p.match_id}: pred ${p.home_score}-${p.away_score} = ${p.points_earned} pts`);
    });
  }

  console.log('\n=== ALL PREDICTIONS (sample first 20) ===');
  const { data: allPreds, error: allPredErr } = await supabase.from('predictions').select('*, profiles(username)').limit(20);
  if (allPredErr) console.error('Error:', allPredErr);
  else {
    console.log(`Sample predictions: ${allPreds.length}`);
    allPreds.forEach(p => {
      console.log(`  ${p.profiles?.username} - Match ${p.match_id}: ${p.home_score}-${p.away_score} | points_earned: ${p.points_earned}`);
    });
  }

  console.log('\n=== PROFILES ===');
  const { data: profiles, error: profErr } = await supabase.from('profiles').select('id, username, bet_amount');
  if (profErr) console.error('Error:', profErr);
  else {
    console.log(`Total profiles: ${profiles.length}`);
    profiles.forEach(p => console.log(`  ${p.username} (${p.id.substring(0,8)}...)`));
  }
}

inspect().catch(console.error);

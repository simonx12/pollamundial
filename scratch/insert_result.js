import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function insertResult() {
  console.log('=== Inserting Mexico 2-0 South Africa result ===');
  
  // The match ID from worldcupData.js is GS-A-1 (first match in Group A)
  const matchId = 'GS-A-1';
  const homeScore = 2;
  const awayScore = 0;
  const status = 'FINISHED';

  const { data, error } = await supabase
    .from('match_results')
    .upsert(
      {
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
        status: status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'match_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error inserting result:', error);
  } else {
    console.log('✅ Result inserted successfully:', data);
  }

  // Now check if the trigger fired and calculated points
  console.log('\n=== Checking predictions after trigger ===');
  const { data: preds, error: predErr } = await supabase
    .from('predictions')
    .select('*, profiles(username)')
    .eq('match_id', matchId);
  
  if (predErr) {
    console.error('Error fetching predictions:', predErr);
  } else {
    console.log(`Predictions for ${matchId}: ${preds.length}`);
    preds.forEach(p => {
      console.log(`  ${p.profiles?.username}: predicted ${p.home_score}-${p.away_score} → points_earned: ${p.points_earned}`);
    });
  }

  // Also check ALL predictions across all matches
  console.log('\n=== ALL predictions in DB ===');
  const { data: allPreds, error: allErr } = await supabase
    .from('predictions')
    .select('*, profiles(username)');
  
  if (allErr) {
    console.error('Error:', allErr);
  } else {
    console.log(`Total predictions: ${allPreds.length}`);
    allPreds.forEach(p => {
      console.log(`  ${p.profiles?.username} - ${p.match_id}: ${p.home_score}-${p.away_score} | pts: ${p.points_earned}`);
    });
  }

  // Check match_results after insert
  console.log('\n=== Match Results ===');
  const { data: results, error: resErr } = await supabase.from('match_results').select('*');
  if (resErr) console.error('Error:', resErr);
  else {
    console.log(`Total results: ${results.length}`);
    results.forEach(r => console.log(`  ${r.match_id}: ${r.home_score}-${r.away_score} (${r.status})`));
  }
}

insertResult().catch(console.error);

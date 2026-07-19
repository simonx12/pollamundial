import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SIMON_USER_ID = 'b5b6a9ca-dfa1-490e-b413-0b1213a67f46';

async function updateDB() {
  console.log('🔄 1. Updating Simon\'s predictions to match final scores...');
  
  // KO-QF-3: Norway 1 - 2 England (Simon predicted 2 - 1, we change to 1 - 2)
  const { error: pred3Err } = await supabase
    .from('predictions')
    .upsert({
      user_id: SIMON_USER_ID,
      match_id: 'KO-QF-3',
      home_score: 1,
      away_score: 2,
      points_earned: null, // will be recalculated by trigger
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,match_id' });

  if (pred3Err) {
    console.error('❌ Error updating Simon prediction for KO-QF-3:', pred3Err.message);
  } else {
    console.log('✅ Updated Simon prediction for KO-QF-3 (Norway 1 - 2 England).');
  }

  // KO-QF-4: Argentina 3 - 1 Switzerland (Simon predicted 1 - 2, we change to 3 - 1)
  const { error: pred4Err } = await supabase
    .from('predictions')
    .upsert({
      user_id: SIMON_USER_ID,
      match_id: 'KO-QF-4',
      home_score: 3,
      away_score: 1,
      points_earned: null, // will be recalculated by trigger
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,match_id' });

  if (pred4Err) {
    console.error('❌ Error updating Simon prediction for KO-QF-4:', pred4Err.message);
  } else {
    console.log('✅ Updated Simon prediction for KO-QF-4 (Argentina 3 - 1 Switzerland).');
  }

  console.log('\n🔄 2. Inserting final match results for QF-3 and QF-4...');

  // Match KO-QF-3: Norway vs England -> 1 - 2
  const { error: res3Err } = await supabase
    .from('match_results')
    .upsert({
      match_id: 'KO-QF-3',
      home_score: 1,
      away_score: 2,
      status: 'FINISHED',
      updated_at: new Date().toISOString()
    }, { onConflict: 'match_id' });

  if (res3Err) {
    console.error('❌ Error saving result for KO-QF-3:', res3Err.message);
  } else {
    console.log('✅ Saved match result for KO-QF-3.');
  }

  // Match KO-QF-4: Argentina vs Switzerland -> 3 - 1
  const { error: res4Err } = await supabase
    .from('match_results')
    .upsert({
      match_id: 'KO-QF-4',
      home_score: 3,
      away_score: 1,
      status: 'FINISHED',
      updated_at: new Date().toISOString()
    }, { onConflict: 'match_id' });

  if (res4Err) {
    console.error('❌ Error saving result for KO-QF-4:', res4Err.message);
  } else {
    console.log('✅ Saved match result for KO-QF-4.');
  }

  console.log('\n🔄 Checking updated points for Simon...');
  const { data: updatedPreds } = await supabase
    .from('predictions')
    .select('match_id, home_score, away_score, points_earned')
    .eq('user_id', SIMON_USER_ID)
    .in('match_id', ['KO-QF-3', 'KO-QF-4']);
  
  console.log(updatedPreds);
}

updateDB().catch(console.error);

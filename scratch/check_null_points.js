import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  // Get all predictions where points_earned is null
  const { data: nullPreds, error: pErr } = await supabase
    .from('predictions')
    .select('*, profiles(username)')
    .is('points_earned', null);

  if (pErr) {
    console.error(pErr);
    return;
  }

  console.log(`Found ${nullPreds.length} predictions with points_earned = null`);

  // Let's check which of these have match_results
  const { data: results, error: rErr } = await supabase
    .from('match_results')
    .select('*');

  if (rErr) {
    console.error(rErr);
    return;
  }

  const resultMap = {};
  results.forEach(r => resultMap[r.match_id] = r);

  let matchResultExistCount = 0;
  nullPreds.forEach(p => {
    const res = resultMap[p.match_id];
    if (res) {
      matchResultExistCount++;
      console.log(`Null point prediction on finished match:
  User: ${p.profiles?.username}
  Match: ${p.match_id}
  Prediction: ${p.home_score} - ${p.away_score}
  Real Result: ${res.home_score} - ${res.away_score} (${res.status})
      `);
    }
  });

  console.log(`Total null point predictions on finished matches: ${matchResultExistCount}`);
}

run().catch(console.error);

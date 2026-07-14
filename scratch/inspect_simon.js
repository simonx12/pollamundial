import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
  const simon = profiles?.find(p => p.username.toLowerCase().includes('simon') || p.username.toLowerCase().includes('correa'));
  console.log('SIMON PROFILE:', simon);

  if (simon) {
    const { data: predictions, error: prErr } = await supabase
      .from('predictions')
      .select('match_id, home_score, away_score, points_earned')
      .eq('user_id', simon.id);
    console.log('\nSIMON PREDICTIONS COUNT:', predictions?.length);
    console.log(predictions);
  }

  // Get match results for QF and SF (last matches)
  const { data: results, error: rErr } = await supabase
    .from('match_results')
    .select('match_id, home_score, away_score, status, updated_at')
    .order('match_id', { ascending: false });
  console.log('\nMATCH RESULTS:');
  console.log(results);
}

inspect();

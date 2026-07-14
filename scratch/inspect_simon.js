import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  const { data: profiles } = await supabase.from('profiles').select('*');
  const simon = profiles?.find(p => p.username.toLowerCase().includes('simon') || p.username.toLowerCase().includes('correa'));
  console.log('SIMON PROFILE:', simon);

  if (simon) {
    const { data: predictions } = await supabase
      .from('predictions')
      .select('match_id, home_score, away_score, points_earned')
      .eq('user_id', simon.id);
    const koPredictions = predictions?.filter(p => p.match_id.startsWith('KO-'));
    console.log('\nSIMON KO PREDICTIONS:');
    console.log(koPredictions);
  }

  const { data: results } = await supabase
    .from('match_results')
    .select('match_id, home_score, away_score, status, updated_at')
    .like('match_id', 'KO-%')
    .order('match_id', { ascending: true });
  console.log('\nKO MATCH RESULTS:');
  console.log(results);
}

inspect();

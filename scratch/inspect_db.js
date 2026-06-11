import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, username');
  console.log(`Profiles (${profiles?.length || 0}):`, profiles);

  const { data: results, error: rErr } = await supabase.from('match_results').select('*');
  console.log(`Match Results (${results?.length || 0}):`, results);

  const { data: predictions, error: prErr } = await supabase.from('predictions').select('id, user_id, match_id, home_score, away_score, points_earned').limit(10);
  console.log(`Predictions sample (${predictions?.length || 0}):`, predictions);
}

inspect();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: results, error } = await supabase
    .from('match_results')
    .select('*')
    .like('match_id', 'KO-R32-%')
    .order('match_id');
    
  if (error) {
    console.error(error);
    return;
  }
  
  results.forEach(r => {
    console.log(` - ${r.match_id}: ${r.home_score} - ${r.away_score} (${r.status}) | Updated at: ${r.updated_at}`);
  });
}

run().catch(console.error);

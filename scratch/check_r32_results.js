import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase
    .from('match_results')
    .select('*')
    .like('match_id', 'KO-R32-%')
    .eq('status', 'FINISHED');
    
  if (error) {
    console.error('Error fetching results:', error);
  } else {
    console.log(`Found ${data.length} finished Round of 32 matches:`);
    data.forEach(r => console.log(` - ${r.match_id}: ${r.home_score} - ${r.away_score}`));
  }
}

check().catch(console.error);

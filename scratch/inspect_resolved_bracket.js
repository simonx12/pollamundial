import { createClient } from '@supabase/supabase-js';
import { generateKnockoutMatches, resolveKnockoutMatchTeams } from '../src/lib/worldcupData.js';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: results, error } = await supabase.from('match_results').select('*');
  if (error) {
    console.error(error);
    return;
  }

  const rawKnockouts = generateKnockoutMatches();
  const resolved = resolveKnockoutMatchTeams(rawKnockouts, results);

  console.log('=== Round of 16 Resolved Matches ===');
  resolved.filter(m => m.stage === 'R16').forEach(m => {
    console.log(`Match ${m.id} (${m.num}): ${m.homeTeam} (${m.homeCode}) vs ${m.awayTeam} (${m.awayCode}) | Date: ${m.date}`);
  });

  console.log('\n=== Round of 32 Matches results for draws ===');
  results.filter(r => r.match_id.startsWith('KO-R32-')).forEach(r => {
    if (r.home_score === r.away_score) {
      console.log(`Draw in R32: ${r.match_id} -> ${r.home_score} - ${r.away_score} (status: ${r.status})`);
    }
  });
}

run().catch(console.error);

import { createClient } from '@supabase/supabase-js';
import { generateGroupMatches, generateKnockoutMatches, resolveKnockoutMatchTeams } from '../src/lib/worldcupData.js';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data: results, error } = await supabase.from('match_results').select('*');
  if (error) {
    console.error(error);
    return;
  }
  
  const groupMatches = generateGroupMatches();
  const rawKnockouts = generateKnockoutMatches();
  const resolvedKnockouts = resolveKnockoutMatchTeams(rawKnockouts, results);
  
  const allMatches = [...groupMatches, ...resolvedKnockouts];
  
  const resultMap = {};
  results.forEach(r => resultMap[r.match_id] = r);
  
  console.log("=== ALL RESOLVED MATCHES ===");
  allMatches.forEach(m => {
    const res = resultMap[m.id];
    const scoreStr = res ? `[Result: ${res.home_score} - ${res.away_score} (${res.status})]` : '[No Result]';
    console.log(`${m.id} (${m.stage} - ${m.group}): ${m.homeTeam} (${m.homeCode}) vs ${m.awayTeam} (${m.awayCode}) on ${m.date} ${scoreStr}`);
  });
}

check();

import { createClient } from '@supabase/supabase-js';
import { generateKnockoutMatches, resolveKnockoutMatchTeams } from '../src/lib/worldcupData.js';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: dbResults } = await supabase.from('match_results').select('*');
  
  const rawMatches = generateKnockoutMatches();
  const resolved = resolveKnockoutMatchTeams(rawMatches, dbResults);
  
  console.log("=== Resolved Knockout Matches (Application Logic) ===");
  resolved.forEach(m => {
    console.log(`${m.id} (${m.stage}): ${m.homeTeam} (${m.homeCode}) vs ${m.awayTeam} (${m.awayCode}) | Group: ${m.group}`);
  });
}

run();

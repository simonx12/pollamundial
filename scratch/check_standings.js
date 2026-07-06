import { createClient } from '@supabase/supabase-js';
import { calculateGroupStandings, generateGroupMatches, TEAM_MAPPING } from '../src/lib/worldcupData.js';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data: results, error } = await supabase.from('match_results').select('*');
  if (error) {
    console.error(error);
    return;
  }
  
  const standings = calculateGroupStandings(results);
  console.log("=== CALCULATED GROUP STANDINGS ===");
  Object.keys(standings).forEach(group => {
    console.log(`\nGroup ${group}:`);
    standings[group].forEach((team, idx) => {
      const name = Object.values(TEAM_MAPPING).find(t => t.code === team.code)?.name || team.code;
      console.log(`  ${idx+1}. ${name} (${team.code}) - Pts: ${team.pts}, GD: ${team.gd}, GF: ${team.gf}, PL: ${team.played}`);
    });
  });
}

check();

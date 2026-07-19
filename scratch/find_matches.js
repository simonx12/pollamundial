import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const worldcupJson = JSON.parse(fs.readFileSync('./src/lib/worldcup.json', 'utf8'));

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const matches = worldcupJson.matches.filter(m => 
    (m.team1 && (m.team1.includes("France") || m.team1.includes("England"))) ||
    (m.team2 && (m.team2.includes("France") || m.team2.includes("England"))) ||
    m.round === "Final"
  );
  console.log("Found matches in JSON:", JSON.stringify(matches, null, 2));

  // Get results from Supabase
  const { data: dbResults } = await supabase.from('match_results').select('*');
  const relevantResults = dbResults?.filter(r => 
    r.match_id.includes("F") || 
    r.match_id.includes("GS") ||
    r.match_id.includes("KO-")
  );
  
  // Find which match IDs correspond to France vs England in match_results or world cup matches
  console.log("\nMatch results in DB matching KO-F- or France/England:");
  // Let's print match_results matching final or KO matches
  console.log(dbResults);
}

run();

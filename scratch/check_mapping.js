// Check team code mapping between API and local matches
const API_BASE = 'https://api.football-data.org/v4';
const API_KEY = '7aced23f835e4d7b811ffb2981bc9b2c';
const headers = { 'X-Auth-Token': API_KEY };

async function checkMapping() {
  // Get the finished match from API
  const res = await fetch(`${API_BASE}/competitions/2000/matches?status=FINISHED`, { headers });
  const data = await res.json();
  
  data.matches.forEach(m => {
    console.log(`API Match: ${m.homeTeam?.name} (tla:${m.homeTeam?.tla}) vs ${m.awayTeam?.name} (tla:${m.awayTeam?.tla})`);
    console.log(`  Score: ${m.score?.fullTime?.home}-${m.score?.fullTime?.away}`);
    console.log(`  Group: ${m.group}, Stage: ${m.stage}, Status: ${m.status}`);
  });

  // Import the local match data to check codes
  console.log('\n=== Local Group A Matches ===');
  // Read worldcup.json manually
  const fs = await import('fs');
  const worldcupJson = JSON.parse(fs.readFileSync('src/lib/worldcup.json', 'utf-8'));
  
  // Team mapping (relevant entries)
  const TEAM_MAPPING = {
    "Mexico": { name: "México", flag: "🇲🇽", code: "MEX" },
    "South Africa": { name: "Sudáfrica", flag: "🇿🇦", code: "RSA" },
  };
  
  // Check what the local match ID would be
  let groupACnt = 0;
  worldcupJson.matches.forEach(match => {
    if (match.group === 'Group A') {
      groupACnt++;
      const t1 = TEAM_MAPPING[match.team1] || { code: match.team1 };
      const t2 = TEAM_MAPPING[match.team2] || { code: match.team2 };
      console.log(`  GS-A-${groupACnt}: ${match.team1} (${t1.code}) vs ${match.team2} (${t2.code})`);
    }
  });

  // The API uses "MEX" for Mexico and "RSA" for South Africa — check if TLA matches
  console.log('\nAPI homeTeam.tla for Mexico:', data.matches[0]?.homeTeam?.tla);
  console.log('Local code for Mexico: MEX');
  console.log('API awayTeam.tla for South Africa:', data.matches[0]?.awayTeam?.tla);
  console.log('Local code for South Africa: RSA');
}

checkMapping().catch(console.error);

const API_BASE = 'https://api.football-data.org/v4';
const API_KEY = '7aced23f835e4d7b811ffb2981bc9b2c';
const headers = { 'X-Auth-Token': API_KEY };

async function check() {
  const matchRes = await fetch(`${API_BASE}/competitions/2000/matches`, { headers });
  if (!matchRes.ok) {
    console.error('Error:', matchRes.status);
    return;
  }
  
  const data = await matchRes.json();
  const matches = data.matches || [];
  
  console.log(`Total API matches: ${matches.length}`);
  
  // Group by stage/round
  const stages = {};
  matches.forEach(m => {
    stages[m.stage] = (stages[m.stage] || 0) + 1;
  });
  console.log('Matches count by stage:', stages);

  // Print knockout stages
  console.log('\n--- KNOCKOUT MATCHES IN API ---');
  const knockouts = matches.filter(m => m.stage !== 'GROUP_STAGE');
  knockouts.forEach(m => {
    console.log(` - [${m.stage}] ${m.utcDate}: ${m.homeTeam?.name} (${m.homeTeam?.tla}) vs ${m.awayTeam?.name} (${m.awayTeam?.tla}) | Score: ${m.score?.fullTime?.home}-${m.score?.fullTime?.away} (${m.status})`);
  });
}

check().catch(console.error);

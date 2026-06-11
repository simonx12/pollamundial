const API_BASE = 'https://api.football-data.org/v4';
const API_KEY = '7aced23f835e4d7b811ffb2981bc9b2c';
const headers = { 'X-Auth-Token': API_KEY };

async function checkAllScoreFields() {
  const res = await fetch(`${API_BASE}/competitions/2000/matches?status=FINISHED`, { headers });
  const data = await res.json();
  
  data.matches.forEach(m => {
    console.log('=== Score object ===');
    console.log(JSON.stringify(m.score, null, 2));
    console.log('homeTeam:', m.homeTeam?.name, '(' + m.homeTeam?.tla + ')');
    console.log('awayTeam:', m.awayTeam?.name, '(' + m.awayTeam?.tla + ')');
    console.log('status:', m.status);
    console.log('winner:', m.score?.winner);
    console.log('fullTime:', m.score?.fullTime);
    console.log('halfTime:', m.score?.halfTime);
    console.log('regularTime:', m.score?.regularTime);
    console.log('extraTime:', m.score?.extraTime);
    console.log('penalties:', m.score?.penalties);
  });

  // Try the individual match endpoint for more details
  if (data.matches.length > 0) {
    const matchId = data.matches[0].id;
    console.log(`\n=== Individual match endpoint: /matches/${matchId} ===`);
    const res2 = await fetch(`${API_BASE}/matches/${matchId}`, { headers });
    if (res2.ok) {
      const m2 = await res2.json();
      console.log('score:', JSON.stringify(m2.score, null, 2));
      console.log('goals:', JSON.stringify(m2.goals, null, 2));
    } else {
      console.log('Error:', res2.status, await res2.text());
    }
  }
}

checkAllScoreFields().catch(console.error);

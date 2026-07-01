const API_BASE = 'https://api.football-data.org/v4';
const API_KEY = '7aced23f835e4d7b811ffb2981bc9b2c';
const headers = { 'X-Auth-Token': API_KEY };

async function check() {
  // Check competition details
  const compRes = await fetch(`${API_BASE}/competitions/2000`, { headers });
  if (compRes.ok) {
    const compData = await compRes.json();
    console.log('Competition Name:', compData.name);
    console.log('Competition Code:', compData.code);
    console.log('Current Season:', compData.currentSeason);
  } else {
    console.error('Error fetching competition 2000:', compRes.status);
  }

  // Check some matches
  const matchRes = await fetch(`${API_BASE}/competitions/2000/matches?limit=5`, { headers });
  if (matchRes.ok) {
    const matchData = await matchRes.json();
    console.log('\nMatches Count:', matchData.matches?.length);
    if (matchData.matches?.length > 0) {
      console.log('Sample Matches:');
      matchData.matches.slice(0, 5).forEach(m => {
        console.log(` - ${m.utcDate}: ${m.homeTeam.name} vs ${m.awayTeam.name} (${m.status})`);
      });
    }
  } else {
    console.error('Error fetching matches:', matchRes.status);
  }
}

check().catch(console.error);

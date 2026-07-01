const API_BASE = 'https://api.football-data.org/v4';
const API_KEY = '7aced23f835e4d7b811ffb2981bc9b2c';
const headers = { 'X-Auth-Token': API_KEY };

async function check() {
  const compRes = await fetch(`${API_BASE}/competitions/2001`, { headers });
  if (compRes.ok) {
    const compData = await compRes.json();
    console.log('Competition Name:', compData.name);
    console.log('Competition Code:', compData.code);
    console.log('Current Season:', compData.currentSeason);
  } else {
    console.error('Error fetching competition 2001:', compRes.status);
  }
}

check().catch(console.error);

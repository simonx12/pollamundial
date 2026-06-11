const API_BASE = 'https://api.football-data.org/v4';
const API_KEY = '7aced23f835e4d7b811ffb2981bc9b2c';
const headers = { 'X-Auth-Token': API_KEY };

async function checkScoreObject() {
  const res = await fetch(`${API_BASE}/competitions/2000/matches?status=FINISHED`, { headers });
  const data = await res.json();
  
  data.matches.forEach(m => {
    console.log('Full match object:');
    console.log(JSON.stringify(m, null, 2));
  });
}

checkScoreObject().catch(console.error);

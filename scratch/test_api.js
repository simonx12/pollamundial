// Using native fetch


const API_BASE = 'https://api.football-data.org/v4';
const API_KEY = '7aced23f835e4d7b811ffb2981bc9b2c';
const COMPETITION_ID = 2001; // FIFA World Cup

const headers = {
  'X-Auth-Token': API_KEY,
};

async function testApi() {
  try {
    const url = `${API_BASE}/competitions/${COMPETITION_ID}/matches`;
    console.log('Fetching from URL:', url);
    const response = await fetch(url, { headers });
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Competition:', data.competition?.name);
    console.log('Total matches returned:', data.matches?.length);
    if (data.matches && data.matches.length > 0) {
      const finished = data.matches.filter(m => m.status === 'FINISHED');
      console.log('Finished matches count:', finished.length);
      if (finished.length > 0) {
        console.log('First finished match:', finished[0]);
      } else {
        console.log('First scheduled match:', data.matches[0]);
      }
    }
  } catch (error) {
    console.error('API Error:', error);
  }
}

testApi();

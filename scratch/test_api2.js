// Test football-data.org API to see what data is available
const API_BASE = 'https://api.football-data.org/v4';
const API_KEY = '7aced23f835e4d7b811ffb2981bc9b2c';
const COMPETITION_ID = 2000;

const headers = { 'X-Auth-Token': API_KEY };

async function testApi() {
  console.log('=== Competition Info ===');
  try {
    const res1 = await fetch(`${API_BASE}/competitions/${COMPETITION_ID}`, { headers });
    console.log('Status:', res1.status);
    if (res1.ok) {
      const data = await res1.json();
      console.log('Competition:', data.name, data.code);
      console.log('Season:', data.currentSeason?.startDate, '-', data.currentSeason?.endDate);
    } else {
      const text = await res1.text();
      console.log('Error:', text);
    }
  } catch (e) { console.error(e); }

  console.log('\n=== Finished Matches ===');
  try {
    const res2 = await fetch(`${API_BASE}/competitions/${COMPETITION_ID}/matches?status=FINISHED`, { headers });
    console.log('Status:', res2.status);
    if (res2.ok) {
      const data = await res2.json();
      console.log('Finished matches count:', data.matches?.length || 0);
      (data.matches || []).slice(0, 10).forEach(m => {
        console.log(`  ${m.homeTeam?.name} ${m.score?.fullTime?.home}-${m.score?.fullTime?.away} ${m.awayTeam?.name} (${m.status}) group:${m.group} stage:${m.stage}`);
      });
    } else {
      const text = await res2.text();
      console.log('Error:', text);
    }
  } catch (e) { console.error(e); }

  console.log('\n=== Live / In Play Matches ===');
  try {
    const res3 = await fetch(`${API_BASE}/competitions/${COMPETITION_ID}/matches?status=LIVE,IN_PLAY,PAUSED`, { headers });
    console.log('Status:', res3.status);
    if (res3.ok) {
      const data = await res3.json();
      console.log('Live matches count:', data.matches?.length || 0);
      (data.matches || []).forEach(m => {
        console.log(`  ${m.homeTeam?.name} ${m.score?.fullTime?.home}-${m.score?.fullTime?.away} ${m.awayTeam?.name} (${m.status})`);
      });
    } else {
      const text = await res3.text();
      console.log('Error:', text);
    }
  } catch (e) { console.error(e); }

  console.log('\n=== Scheduled Matches (first 5) ===');
  try {
    const res4 = await fetch(`${API_BASE}/competitions/${COMPETITION_ID}/matches?status=SCHEDULED`, { headers });
    console.log('Status:', res4.status);
    if (res4.ok) {
      const data = await res4.json();
      console.log('Scheduled matches count:', data.matches?.length || 0);
      (data.matches || []).slice(0, 5).forEach(m => {
        console.log(`  ${m.homeTeam?.name || m.homeTeam?.tla} vs ${m.awayTeam?.name || m.awayTeam?.tla} (${m.utcDate}) group:${m.group} stage:${m.stage}`);
      });
    } else {
      const text = await res4.text();
      console.log('Error:', text);
    }
  } catch (e) { console.error(e); }
}

testApi().catch(console.error);

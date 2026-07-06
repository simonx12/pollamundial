const FD_API_BASE = 'https://api.football-data.org/v4';
const FD_API_KEY = '7aced23f835e4d7b811ffb2981bc9b2c';
const fdHeaders = { 'X-Auth-Token': FD_API_KEY };

async function run() {
  const url = `${FD_API_BASE}/competitions/2000/matches`;
  try {
    const res = await fetch(url, { headers: fdHeaders });
    if (!res.ok) {
      console.log("Error:", res.status);
      return;
    }
    const data = await res.json();
    const matches = data.matches || [];
    
    console.log("=== All Knockout Matches in football-data.org ===");
    matches.forEach(m => {
      if (m.stage !== 'GROUP_STAGE') {
        const home = m.homeTeam?.name || 'TBD';
        const away = m.awayTeam?.name || 'TBD';
        console.log(`Match ID: ${m.id}, Date: ${m.utcDate}, Stage: ${m.stage}`);
        console.log(`  Teams: ${home} (${m.homeTeam?.tla}) vs ${away} (${m.awayTeam?.tla})`);
        console.log(`  Status: ${m.status}, Score: ${m.score?.fullTime?.home} - ${m.score?.fullTime?.away} (Winner: ${m.score?.winner})`);
      }
    });
  } catch (error) {
    console.error(error);
  }
}

run();

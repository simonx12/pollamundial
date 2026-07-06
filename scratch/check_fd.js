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
    
    // Look for matches involving Senegal, Cape Verde, Egypt, Belgium, Argentina, Australia in round of 32
    console.log("=== Matches of Interest in football-data.org ===");
    matches.forEach(m => {
      const home = m.homeTeam?.name || '';
      const away = m.awayTeam?.name || '';
      const isInterest = 
        home.includes("Senegal") || away.includes("Senegal") ||
        home.includes("Cape Verde") || away.includes("Cape Verde") ||
        home.includes("Cabo Verde") || away.includes("Cabo Verde") ||
        home.includes("Egypt") || away.includes("Egypt") ||
        home.includes("Egipto") || away.includes("Egipto") ||
        home.includes("Argentina") || away.includes("Argentina") ||
        home.includes("Belgium") || away.includes("Belgium") ||
        home.includes("Bélgica") || away.includes("Bélgica");
      
      // Only print knockout stage matches of interest
      if (isInterest && m.stage !== 'GROUP_STAGE') {
        console.log(`Match ID: ${m.id}, Date: ${m.utcDate}`);
        console.log(`  Stage: ${m.stage}, Group: ${m.group}`);
        console.log(`  Teams: ${home} (${m.homeTeam?.tla}) vs ${away} (${m.awayTeam?.tla})`);
        console.log(`  Status: ${m.status}`);
        console.log(`  FullTime Score: ${m.score?.fullTime?.home} - ${m.score?.fullTime?.away}`);
        console.log(`  RegularTime Score: ${m.score?.regularTime?.home} - ${m.score?.regularTime?.away}`);
        console.log(`  ExtraTime Score: ${m.score?.extraTime?.home} - ${m.score?.extraTime?.away}`);
        console.log(`  Penalties Score: ${m.score?.penalties?.home} - ${m.score?.penalties?.away}`);
        console.log(`  Winner: ${m.score?.winner}`);
      }
    });
  } catch (error) {
    console.error(error);
  }
}

run();

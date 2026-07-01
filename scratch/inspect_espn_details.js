import fs from 'fs';

async function test() {
  console.log("Fetching scoreboard from ESPN...");
  const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard');
  if (!response.ok) {
    console.log("ESPN API returned status:", response.status);
    return;
  }
  const data = await response.json();
  fs.writeFileSync('scratch/espn_scoreboard_dump.json', JSON.stringify(data, null, 2));
  console.log("Saved scoreboard dump to scratch/espn_scoreboard_dump.json");
}

test().catch(console.error);

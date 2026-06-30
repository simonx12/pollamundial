async function test() {
  console.log("Fetching scoreboard from ESPN...");
  const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard');
  if (!response.ok) {
    console.log("ESPN API returned status:", response.status);
    return;
  }
  const data = await response.json();
  const events = data.events || [];
  console.log("Response events count:", events.length);
  if (events.length > 0) {
    events.forEach(e => {
      const competition = e.competitions?.[0];
      const home = competition?.competitors?.find(t => t.homeAway === 'home');
      const away = competition?.competitors?.find(t => t.homeAway === 'away');
      console.log(`- Event: ${e.name} (${e.date})`);
      console.log(`  Home: ${home?.team?.name} (Abbr: ${home?.team?.abbreviation}) - Score: ${home?.score}`);
      console.log(`  Away: ${away?.team?.name} (Abbr: ${away?.team?.abbreviation}) - Score: ${away?.score}`);
      console.log(`  Status: ${competition?.status?.type?.name} (${competition?.status?.type?.detail})`);
    });
  } else {
    console.log("No events found in ESPN scoreboard.");
  }
}

test();

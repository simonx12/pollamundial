// Test scraping from different sources for World Cup scores

async function testScraping() {
  // Try ESPN API (unofficial but well-known)
  console.log('=== Testing ESPN API ===');
  try {
    const espnRes = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard');
    if (espnRes.ok) {
      const data = await espnRes.json();
      console.log('ESPN Events:', data.events?.length || 0);
      (data.events || []).forEach(e => {
        const c = e.competitions?.[0];
        const home = c?.competitors?.find(t => t.homeAway === 'home');
        const away = c?.competitors?.find(t => t.homeAway === 'away');
        console.log(`  ${home?.team?.name} ${home?.score} - ${away?.score} ${away?.team?.name} (${c?.status?.type?.name})`);
      });
    } else {
      console.log('ESPN Status:', espnRes.status);
    }
  } catch (e) { console.error('ESPN Error:', e.message); }

  // Try LiveScore API  
  console.log('\n=== Testing sofascore API ===');
  try {
    const today = new Date().toISOString().split('T')[0];
    const sofaRes = await fetch(`https://api.sofascore.com/api/v1/sport/football/scheduled-events/${today}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (sofaRes.ok) {
      const data = await sofaRes.json();
      const wcEvents = (data.events || []).filter(e => 
        e.tournament?.name?.toLowerCase().includes('world cup') || 
        e.tournament?.uniqueTournament?.name?.toLowerCase().includes('world cup')
      );
      console.log('World Cup events today:', wcEvents.length);
      wcEvents.forEach(e => {
        console.log(`  ${e.homeTeam?.name} ${e.homeScore?.current ?? '?'} - ${e.awayScore?.current ?? '?'} ${e.awayTeam?.name} (${e.status?.type})`);
      });
    } else {
      console.log('Sofa Status:', sofaRes.status, await sofaRes.text().catch(() => ''));
    }
  } catch (e) { console.error('Sofa Error:', e.message); }

  // Try the-odds-api or similar  
  console.log('\n=== Testing API-Football (free) ===');
  try {
    // api-football.com free tier
    const apifRes = await fetch('https://v3.football.api-sports.io/fixtures?league=1&season=2026&date=2026-06-11', {
      headers: { 'x-apisports-key': 'test' } // Won't work without key but let's see error
    });
    console.log('API-Football Status:', apifRes.status);
  } catch (e) { console.error('API-Football Error:', e.message); }
}

testScraping().catch(console.error);

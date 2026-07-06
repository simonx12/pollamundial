import { createClient } from '@supabase/supabase-js';
import { generateGroupMatches, generateKnockoutMatches, resolveKnockoutMatchTeams } from '../src/lib/worldcupData.js';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const FD_API_BASE = 'https://api.football-data.org/v4';
const FD_API_KEY = '7aced23f835e4d7b811ffb2981bc9b2c';
const fdHeaders = { 'X-Auth-Token': FD_API_KEY };

async function run() {
  // 1. Sign up/in to get authenticated role
  const email = `sync_admin_${Date.now()}@example.com`;
  const password = 'SyncPassword123!';
  
  console.log(`🔑 Authenticating as temporary user ${email}...`);
  const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password });
  if (authErr) {
    console.error("Authentication failed:", authErr.message);
    return;
  }
  const userId = authData.user.id;
  console.log(`✅ Authenticated with User ID: ${userId}`);

  try {
    // 2. Fetch all real match data from football-data.org API
    console.log("📡 Fetching matches from football-data.org...");
    const fdRes = await fetch(`${FD_API_BASE}/competitions/2000/matches`, { headers: fdHeaders });
    if (!fdRes.ok) {
      throw new Error(`Failed to fetch from football-data.org: ${fdRes.status}`);
    }
    const fdData = await fdRes.json();
    const apiMatches = fdData.matches || [];
    console.log(`Loaded ${apiMatches.length} matches from API.`);

    // 3. Clear all existing knockout results from Supabase
    console.log("🧹 Clearing old knockout results from database...");
    const { error: delErr } = await supabase
      .from('match_results')
      .delete()
      .like('match_id', 'KO-%');
    if (delErr) throw delErr;
    console.log("Old knockout results cleared.");

    // 4. Sequentially resolve and sync results stage-by-stage
    const stages = ['R32', 'R16', 'QF', 'SF', 'F'];
    
    for (const stage of stages) {
      console.log(`\n--- Processing stage: ${stage} ---`);
      
      // Query current database results (includes group matches and already-synced knockout matches)
      const { data: dbResults, error: dbErr } = await supabase
        .from('match_results')
        .select('*');
      if (dbErr) throw dbErr;
      
      // Resolve knockout matches based on current database results
      const rawKnockouts = generateKnockoutMatches();
      const resolvedKnockouts = resolveKnockoutMatchTeams(rawKnockouts, dbResults);
      
      // Filter for matches belonging to the current stage
      const stageMatches = resolvedKnockouts.filter(m => m.stage === stage);
      console.log(`Found ${stageMatches.length} matches in local definitions for ${stage}.`);

      for (const localMatch of stageMatches) {
        // Skip if team is unresolved (TBD)
        if (localMatch.homeCode === 'TBD' || localMatch.awayCode === 'TBD') {
          console.log(`  Match ${localMatch.id}: skipped (unresolved team)`);
          continue;
        }

        // Find match in API response
        const apiMatch = apiMatches.find(m => {
          const homeTla = m.homeTeam?.tla;
          const awayTla = m.awayTeam?.tla;
          if (homeTla !== localMatch.homeCode || awayTla !== localMatch.awayCode) return false;
          
          const diffMs = Math.abs(new Date(localMatch.date).getTime() - new Date(m.utcDate).getTime());
          return diffMs <= 24 * 60 * 60 * 1000;
        });

        if (!apiMatch) {
          console.log(`  Match ${localMatch.id} (${localMatch.homeCode} vs ${localMatch.awayCode}): not found in API`);
          continue;
        }

        const isFinished = apiMatch.status === 'FINISHED';
        const isLive = ['LIVE', 'IN_PLAY', 'PAUSED'].includes(apiMatch.status);
        
        if (!isFinished && !isLive) {
          console.log(`  Match ${localMatch.id} (${localMatch.homeCode} vs ${localMatch.awayCode}): not played yet (status: ${apiMatch.status})`);
          continue;
        }

        // Get scores (FullTime includes extra time / shootout score from football-data.org)
        let homeScore = apiMatch.score?.fullTime?.home;
        let awayScore = apiMatch.score?.fullTime?.away;

        if (homeScore === null || homeScore === undefined) {
          homeScore = apiMatch.score?.halfTime?.home;
          awayScore = apiMatch.score?.halfTime?.away;
        }

        if (homeScore === null || homeScore === undefined) {
          console.log(`  Match ${localMatch.id}: no scores available`);
          continue;
        }

        const status = isFinished ? 'FINISHED' : 'LIVE';
        console.log(`  Match ${localMatch.id}: saving ${localMatch.homeTeam} ${homeScore} - ${awayScore} ${localMatch.awayTeam} (${status})`);
        
        const { error: saveErr } = await supabase
          .from('match_results')
          .upsert({
            match_id: localMatch.id,
            home_score: homeScore,
            away_score: awayScore,
            status,
            updated_at: new Date().toISOString()
          }, { onConflict: 'match_id' });
          
        if (saveErr) {
          console.error(`  ❌ Failed to save result for ${localMatch.id}:`, saveErr.message);
        } else {
          console.log(`  ✅ Saved.`);
        }
      }
    }
    
    console.log("\n🎉 Database cleanup and sync complete!");
  } catch (error) {
    console.error("Fatal error during sync:", error);
  } finally {
    // 5. Clean up temporary profile
    console.log("🧹 Cleaning up temporary auth profile...");
    await supabase.from('profiles').delete().eq('id', userId);
    console.log("Done.");
  }
}

run();

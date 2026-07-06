import { createClient } from '@supabase/supabase-js';
import { generateGroupMatches, generateKnockoutMatches, resolveKnockoutMatchTeams } from '../src/lib/worldcupData.js';
import { syncLiveResultsToSupabase, getLiveScoreboard } from '../src/lib/footballApi.js';

// Mock localStorage
global.localStorage = {
  getItem: () => null,
  setItem: () => null
};

async function testSync() {
  console.log("Running syncLiveResultsToSupabase(true)...");
  try {
    const res = await syncLiveResultsToSupabase(true);
    console.log("Sync result:", res);
  } catch (error) {
    console.error("Sync error:", error);
  }
}

testSync();

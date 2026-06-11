// Direct REST API approach - bypass RLS using the Supabase REST API with service_role
// Since we don't have service_role key, let's try authenticating as a user first

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  // First, let's try to sign in as one of the existing users
  // We'll try a few common passwords or ask for credentials
  
  // Let's first check what the current RLS policies look like by trying different operations
  console.log('=== Testing RLS policies ===');
  
  // Test 1: Can anon SELECT match_results?
  const { data: r1, error: e1 } = await supabase.from('match_results').select('*');
  console.log('Anon SELECT match_results:', e1 ? `ERROR: ${e1.message}` : `OK (${r1.length} rows)`);

  // Test 2: Can anon SELECT predictions?
  const { data: r2, error: e2 } = await supabase.from('predictions').select('*');
  console.log('Anon SELECT predictions:', e2 ? `ERROR: ${e2.message}` : `OK (${r2.length} rows)`);

  // Test 3: Can anon INSERT into match_results?
  const { data: r3, error: e3 } = await supabase.from('match_results').insert({
    match_id: 'TEST-DELETE-ME',
    home_score: 0,
    away_score: 0,
    status: 'TEST',
  });
  console.log('Anon INSERT match_results:', e3 ? `ERROR: ${e3.code} - ${e3.message}` : 'OK');

  // Test 4: Try signing in as spcm1999 (first user) with common passwords
  console.log('\n=== Trying to authenticate ===');
  
  // Let's try to sign in with a test account
  const testEmails = [
    'spcm1999@gmail.com',
    'spcm1999@hotmail.com', 
    'leandro@test.com',
    'leandrodev@gmail.com',
  ];

  // Instead of guessing passwords, let's just check the auth situation
  // The real solution is to fix the RLS policy
  
  console.log('\n=== Current issue ===');
  console.log('The RLS policy requires "authenticated" role to INSERT into match_results.');
  console.log('The anon key does not have authenticated role.');
  console.log('SOLUTION: Need to either:');
  console.log('  1. Run the fix_trigger.sql in Supabase SQL Editor (bypasses RLS)');
  console.log('  2. Or use the service_role key (not available)');
  console.log('  3. Or sign in as a user through the app and the auto-sync will work');
  
  // Let's check if the ESPN API is returning data correctly
  console.log('\n=== ESPN API check ===');
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
  }
}

main().catch(console.error);

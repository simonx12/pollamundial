import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const email = `test_${Date.now()}@example.com`;
  const password = 'TestPassword123!';
  
  console.log(`Signing up with ${email}...`);
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email,
    password,
  });
  if (signUpErr) {
    console.error("Sign up failed:", signUpErr.message);
    return;
  }
  
  console.log("Sign up successful. User ID:", signUpData.user.id);

  // Test insert
  console.log("Testing insert as authenticated user...");
  const { data: insData, error: insErr } = await supabase
    .from('match_results')
    .insert({ match_id: 'TEST-AUTH-1', home_score: 0, away_score: 0, status: 'FINISHED' });
  if (insErr) {
    console.error("Insert failed for authenticated:", insErr.message);
  } else {
    console.log("Insert succeeded for authenticated:", insData);
    await supabase.from('match_results').delete().eq('match_id', 'TEST-AUTH-1');
  }

  // Cleanup user from profiles
  await supabase.from('profiles').delete().eq('id', signUpData.user.id);
}

test();

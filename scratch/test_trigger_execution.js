import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTriggerExecution() {
  const email = `tester_${Math.floor(Math.random() * 100000)}@yopmail.com`;
  const password = 'Password123!';
  
  console.log('Signing up tester user...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    console.error('Sign up error:', signUpError);
    return;
  }

  console.log('Tester session active. Attempting to insert match result for GS-A-1...');
  const { data, error } = await supabase
    .from('match_results')
    .upsert({
      match_id: 'GS-A-1',
      home_score: 1,
      away_score: 1,
      status: 'FINISHED',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'match_id' })
    .select();

  console.log('Result:', { data, error });
}

testTriggerExecution();

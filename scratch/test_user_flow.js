import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUserFlow() {
  const email = `testuser_${Date.now()}@yopmail.com`;
  const password = 'TestUser123!';
  const username = `test_${Math.floor(Math.random() * 1000)}`;

  console.log('1. Signing up user:', email);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } }
  });

  if (signUpError) {
    console.error('Sign Up Error:', signUpError);
    return;
  }

  const user = signUpData.user;
  console.log('User signed up. ID:', user.id);
  console.log('Session is present:', !!signUpData.session);

  // If email confirmation is enabled, we might not be logged in. Let's check.
  let activeSession = signUpData.session;
  if (!activeSession) {
    console.log('No session on signup (needs verification). Let us try to sign in with password.');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      console.error('Sign In Error (maybe confirmation is strictly required):', signInError.message);
      console.log('Let us assume email confirmation is required. Trying to sign in with an existing confirmed user or checking RLS policy...');
      return;
    }
    activeSession = signInData.session;
    console.log('Signed in. Session token exists:', !!activeSession);
  }

  // If we have a session, let's create a profile first (since profiles table might require it)
  console.log('\n2. Upserting profile for user...');
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      username: username,
      bet_amount: 20000,
    })
    .select();

  if (profileError) {
    console.error('Upsert profile error:', profileError);
  } else {
    console.log('Upsert profile success:', profileData);
  }

  // Now, try to save a prediction
  console.log('\n3. Upserting prediction for user...');
  const { data: predData, error: predError } = await supabase
    .from('predictions')
    .upsert({
      user_id: user.id,
      match_id: 'GS-A-1',
      home_score: 3,
      away_score: 1,
      updated_at: new Date().toISOString()
    })
    .select();

  if (predError) {
    console.error('Upsert prediction error:', predError);
  } else {
    console.log('Upsert prediction success:', predData);
  }

  // Clean up
  console.log('\n4. Cleaning up...');
  const { error: delProfErr } = await supabase.from('profiles').delete().eq('id', user.id);
  console.log('Delete profile result:', delProfErr ? delProfErr.message : 'OK');
  
  await supabase.auth.signOut();
  console.log('Signed out.');
}

testUserFlow().catch(console.error);

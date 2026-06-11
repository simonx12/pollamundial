import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignUp() {
  const email = `simontest_${Math.floor(Math.random() * 100000)}@yopmail.com`;
  const password = 'Password123!';
  const username = 'testuser_' + Math.floor(Math.random() * 1000);

  console.log(`Attempting signUp with Email: ${email}, Username: ${username}`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });

  if (error) {
    console.error('❌ Sign Up Error:', error.message, error);
    return;
  }

  console.log('✅ Sign Up Auth Success! User details:', data.user);
  console.log('Session details (will be null if email confirmation is required):', data.session);

  if (data.user) {
    // Try to create profile as the signed up user
    // Since we just signed up, if session is null, we are not logged in yet.
    // If we are not logged in, we are anonymous to the DB client unless we authenticate.
    // Let's see what happens when we try to insert a profile for this user.
    // Note: if confirmation is required, the client has no token for this user, so it tries as anon.
    console.log('Attempting to upsert profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        username: username,
        bet_amount: 0,
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('❌ Profile Creation Error:', profileError.message, profileError);
    } else {
      console.log('✅ Profile Creation Success! Profile:', profileData);
    }
  }
}

testSignUp();

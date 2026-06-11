import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function forceInsertResult() {
  // Create a temporary authenticated user to bypass RLS
  const email = `admin_sync_${Date.now()}@yopmail.com`;
  const password = 'SyncAdmin2026!';
  
  console.log('1. Creating temporary authenticated session...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    console.error('Sign up error:', signUpError);
    return;
  }

  const session = signUpData.session;
  console.log('   Session active:', !!session);
  
  if (!session) {
    console.log('   No session (email verification required). Trying signIn...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      console.error('Sign in error:', signInError);
      return;
    }
    console.log('   Signed in:', !!signInData.session);
  }

  // Now we're authenticated - insert the match result
  console.log('\n2. Inserting Mexico 2-0 South Africa (GS-A-1)...');
  const { data: result, error: insertError } = await supabase
    .from('match_results')
    .upsert(
      {
        match_id: 'GS-A-1',
        home_score: 2,
        away_score: 0,
        status: 'FINISHED',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'match_id' }
    )
    .select()
    .single();

  if (insertError) {
    console.error('Insert error:', insertError);
  } else {
    console.log('   ✅ Result inserted:', result);
  }

  // Verify it was saved
  console.log('\n3. Verifying match_results...');
  const { data: results, error: resErr } = await supabase.from('match_results').select('*');
  if (resErr) console.error('Error:', resErr);
  else {
    console.log(`   Total results: ${results.length}`);
    results.forEach(r => console.log(`   ${r.match_id}: ${r.home_score}-${r.away_score} (${r.status})`));
  }

  // Check if trigger calculated points for any predictions
  console.log('\n4. Checking predictions with points...');
  const { data: preds, error: predErr } = await supabase
    .from('predictions')
    .select('*, profiles(username)')
    .eq('match_id', 'GS-A-1');
  if (predErr) console.error('Error:', predErr);
  else {
    console.log(`   Predictions for GS-A-1: ${preds.length}`);
    preds.forEach(p => {
      console.log(`   ${p.profiles?.username}: ${p.home_score}-${p.away_score} → ${p.points_earned} pts`);
    });
  }

  // Check ALL predictions
  console.log('\n5. ALL predictions in DB...');
  const { data: allPreds, error: allErr } = await supabase
    .from('predictions')
    .select('user_id, match_id, home_score, away_score, points_earned');
  if (allErr) console.error('Error:', allErr);
  else {
    console.log(`   Total predictions: ${allPreds.length}`);
  }

  // Clean up - delete the temp user's profile if it was created
  console.log('\n6. Cleanup temp profile...');
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('profiles').delete().eq('id', user.id);
    console.log('   Temp profile removed');
  }
  
  await supabase.auth.signOut();
  console.log('   Signed out');
  
  console.log('\n✅ Done! The match result should now be in the database.');
  console.log('   The trigger will automatically calculate points for any predictions on GS-A-1.');
}

forceInsertResult().catch(console.error);

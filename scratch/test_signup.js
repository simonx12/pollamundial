import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Testing connection...');
  
  // Try to query profiles
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('*')
    .limit(5);
    
  if (pError) {
    console.error('Error fetching profiles:', pError);
  } else {
    console.log('Profiles fetched successfully:', profiles);
  }

  // Try to insert a dummy profile as anon
  const { data: insertData, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: '00000000-0000-0000-0000-000000000000',
      username: 'test_anon',
      bet_amount: 0
    });

  if (insertError) {
    console.error('Error inserting profile as anon (expected if RLS is on):', insertError.message);
  } else {
    console.log('Successfully inserted profile as anon:', insertData);
  }
}

run();

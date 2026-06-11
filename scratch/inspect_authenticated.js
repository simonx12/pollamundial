import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectAsAuthenticated() {
  // Sign up a temporary authenticated user to get a valid JWT session
  const email = `inspector_${Math.floor(Math.random() * 100000)}@yopmail.com`;
  const password = 'Password123!';
  
  console.log('Signing up temporary user...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    console.error('Sign up error:', signUpError);
    return;
  }

  const session = signUpData.session;
  console.log('Session active:', !!session);

  // If session is null (due to email verification), try to log in (sometimes it logs in directly, sometimes not)
  // Let's print out whatever we can get.
  
  // Let's query predictions
  const { data: predictions, error: predError } = await supabase
    .from('predictions')
    .select('*');
  console.log('Predictions fetched:', { count: predictions?.length, error: predError });

  // Let's query match results
  const { data: results, error: resError } = await supabase
    .from('match_results')
    .select('*');
  console.log('Match Results fetched:', { count: results?.length, results, error: resError });

  // Let's query audit logs
  const { data: logs, error: logError } = await supabase
    .from('audit_logs')
    .select('*')
    .limit(10);
  console.log('Audit Logs fetched:', { count: logs?.length, logs, error: logError });
}

inspectAsAuthenticated();

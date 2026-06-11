import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectMatchResultsAudit() {
  // Sign up a temporary authenticated user to get a valid JWT session to view logs
  const email = `inspector2_${Math.floor(Math.random() * 100000)}@yopmail.com`;
  const password = 'Password123!';
  
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    console.error('Sign up error:', signUpError);
    return;
  }

  // Query audit logs for match_results table
  const { data: logs, error: logError } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('table_name', 'match_results')
    .order('created_at', { ascending: false });
    
  console.log('Match Results Audit Logs:', { count: logs?.length, logs, error: logError });
}

inspectMatchResultsAudit();

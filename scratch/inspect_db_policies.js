import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectPolicies() {
  console.log('Fetching active database policies from pg_policies via RPC or raw query...');
  
  // Since we cannot run raw queries easily without an RPC, let's write a script that queries a RPC if any exists.
  // Wait, let's try to query the audit logs or profiles to see if the client connection is stable.
  // Wait, let's see if we can check which tables are queryable.
  const { data: results, error: resError } = await supabase.from('match_results').select('*');
  console.log('Match Results select check:', { data: results, error: resError });
}

inspectPolicies();

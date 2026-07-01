import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('table_name', 'match_results')
    .order('created_at', { ascending: false })
    .limit(20);
    
  if (error) {
    console.error(error);
    return;
  }
  
  console.log(`Found ${logs.length} audit logs for match_results:`);
  logs.forEach(l => {
    console.log(` - [${l.created_at}] Action: ${l.action} | Record: ${l.record_id} | Performed by: ${l.performed_by}`);
    console.log(`   New Data:`, l.new_data);
  });
}

run().catch(console.error);

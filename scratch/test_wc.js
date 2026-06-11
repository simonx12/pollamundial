import { createClient } from '@supabase/supabase-js';

const API_BASE = 'https://api.football-data.org/v4';
const API_KEY = '7aced23f835e4d7b811ffb2981bc9b2c';

const headers = {
  'X-Auth-Token': API_KEY,
};

async function testWC() {
  try {
    const response = await fetch(`${API_BASE}/competitions/WC/matches`, { headers });
    console.log('WC status:', response.status);
    const data = await response.json();
    console.log('Competition Name:', data.competition?.name);
    console.log('Matches Count:', data.matches?.length);
    if (data.matches && data.matches.length > 0) {
      console.log('Sample Match:', data.matches[0]);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

testWC();

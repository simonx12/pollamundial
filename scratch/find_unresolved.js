import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const worldcupJson = JSON.parse(fs.readFileSync(path.resolve('src/lib/worldcup.json'), 'utf8'));

// Mapeo oficial de los 48 equipos
const TEAM_MAPPING = {
  "Mexico": "MEX", "South Africa": "RSA", "South Korea": "KOR", "Czech Republic": "CZE",
  "Canada": "CAN", "Bosnia & Herzegovina": "BIH", "Qatar": "QAT", "Switzerland": "SUI",
  "Brazil": "BRA", "Morocco": "MAR", "Haiti": "HAI", "Scotland": "SCO",
  "USA": "USA", "Paraguay": "PAR", "Australia": "AUS", "Turkey": "TUR",
  "Germany": "GER", "Curaçao": "CUW", "Ivory Coast": "CIV", "Ecuador": "ECU",
  "Netherlands": "NED", "Japan": "JPN", "Sweden": "SWE", "Tunisia": "TUN",
  "Belgium": "BEL", "Egypt": "EGY", "Iran": "IRN", "New Zealand": "NZL",
  "Spain": "ESP", "Cape Verde": "CPV", "Saudi Arabia": "KSA", "Uruguay": "URU",
  "France": "FRA", "Senegal": "SEN", "Iraq": "IRQ", "Norway": "NOR",
  "Argentina": "ARG", "Algeria": "ALG", "Austria": "AUT", "Jordan": "JOR",
  "Portugal": "POR", "DR Congo": "COD", "Uzbekistan": "UZB", "Colombia": "COL",
  "England": "ENG", "Croatia": "CRO", "Ghana": "GHA", "Panama": "PAN"
};

const GROUPS = {
  A: ["MEX", "RSA", "KOR", "CZE"],
  B: ["CAN", "BIH", "QAT", "SUI"],
  C: ["BRA", "MAR", "HAI", "SCO"],
  D: ["USA", "PAR", "AUS", "TUR"],
  E: ["GER", "CUW", "CIV", "ECU"],
  F: ["NED", "JPN", "SWE", "TUN"],
  G: ["BEL", "EGY", "IRN", "NZL"],
  H: ["ESP", "CPV", "KSA", "URU"],
  I: ["FRA", "SEN", "IRQ", "NOR"],
  J: ["ARG", "ALG", "AUT", "JOR"],
  K: ["POR", "COD", "UZB", "COL"],
  L: ["ENG", "CRO", "GHA", "PAN"]
};

// Build maps
const stageMap = {
  'Round of 32': 'R32', 'Round of 16': 'R16',
  'Quarter-final': 'QF', 'Semi-final': 'SF', 'Final': 'F',
};

const MATCH_NUM_TO_ID = {};
const counts = {};
worldcupJson.matches.forEach(m => {
  if (m.group || !m.num) return;
  const stage = stageMap[m.round];
  if (!stage) return;
  counts[stage] = (counts[stage] || 0) + 1;
  MATCH_NUM_TO_ID[m.num] = `KO-${stage}-${counts[stage]}`;
});

function formatKnockoutTeam(teamStr) {
  if (!teamStr) return 'TBD';
  const groupRankMatch = teamStr.match(/^([12])([A-L])$/);
  if (groupRankMatch) return `${groupRankMatch[1] === '1' ? '1°' : '2°'} Grupo ${groupRankMatch[2]}`;
  if (teamStr.startsWith('3')) return `3° Gr. ${teamStr.substring(1)}`;
  if (teamStr.startsWith('W')) return `Ganador P${teamStr.substring(1)}`;
  if (teamStr.startsWith('L')) return `Perdedor P${teamStr.substring(1)}`;
  return teamStr;
}

async function run() {
  const { data: results, error } = await supabase.from('match_results').select('*');
  if (error) throw error;

  const resultMap = {};
  results.forEach(r => { resultMap[r.match_id] = r; });

  // Group standings
  const standings = {};
  Object.keys(GROUPS).forEach(g => {
    standings[g] = GROUPS[g].map(code => ({
      code, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0
    }));
  });

  // Fetch group matches from JSON
  const groupMatches = [];
  const groupMatchCounts = {};
  worldcupJson.matches.forEach(match => {
    if (match.group) {
      const g = match.group.replace('Group ', '');
      const t1 = TEAM_MAPPING[match.team1];
      const t2 = TEAM_MAPPING[match.team2];
      groupMatches.push({ id: `GS-${g}-${(groupMatchCounts[g] = (groupMatchCounts[g] || 0) + 1)}`, homeCode: t1, awayCode: t2, group: g });
    }
  });

  groupMatches.forEach(match => {
    const res = resultMap[match.id];
    if (!res) return;
    const g = match.group;
    const h = standings[g].find(t => t.code === match.homeCode);
    const a = standings[g].find(t => t.code === match.awayCode);
    if (!h || !a) return;
    h.played++; a.played++;
    h.gf += res.home_score; h.ga += res.away_score;
    a.gf += res.away_score; a.ga += res.home_score;
    if (res.home_score > res.away_score) {
      h.won++; h.pts += 3; a.lost++;
    } else if (res.home_score < res.away_score) {
      a.won++; a.pts += 3; h.lost++;
    } else {
      h.drawn++; h.pts += 1; a.drawn++; a.pts += 1;
    }
    h.gd = h.gf - h.ga;
    a.gd = a.gf - a.ga;
  });

  Object.keys(standings).forEach(g => {
    standings[g].sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return 0;
    });
  });

  // Assign thirds
  const thirds = [];
  Object.keys(standings).forEach(g => { thirds.push({ ...standings[g][2], group: g }); });
  thirds.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return 0;
  });
  const best3rd = thirds.slice(0, 8);
  const thirdLookup = {};
  best3rd.forEach(t => { thirdLookup[t.group] = t.code; });
  const qualifiedGroups = best3rd.map(t => t.group);

  const officialThirds = ['B','D','E','F','I','J','K','L'];
  let thirdAssign = {};
  if (qualifiedGroups.sort().join(',') === officialThirds.sort().join(',')) {
    thirdAssign = {
      74: 'D', 77: 'F', 79: 'E', 80: 'K', 81: 'B', 82: 'I', 85: 'J', 87: 'L'
    };
  }

  function resolveTeamRef(teamStr, matchNum, resolvedByNum) {
    if (!teamStr) return null;
    const rankMatch = teamStr.match(/^([12])([A-L])$/);
    if (rankMatch) {
      const rank = parseInt(rankMatch[1]) - 1;
      return standings[rankMatch[2]]?.[rank]?.code || null;
    }
    const thirdMatch = teamStr.match(/^3([A-L/]+)$/);
    if (thirdMatch) {
      const assignedGroup = thirdAssign[matchNum];
      return assignedGroup ? (thirdLookup[assignedGroup] || null) : null;
    }
    const winMatch = teamStr.match(/^W(\d+)$/);
    if (winMatch) {
      const refNum = parseInt(winMatch[1]);
      const matchId = MATCH_NUM_TO_ID[refNum];
      const result = resultMap[matchId];
      const teams = resolvedByNum[refNum];
      if (!result || !teams) return null;
      if (result.home_score > result.away_score) return teams.home;
      if (result.away_score > result.home_score) return teams.away;
      return 'DRAW';
    }
    return null;
  }

  const resolvedByNum = {};
  const jsonKnockouts = worldcupJson.matches.filter(m => !m.group && m.num);
  const stageOrder = ['Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Final'];

  console.log('=== STAGE RESOLUTION TRACE ===');
  for (const stageName of stageOrder) {
    console.log(`\n--- ${stageName} ---`);
    const stageJsonMatches = jsonKnockouts.filter(m => m.round === stageName);
    for (const jm of stageJsonMatches) {
      const homeCode = resolveTeamRef(jm.team1, jm.num, resolvedByNum);
      const awayCode = resolveTeamRef(jm.team2, jm.num, resolvedByNum);
      resolvedByNum[jm.num] = { home: homeCode, away: awayCode };
      
      const matchId = MATCH_NUM_TO_ID[jm.num];
      const result = resultMap[matchId];
      const resultStr = result ? `${result.home_score} - ${result.away_score} (${result.status})` : 'NO_RESULT';
      
      console.log(`P${jm.num} (${matchId}): ${homeCode || 'TBD'} vs ${awayCode || 'TBD'} | Result: ${resultStr}`);
    }
  }
}

run().catch(console.error);

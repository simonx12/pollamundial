import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://yqzbgeipisgukybrglyn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxemJnZWlwaXNndWt5YnJnbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjE5MzUsImV4cCI6MjA5NDQzNzkzNX0.LaAU7oWruVySsDX0Tj2x5I0lUnONiSSsJK72ccgamzQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const worldcupJson = JSON.parse(fs.readFileSync('src/lib/worldcup.json', 'utf-8'));

// 48 teams mapping
const TEAM_MAPPING = {
  "Mexico": { name: "México", flag: "🇲🇽", code: "MEX" },
  "South Africa": { name: "Sudáfrica", flag: "🇿🇦", code: "RSA" },
  "South Korea": { name: "Corea del Sur", flag: "🇰🇷", code: "KOR" },
  "Czech Republic": { name: "República Checa", flag: "🇨🇿", code: "CZE" },
  "Canada": { name: "Canadá", flag: "🇨🇦", code: "CAN" },
  "Bosnia & Herzegovina": { name: "Bosnia-Herzegovina", flag: "🇧🇦", code: "BIH" },
  "Qatar": { name: "Catar", flag: "🇶🇦", code: "QAT" },
  "Switzerland": { name: "Suiza", flag: "🇨🇭", code: "SUI" },
  "Brazil": { name: "Brasil", flag: "🇧🇷", code: "BRA" },
  "Morocco": { name: "Marruecos", flag: "🇲🇦", code: "MAR" },
  "Haiti": { name: "Haití", flag: "🇭🇹", code: "HAI" },
  "Scotland": { name: "Escocia", flag: "🏴" , code: "SCO" },
  "USA": { name: "Estados Unidos", flag: "🇺🇸", code: "USA" },
  "Paraguay": { name: "Paraguay", flag: "🇵🇾", code: "PAR" },
  "Australia": { name: "Australia", flag: "🇦🇺", code: "AUS" },
  "Turkey": { name: "Turquía", flag: "🇹🇷", code: "TUR" },
  "Germany": { name: "Alemania", flag: "🇩🇪", code: "GER" },
  "Curaçao": { name: "Curazao", flag: "🇨🇼", code: "CUW" },
  "Ivory Coast": { name: "Costa de Marfil", flag: "🇨🇮", code: "CIV" },
  "Ecuador": { name: "Ecuador", flag: "🇪🇨", code: "ECU" },
  "Netherlands": { name: "Países Bajos", flag: "🇳🇱", code: "NED" },
  "Japan": { name: "Japón", flag: "🇯🇵", code: "JPN" },
  "Sweden": { name: "Suecia", flag: "🇸🇪", code: "SWE" },
  "Tunisia": { name: "Túnez", flag: "🇹🇳", code: "TUN" },
  "Belgium": { name: "Bélgica", flag: "🇧🇪", code: "BEL" },
  "Egypt": { name: "Egipto", flag: "🇪🇬", code: "EGY" },
  "Iran": { name: "Irán", flag: "🇮🇷", code: "IRN" },
  "New Zealand": { name: "Nueva Zelanda", flag: "🇳🇿", code: "NZL" },
  "Spain": { name: "España", flag: "🇪🇸", code: "ESP" },
  "Cape Verde": { name: "Cabo Verde", flag: "🇨🇻", code: "CPV" },
  "Saudi Arabia": { name: "Arabia Saudita", flag: "🇸🇦", code: "KSA" },
  "Uruguay": { name: "Uruguay", flag: "🇺🇾", code: "URU" },
  "France": { name: "Francia", flag: "🇫🇷", code: "FRA" },
  "Senegal": { name: "Senegal", flag: "🇸🇳", code: "SEN" },
  "Iraq": { name: "Irak", flag: "🇮🇶", code: "IRQ" },
  "Norway": { name: "Noruega", flag: "🇳🇴", code: "NOR" },
  "Argentina": { name: "Argentina", flag: "🇦🇷", code: "ARG" },
  "Algeria": { name: "Argelia", flag: "🇩🇿", code: "ALG" },
  "Austria": { name: "Austria", flag: "🇦🇹", code: "AUT" },
  "Jordan": { name: "Jordania", flag: "🇯🇴", code: "JOR" },
  "Portugal": { name: "Portugal", flag: "🇵🇹", code: "POR" },
  "DR Congo": { name: "R. D. Congo", flag: "🇨🇩", code: "COD" },
  "Uzbekistan": { name: "Uzbekistán", flag: "🇺🇿", code: "UZB" },
  "Colombia": { name: "Colombia", flag: "🇨🇴", code: "COL" },
  "England": { name: "Inglaterra", flag: "🏴" , code: "ENG" },
  "Croatia": { name: "Croacia", flag: "🇭🇷", code: "CRO" },
  "Ghana": { name: "Ghana", flag: "🇬🇭", code: "GHA" },
  "Panama": { name: "Panamá", flag: "🇵🇦", code: "PAN" }
};

const TEAMS = {};
Object.entries(TEAM_MAPPING).forEach(([englishName, teamInfo]) => {
  TEAMS[teamInfo.code] = teamInfo;
});

const GROUPS = {
  A: [], B: [], C: [], D: [], E: [], F: [],
  G: [], H: [], I: [], J: [], K: [], L: []
};

worldcupJson.matches.forEach((match) => {
  if (match.group) {
    const groupLetter = match.group.replace('Group ', '');
    const team1Info = TEAM_MAPPING[match.team1];
    const team2Info = TEAM_MAPPING[match.team2];
    if (team1Info && !GROUPS[groupLetter].includes(team1Info.code)) {
      GROUPS[groupLetter].push(team1Info.code);
    }
    if (team2Info && !GROUPS[groupLetter].includes(team2Info.code)) {
      GROUPS[groupLetter].push(team2Info.code);
    }
  }
});

function generateGroupMatches() {
  const matches = [];
  const groupMatchCounts = {};
  worldcupJson.matches.forEach((match) => {
    if (match.group) {
      const groupLetter = match.group.replace('Group ', '');
      const team1Info = TEAM_MAPPING[match.team1] || { name: match.team1, code: 'TBD' };
      const team2Info = TEAM_MAPPING[match.team2] || { name: match.team2, code: 'TBD' };

      if (!groupMatchCounts[groupLetter]) groupMatchCounts[groupLetter] = 0;
      groupMatchCounts[groupLetter]++;
      matches.push({
        id: `GS-${groupLetter}-${groupMatchCounts[groupLetter]}`,
        homeCode: team1Info.code,
        awayCode: team2Info.code,
        group: `Grupo ${groupLetter}`,
        stage: 'GROUP_STAGE',
      });
    }
  });
  return matches;
}

function calculateGroupStandings(matchResults) {
  const groupMatches = generateGroupMatches();
  const resultMap = {};
  matchResults.forEach(r => { resultMap[r.match_id] = r; });

  const standings = {};
  Object.keys(GROUPS).forEach(g => {
    standings[g] = {};
    GROUPS[g].forEach(code => {
      standings[g][code] = { code, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
    });
  });

  groupMatches.forEach(match => {
    const res = resultMap[match.id];
    if (!res) return;
    const g = match.group.replace('Grupo ', '');
    const h = standings[g]?.[match.homeCode];
    const a = standings[g]?.[match.awayCode];
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

  const sorted = {};
  Object.keys(standings).forEach(g => {
    sorted[g] = Object.values(standings[g]).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return 0;
    });
  });
  return sorted;
}

function getBest3rdPlaceTeams(standings) {
  const thirds = [];
  Object.keys(standings).forEach(g => {
    if (standings[g].length >= 3) {
      thirds.push({ ...standings[g][2], group: g });
    }
  });
  thirds.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return 0;
  });
  return thirds.slice(0, 8);
}

const THIRD_PLACE_SLOTS = [
  { num: 74, possibleGroups: ['A','B','C','D','F'] },
  { num: 77, possibleGroups: ['C','D','F','G','H'] },
  { num: 79, possibleGroups: ['C','E','F','H','I'] },
  { num: 80, possibleGroups: ['E','H','I','J','K'] },
  { num: 81, possibleGroups: ['B','E','F','I','J'] },
  { num: 82, possibleGroups: ['A','E','H','I','J'] },
  { num: 85, possibleGroups: ['E','F','G','I','J'] },
  { num: 87, possibleGroups: ['D','E','I','J','L'] },
];

function assign3rdPlaceToSlots(qualifiedGroups) {
  const assigned = {};
  const used = new Set();
  const slots = [...THIRD_PLACE_SLOTS].sort((a, b) => {
    const aOpts = a.possibleGroups.filter(g => qualifiedGroups.includes(g)).length;
    const bOpts = b.possibleGroups.filter(g => qualifiedGroups.includes(g)).length;
    return aOpts - bOpts;
  });

  function solve(i) {
    if (i === slots.length) return true;
    const slot = slots[i];
    for (const g of slot.possibleGroups) {
      if (!qualifiedGroups.includes(g) || used.has(g)) continue;
      assigned[slot.num] = g;
      used.add(g);
      if (solve(i + 1)) return true;
      delete assigned[slot.num];
      used.delete(g);
    }
    return false;
  }
  solve(0);
  return assigned;
}

function generateKnockoutMatches() {
  const matches = [];
  const STAGE_MAPPING = {
    "Round of 32": { stage: "R32", name: "Dieciseisavos" },
    "Round of 16": { stage: "R16", name: "Octavos" },
  };
  let count = 0;
  worldcupJson.matches.forEach((match) => {
    if (!match.group && match.round === "Round of 32") {
      count++;
      matches.push({
        id: `KO-R32-${count}`,
        num: match.num,
        team1: match.team1,
        team2: match.team2,
      });
    }
  });
  return matches;
}

async function run() {
  const { data: results, error } = await supabase.from('match_results').select('*');
  if (error) {
    console.error(error);
    return;
  }

  const standings = calculateGroupStandings(results);
  const best3rd = getBest3rdPlaceTeams(standings);
  const qualifiedGroups = best3rd.map(t => t.group);
  const thirdLookup = {};
  best3rd.forEach(t => { thirdLookup[t.group] = t.code; });
  const thirdAssign = assign3rdPlaceToSlots(qualifiedGroups);

  const rawKnockouts = generateKnockoutMatches();
  
  console.log('--- RESOLVED R32 MATCH DETAILS ---');
  rawKnockouts.forEach(m => {
    // Resolve team1 code
    let homeCode = null;
    const rankMatch1 = m.team1.match(/^([12])([A-L])$/);
    if (rankMatch1) {
      const rank = parseInt(rankMatch1[1]) - 1;
      homeCode = standings[rankMatch1[2]]?.[rank]?.code || null;
    }
    
    // Resolve team2 code
    let awayCode = null;
    const rankMatch2 = m.team2.match(/^([12])([A-L])$/);
    if (rankMatch2) {
      const rank = parseInt(rankMatch2[1]) - 1;
      awayCode = standings[rankMatch2[2]]?.[rank]?.code || null;
    } else if (m.team2.match(/^3([A-L/]+)$/)) {
      const assignedGroup = thirdAssign[m.num];
      awayCode = assignedGroup ? (thirdLookup[assignedGroup] || null) : null;
    }
    
    const dbResult = results.find(r => r.match_id === m.id);
    const scoreText = dbResult ? `${dbResult.home_score} - ${dbResult.away_score} (${dbResult.status})` : 'NO RESULT';
    
    console.log(`Match ${m.id} (${m.num}): ${TEAMS[homeCode]?.name || homeCode} (${homeCode}) vs ${TEAMS[awayCode]?.name || awayCode} (${awayCode}) | DB Result: ${scoreText}`);
  });
}

run().catch(console.error);

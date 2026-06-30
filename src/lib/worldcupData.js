/**
 * Datos del Mundial 2026 (USA, México, Canadá)
 * Conectado dinámicamente al calendario oficial de partidos (worldcup.json)
 */

import worldcupJson from './worldcup.json';

// Mapeo oficial de los 48 equipos del Mundial 2026
export const TEAM_MAPPING = {
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
  "Scotland": { name: "Escocia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", code: "SCO" },
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
  "England": { name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", code: "ENG" },
  "Croatia": { name: "Croacia", flag: "🇭🇷", code: "CRO" },
  "Ghana": { name: "Ghana", flag: "🇬🇭", code: "GHA" },
  "Panama": { name: "Panamá", flag: "🇵🇦", code: "PAN" }
};

// Generar diccionario TEAMS en base a códigos para compatibilidad
export const TEAMS = {};
Object.entries(TEAM_MAPPING).forEach(([englishName, teamInfo]) => {
  TEAMS[teamInfo.code] = teamInfo;
});

// Inicializar GROUPS
export const GROUPS = {
  A: [], B: [], C: [], D: [], E: [], F: [],
  G: [], H: [], I: [], J: [], K: [], L: []
};

// Mapear dinámicamente los equipos a sus respectivos grupos oficiales del JSON
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

// Helper para convertir la fecha y hora oficial a formato ISO con su timezone correspondiente
function parseMatchDateTime(dateStr, timeStr) {
  const [time, utc] = timeStr.split(' ');
  let timezoneOffset = 'Z';
  if (utc && utc.startsWith('UTC')) {
    const offset = utc.replace('UTC', '');
    if (offset.startsWith('+') || offset.startsWith('-')) {
      const hours = Math.abs(parseInt(offset, 10));
      const formattedHours = String(hours).padStart(2, '0');
      timezoneOffset = `${offset[0]}${formattedHours}:00`;
    }
  }
  return `${dateStr}T${time}:00${timezoneOffset}`;
}

/**
 * Genera los partidos de la fase de grupos dinámicamente desde el archivo oficial
 */
export function generateGroupMatches() {
  const matches = [];
  const groupMatchCounts = {};

  worldcupJson.matches.forEach((match) => {
    if (match.group) {
      const groupLetter = match.group.replace('Group ', '');
      const team1Info = TEAM_MAPPING[match.team1] || { name: match.team1, flag: '🏳️', code: 'TBD' };
      const team2Info = TEAM_MAPPING[match.team2] || { name: match.team2, flag: '🏳️', code: 'TBD' };

      if (!groupMatchCounts[groupLetter]) {
        groupMatchCounts[groupLetter] = 0;
      }
      groupMatchCounts[groupLetter]++;
      const matchNumber = groupMatchCounts[groupLetter];

      matches.push({
        id: `GS-${groupLetter}-${matchNumber}`,
        homeTeam: team1Info.name,
        awayTeam: team2Info.name,
        homeCode: team1Info.code,
        awayCode: team2Info.code,
        homeFlag: team1Info.flag,
        awayFlag: team2Info.flag,
        date: parseMatchDateTime(match.date, match.time),
        stage: 'GROUP_STAGE',
        group: `Grupo ${groupLetter}`,
        status: 'SCHEDULED',
        homeScore: null,
        awayScore: null,
        venue: match.ground || '',
      });
    }
  });

  return matches;
}

// Configuración de las etapas de eliminación directa
export const KNOCKOUT_STAGES = [
  { id: 'R32', name: 'Dieciseisavos', matches: 16 },
  { id: 'R16', name: 'Octavos', matches: 8 },
  { id: 'QF', name: 'Cuartos', matches: 4 },
  { id: 'SF', name: 'Semifinales', matches: 2 },
  { id: 'F', name: 'Final', matches: 1 },
];

const STAGE_MAPPING = {
  "Round of 32": { stage: "R32", name: "Dieciseisavos" },
  "Round of 16": { stage: "R16", name: "Octavos" },
  "Quarter-final": { stage: "QF", name: "Cuartos" },
  "Semi-final": { stage: "SF", name: "Semifinales" },
  "Match for third place": { stage: "3RD", name: "Tercer Puesto" },
  "Final": { stage: "F", name: "Final" }
};

// Formatea los textos de los placeholders para eliminatorias de TBD a un formato amigable en español
function formatKnockoutTeam(teamStr) {
  if (!teamStr) return 'TBD';
  
  // E.g. "1A", "2B", "1E"
  const groupRankMatch = teamStr.match(/^([12])([A-L])$/);
  if (groupRankMatch) {
    const rank = groupRankMatch[1];
    const group = groupRankMatch[2];
    return `${rank === '1' ? '1°' : '2°'} Grupo ${group}`;
  }
  
  // E.g. "3A/B/C/D/F"
  const thirdPlaceMatch = teamStr.match(/^3([A-L\/]+)$/);
  if (thirdPlaceMatch) {
    return `3° Gr. ${thirdPlaceMatch[1]}`;
  }
  
  // E.g. "W74", "W101" (Winner)
  const winnerMatch = teamStr.match(/^W(\d+)$/);
  if (winnerMatch) {
    return `Ganador P${winnerMatch[1]}`;
  }
  
  // E.g. "L101" (Loser)
  const loserMatch = teamStr.match(/^L(\d+)$/);
  if (loserMatch) {
    return `Perdedor P${loserMatch[1]}`;
  }
  
  return teamStr;
}

/**
 * Genera los partidos de eliminación directa (knockouts) dinámicamente del archivo oficial
 */
export function generateKnockoutMatches() {
  const matches = [];
  const stageCounts = {};

  worldcupJson.matches.forEach((match) => {
    if (!match.group) {
      const stageConfig = STAGE_MAPPING[match.round];
      if (stageConfig) {
        const stageId = stageConfig.stage;
        
        // El bracket del cliente dibuja R16, QF, SF, F. El tercer puesto lo podemos obviar del bracket visual
        // o mantenerlo por compatibilidad si es necesario.
        if (stageId === '3RD') return;

        if (!stageCounts[stageId]) {
          stageCounts[stageId] = 0;
        }
        stageCounts[stageId]++;
        const count = stageCounts[stageId];

        matches.push({
          id: `KO-${stageId}-${count}`,
          num: match.num || 104,
          homeTeam: formatKnockoutTeam(match.team1),
          awayTeam: formatKnockoutTeam(match.team2),
          homeCode: match.team1 || 'TBD',
          awayCode: match.team2 || 'TBD',
          homeFlag: '🏳️',
          awayFlag: '🏳️',
          date: parseMatchDateTime(match.date, match.time),
          stage: stageId,
          group: stageConfig.name,
          status: 'SCHEDULED',
          homeScore: null,
          awayScore: null,
          venue: match.ground || '',
        });
      }
    }
  });

  return matches;
}

/* ═══════════════════════════════════════════════════════════════
   SISTEMA DE RESOLUCIÓN DINÁMICA DEL BRACKET ELIMINATORIO
   Resuelve equipos reales a partir de resultados de fase de grupos
   ═══════════════════════════════════════════════════════════════ */

// Precalcular mapa matchNum ↔ matchId (es estático, depende solo del JSON)
function buildMatchNumToIdMap() {
  const map = {};
  const counts = {};
  const stageMap = {
    'Round of 32': 'R32', 'Round of 16': 'R16',
    'Quarter-final': 'QF', 'Semi-final': 'SF', 'Final': 'F',
  };

  worldcupJson.matches.forEach(m => {
    if (m.group || !m.num) return;
    const stage = stageMap[m.round];
    if (!stage) return;
    counts[stage] = (counts[stage] || 0) + 1;
    map[m.num] = `KO-${stage}-${counts[stage]}`;
  });

  return map;
}

export const MATCH_NUM_TO_ID = buildMatchNumToIdMap();

// Mapa inverso: matchId → matchNum
const MATCH_ID_TO_NUM = {};
Object.entries(MATCH_NUM_TO_ID).forEach(([num, id]) => {
  MATCH_ID_TO_NUM[id] = parseInt(num);
});

/**
 * Calcula las tablas de posiciones de todos los grupos a partir de match_results
 * @param {Array} matchResults - Resultados de Supabase [{match_id, home_score, away_score, status}]
 * @returns {Object} standings por grupo, cada grupo es un array ordenado de equipos
 */
export function calculateGroupStandings(matchResults) {
  const groupMatches = generateGroupMatches();
  const resultMap = {};
  matchResults.forEach(r => { resultMap[r.match_id] = r; });

  // Inicializar standings para cada grupo
  const standings = {};
  Object.keys(GROUPS).forEach(g => {
    standings[g] = {};
    GROUPS[g].forEach(code => {
      standings[g][code] = {
        code, played: 0, won: 0, drawn: 0, lost: 0,
        gf: 0, ga: 0, gd: 0, pts: 0,
      };
    });
  });

  // Procesar cada partido de grupos con resultado
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

  // Ordenar cada grupo: puntos → diferencia de gol → goles a favor
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

/**
 * Obtiene los 8 mejores terceros de entre los 12 grupos
 */
export function getBest3rdPlaceTeams(standings) {
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

// Definición de qué terceros pueden ir a cada slot de R32 (del JSON oficial)
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

/**
 * Asigna terceros a slots de R32 usando backtracking (constraint satisfaction)
 * @param {string[]} qualifiedGroups - Letras de los 8 grupos cuyos terceros clasificaron
 * @returns {Object} matchNum → grupo del tercer clasificado asignado
 */
function assign3rdPlaceToSlots(qualifiedGroups) {
  const assigned = {};
  const used = new Set();

  // Ordenar slots por restricción (menos opciones primero → más eficiente)
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

/**
 * Resuelve la referencia de un equipo en el JSON knockout a un código real
 * @param {string} teamStr - Ej: "1A", "2B", "3A/B/C/D/F", "W74", "L101"
 * @param {number} matchNum - Número del partido (para saber el slot de 3er puesto)
 * @param {Object} standings - Tablas de posiciones calculadas
 * @param {Object} thirdAssign - Asignación de terceros a slots
 * @param {Object} thirdLookup - Mapa grupo → código de equipo tercer clasificado
 * @param {Object} resolvedByNum - Equipos ya resueltos por número de partido
 * @param {Object} resultMap - Resultados reales por match_id
 */
function resolveTeamRef(teamStr, matchNum, standings, thirdAssign, thirdLookup, resolvedByNum, resultMap) {
  if (!teamStr) return null;

  // "1A" or "2B" → 1° o 2° del grupo
  const rankMatch = teamStr.match(/^([12])([A-L])$/);
  if (rankMatch) {
    const rank = parseInt(rankMatch[1]) - 1;
    const group = rankMatch[2];
    return standings[group]?.[rank]?.code || null;
  }

  // "3A/B/C/D/F" → 3er clasificado asignado a este slot
  const thirdMatch = teamStr.match(/^3([A-L/]+)$/);
  if (thirdMatch) {
    const assignedGroup = thirdAssign[matchNum];
    return assignedGroup ? (thirdLookup[assignedGroup] || null) : null;
  }

  // "W74" → ganador del partido 74
  const winMatch = teamStr.match(/^W(\d+)$/);
  if (winMatch) {
    const refNum = parseInt(winMatch[1]);
    const matchId = MATCH_NUM_TO_ID[refNum];
    if (!matchId) return null;
    const result = resultMap[matchId];
    const teams = resolvedByNum[refNum];
    if (!result || !teams) return null;
    if (result.home_score > result.away_score) return teams.home;
    if (result.away_score > result.home_score) return teams.away;
    // Empate en eliminatoria con penales: tratamos el home como ganador si scores son iguales
    // (la API debería reportar el score post-penales pero a veces no)
    return null;
  }

  // "L101" → perdedor del partido 101
  const loseMatch = teamStr.match(/^L(\d+)$/);
  if (loseMatch) {
    const refNum = parseInt(loseMatch[1]);
    const matchId = MATCH_NUM_TO_ID[refNum];
    if (!matchId) return null;
    const result = resultMap[matchId];
    const teams = resolvedByNum[refNum];
    if (!result || !teams) return null;
    if (result.home_score > result.away_score) return teams.away;
    if (result.away_score > result.home_score) return teams.home;
    return null;
  }

  return null;
}

/**
 * Función principal: toma los partidos de knockout (con placeholders) y los resultados,
 * y devuelve los mismos partidos pero con equipos reales resueltos.
 * 
 * @param {Array} knockoutMatches - Del generateKnockoutMatches()
 * @param {Array} matchResults - Resultados de Supabase [{match_id, home_score, away_score, status}]
 * @returns {Array} Partidos knockout con equipos reales donde sea posible
 */
export function resolveKnockoutMatchTeams(knockoutMatches, matchResults) {
  if (!matchResults || matchResults.length === 0) return knockoutMatches;

  // 1. Calcular standings de grupos
  const standings = calculateGroupStandings(matchResults);

  // Verificar si al menos hay partidos suficientes de grupos jugados
  // (necesitamos 3 partidos por equipo para standings completos, pero resolvemos lo que se pueda)
  const anyGroupHasResults = Object.values(standings).some(g =>
    g.some(team => team.played > 0)
  );
  if (!anyGroupHasResults) return knockoutMatches;

  // 2. Calcular mejores terceros y asignar a slots
  const best3rd = getBest3rdPlaceTeams(standings);
  const qualifiedGroups = best3rd.map(t => t.group);
  const thirdLookup = {};
  best3rd.forEach(t => { thirdLookup[t.group] = t.code; });
  const thirdAssign = assign3rdPlaceToSlots(qualifiedGroups);

  // 3. Construir mapa de resultados
  const resultMap = {};
  matchResults.forEach(r => { resultMap[r.match_id] = r; });

  // 4. Resolver equipos en orden de fase (R32 → R16 → QF → SF → F)
  const resolvedByNum = {};
  const jsonKnockouts = worldcupJson.matches.filter(m => !m.group && m.num);

  const stageOrder = ['Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Final'];

  for (const stageName of stageOrder) {
    const stageJsonMatches = jsonKnockouts.filter(m => m.round === stageName);

    for (const jm of stageJsonMatches) {
      const homeCode = resolveTeamRef(jm.team1, jm.num, standings, thirdAssign, thirdLookup, resolvedByNum, resultMap);
      const awayCode = resolveTeamRef(jm.team2, jm.num, standings, thirdAssign, thirdLookup, resolvedByNum, resultMap);
      resolvedByNum[jm.num] = { home: homeCode, away: awayCode };
    }
  }

  // 5. Mapear equipos resueltos de vuelta a los objetos de partidos
  return knockoutMatches.map(match => {
    const matchNum = MATCH_ID_TO_NUM[match.id];
    if (!matchNum) return match;

    const resolved = resolvedByNum[matchNum];
    if (!resolved) return match;

    const newMatch = { ...match };

    if (resolved.home && TEAMS[resolved.home]) {
      newMatch.homeTeam = TEAMS[resolved.home].name;
      newMatch.homeCode = resolved.home;
      newMatch.homeFlag = TEAMS[resolved.home].flag;
    }
    if (resolved.away && TEAMS[resolved.away]) {
      newMatch.awayTeam = TEAMS[resolved.away].name;
      newMatch.awayCode = resolved.away;
      newMatch.awayFlag = TEAMS[resolved.away].flag;
    }

    return newMatch;
  });
}

/**
 * Sistema de puntuación de la polla (Nueva regla 5-3-1 y multiplicadores por fase)
 */
export const SCORING = {
  EXACT: 5,        // Marcador exacto
  DIFFERENCE: 3,   // Ganador + diferencia exacta
  WINNER: 1,       // Solo ganador o empate
  WRONG: 0,        // Falló
};

export function getMatchMultiplier(matchId) {
  if (!matchId) return 1;
  if (matchId.startsWith('GS-')) return 1;
  if (matchId.startsWith('KO-R32-')) return 2;
  if (matchId.startsWith('KO-R16-')) return 2;
  if (matchId.startsWith('KO-QF-')) return 2;
  if (matchId.startsWith('KO-SF-')) return 3;
  if (matchId.startsWith('KO-3RD-')) return 3;
  if (matchId.startsWith('KO-F-')) return 4;
  return 1;
}

export function calculateMatchPoints(matchId, predHome, predAway, realHome, realAway) {
  const multiplier = getMatchMultiplier(matchId);
  
  if (predHome === realHome && predAway === realAway) {
    return SCORING.EXACT * multiplier;
  }
  
  const predResult = Math.sign(predHome - predAway);
  const realResult = Math.sign(realHome - realAway);
  
  if (predResult === realResult) {
    // Only apply difference points if there is a winner (not a draw)
    if (predResult !== 0 && (predHome - predAway) === (realHome - realAway)) {
      return SCORING.DIFFERENCE * multiplier;
    }
    return SCORING.WINNER * multiplier;
  }
  
  return SCORING.WRONG;
}

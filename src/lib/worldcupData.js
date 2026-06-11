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

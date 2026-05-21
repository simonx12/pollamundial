/**
 * Datos estáticos del Mundial 2026 (USA, México, Canadá)
 * 48 equipos en 12 grupos de 4
 * Estos datos se usan como fallback si la API no está disponible.
 * Se actualizan automáticamente cuando la API responde.
 */

export const TEAMS = {
  USA: { name: 'Estados Unidos', flag: '🇺🇸', code: 'USA' },
  MEX: { name: 'México', flag: '🇲🇽', code: 'MEX' },
  FRA: { name: 'Francia', flag: '🇫🇷', code: 'FRA' },
  RSA: { name: 'Sudáfrica', flag: '🇿🇦', code: 'RSA' },
  BRA: { name: 'Brasil', flag: '🇧🇷', code: 'BRA' },
  GER: { name: 'Alemania', flag: '🇩🇪', code: 'GER' },
  JPN: { name: 'Japón', flag: '🇯🇵', code: 'JPN' },
  NGA: { name: 'Nigeria', flag: '🇳🇬', code: 'NGA' },
  ARG: { name: 'Argentina', flag: '🇦🇷', code: 'ARG' },
  ENG: { name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', code: 'ENG' },
  KOR: { name: 'Corea del Sur', flag: '🇰🇷', code: 'KOR' },
  EGY: { name: 'Egipto', flag: '🇪🇬', code: 'EGY' },
  ESP: { name: 'España', flag: '🇪🇸', code: 'ESP' },
  NED: { name: 'Países Bajos', flag: '🇳🇱', code: 'NED' },
  AUS: { name: 'Australia', flag: '🇦🇺', code: 'AUS' },
  ECU: { name: 'Ecuador', flag: '🇪🇨', code: 'ECU' },
  POR: { name: 'Portugal', flag: '🇵🇹', code: 'POR' },
  BEL: { name: 'Bélgica', flag: '🇧🇪', code: 'BEL' },
  CAN: { name: 'Canadá', flag: '🇨🇦', code: 'CAN' },
  MAR: { name: 'Marruecos', flag: '🇲🇦', code: 'MAR' },
  ITA: { name: 'Italia', flag: '🇮🇹', code: 'ITA' },
  URU: { name: 'Uruguay', flag: '🇺🇾', code: 'URU' },
  COL: { name: 'Colombia', flag: '🇨🇴', code: 'COL' },
  CMR: { name: 'Camerún', flag: '🇨🇲', code: 'CMR' },
  CRO: { name: 'Croacia', flag: '🇭🇷', code: 'CRO' },
  DEN: { name: 'Dinamarca', flag: '🇩🇰', code: 'DEN' },
  PER: { name: 'Perú', flag: '🇵🇪', code: 'PER' },
  KSA: { name: 'Arabia Saudita', flag: '🇸🇦', code: 'KSA' },
  SRB: { name: 'Serbia', flag: '🇷🇸', code: 'SRB' },
  SUI: { name: 'Suiza', flag: '🇨🇭', code: 'SUI' },
  CHL: { name: 'Chile', flag: '🇨🇱', code: 'CHL' },
  GHA: { name: 'Ghana', flag: '🇬🇭', code: 'GHA' },
  POL: { name: 'Polonia', flag: '🇵🇱', code: 'POL' },
  SEN: { name: 'Senegal', flag: '🇸🇳', code: 'SEN' },
  CRC: { name: 'Costa Rica', flag: '🇨🇷', code: 'CRC' },
  TUN: { name: 'Túnez', flag: '🇹🇳', code: 'TUN' },
  SWE: { name: 'Suecia', flag: '🇸🇪', code: 'SWE' },
  WAL: { name: 'Gales', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', code: 'WAL' },
  IRN: { name: 'Irán', flag: '🇮🇷', code: 'IRN' },
  NZL: { name: 'Nueva Zelanda', flag: '🇳🇿', code: 'NZL' },
  UKR: { name: 'Ucrania', flag: '🇺🇦', code: 'UKR' },
  TUR: { name: 'Turquía', flag: '🇹🇷', code: 'TUR' },
  PAR: { name: 'Paraguay', flag: '🇵🇾', code: 'PAR' },
  ALG: { name: 'Argelia', flag: '🇩🇿', code: 'ALG' },
  CZE: { name: 'República Checa', flag: '🇨🇿', code: 'CZE' },
  NOR: { name: 'Noruega', flag: '🇳🇴', code: 'NOR' },
  HON: { name: 'Honduras', flag: '🇭🇳', code: 'HON' },
  QAT: { name: 'Catar', flag: '🇶🇦', code: 'QAT' },
};

export const GROUPS = {
  A: ['USA', 'MEX', 'FRA', 'RSA'],
  B: ['BRA', 'GER', 'JPN', 'NGA'],
  C: ['ARG', 'ENG', 'KOR', 'EGY'],
  D: ['ESP', 'NED', 'AUS', 'ECU'],
  E: ['POR', 'BEL', 'CAN', 'MAR'],
  F: ['ITA', 'URU', 'COL', 'CMR'],
  G: ['CRO', 'DEN', 'PER', 'KSA'],
  H: ['SRB', 'SUI', 'CHL', 'GHA'],
  I: ['POL', 'SEN', 'CRC', 'TUN'],
  J: ['SWE', 'WAL', 'IRN', 'NZL'],
  K: ['UKR', 'TUR', 'PAR', 'ALG'],
  L: ['CZE', 'NOR', 'HON', 'QAT'],
};

/**
 * Genera los partidos de la fase de grupos automáticamente
 * Cada grupo tiene 6 partidos (round-robin de 4 equipos)
 */
export function generateGroupMatches() {
  const matches = [];
  const baseDate = new Date('2026-06-11T18:00:00Z'); // Inicio del mundial
  let dayOffset = 0;
  let matchNumber = 1;

  Object.entries(GROUPS).forEach(([groupLetter, teamCodes]) => {
    // Generar todas las combinaciones de 2 equipos
    for (let i = 0; i < teamCodes.length; i++) {
      for (let j = i + 1; j < teamCodes.length; j++) {
        const home = TEAMS[teamCodes[i]];
        const away = TEAMS[teamCodes[j]];
        const matchDate = new Date(baseDate);
        matchDate.setDate(matchDate.getDate() + dayOffset);

        // Alternar horarios
        const hours = [15, 18, 21];
        const hourIndex = (matchNumber - 1) % 3;
        matchDate.setHours(hours[hourIndex], 0, 0, 0);

        matches.push({
          id: `GS-${groupLetter}-${matchNumber}`,
          homeTeam: home.name,
          awayTeam: away.name,
          homeCode: teamCodes[i],
          awayCode: teamCodes[j],
          homeFlag: home.flag,
          awayFlag: away.flag,
          date: matchDate.toISOString(),
          stage: 'GROUP_STAGE',
          group: `Grupo ${groupLetter}`,
          status: 'SCHEDULED',
          homeScore: null,
          awayScore: null,
        });

        matchNumber++;
        if (matchNumber % 4 === 0) dayOffset++;
      }
    }
    dayOffset++;
  });

  return matches.sort((a, b) => new Date(a.date) - new Date(b.date));
}

export const KNOCKOUT_STAGES = [
  { id: 'R32', name: 'Dieciseisavos', matches: 16 },
  { id: 'R16', name: 'Octavos', matches: 8 },
  { id: 'QF', name: 'Cuartos', matches: 4 },
  { id: 'SF', name: 'Semifinales', matches: 2 },
  { id: 'F', name: 'Final', matches: 1 },
];

/**
 * Genera los partidos de eliminación directa (placeholders)
 */
export function generateKnockoutMatches() {
  const matches = [];
  const baseDate = new Date('2026-06-28T20:00:00Z'); // Después de grupos
  let dayOffset = 0;

  KNOCKOUT_STAGES.forEach((stage, stageIdx) => {
    for (let i = 0; i < stage.matches; i++) {
      matches.push({
        id: `KO-${stage.id}-${i + 1}`,
        homeTeam: `Ganador M${i * 2 + 1}`,
        awayTeam: `Ganador M${i * 2 + 2}`,
        homeCode: 'TBD',
        awayCode: 'TBD',
        homeFlag: '🏳️',
        awayFlag: '🏳️',
        date: new Date(baseDate.getTime() + (dayOffset * 24 * 60 * 60 * 1000)).toISOString(),
        stage: stage.id,
        group: stage.name,
        status: 'SCHEDULED',
        homeScore: null,
        awayScore: null,
      });
      if (i % 4 === 0) dayOffset++;
    }
    dayOffset += 2;
  });

  return matches;
}

/**
 * Sistema de puntuación
 */
export const SCORING = {
  EXACT: 3,      // Marcador exacto
  WINNER: 1,     // Acertó ganador o empate
  WRONG: 0,      // Falló
};

export function calculateMatchPoints(predHome, predAway, realHome, realAway) {
  if (predHome === realHome && predAway === realAway) return SCORING.EXACT;
  const predResult = Math.sign(predHome - predAway);
  const realResult = Math.sign(realHome - realAway);
  if (predResult === realResult) return SCORING.WINNER;
  return SCORING.WRONG;
}

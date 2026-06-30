/**
 * Servicio para obtener datos del Mundial desde múltiples fuentes:
 * 1. ESPN API (gratuita, sin key, datos en tiempo real con scores)
 * 2. football-data.org (API v4, free tier - fallback)
 * 
 * La ESPN API es la fuente principal porque SÍ devuelve scores en tiempo real.
 */

import { generateGroupMatches, generateKnockoutMatches, resolveKnockoutMatchTeams, TEAM_MAPPING } from './worldcupData';
import { saveMatchResult, getAllMatchResults } from './supabase';

// ─── ESPN API (Primary Source) ───
const ESPN_API = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world';

// ─── football-data.org (Fallback) ───
const FD_API_BASE = 'https://api.football-data.org/v4';
const FD_API_KEY = import.meta.env.VITE_FOOTBALL_API_KEY;
const FD_COMPETITION_ID = 2000;
const fdHeaders = { 'X-Auth-Token': FD_API_KEY || '' };

// ─── Team name normalization for ESPN → local mapping ───
const ESPN_TEAM_NORMALIZE = {
  'mexico': 'MEX',
  'south africa': 'RSA',
  'south korea': 'KOR',
  'korea republic': 'KOR',
  'czech republic': 'CZE',
  'czechia': 'CZE',
  'canada': 'CAN',
  'bosnia-herzegovina': 'BIH',
  'bosnia and herzegovina': 'BIH',
  'qatar': 'QAT',
  'switzerland': 'SUI',
  'brazil': 'BRA',
  'morocco': 'MAR',
  'haiti': 'HAI',
  'scotland': 'SCO',
  'united states': 'USA',
  'usa': 'USA',
  'paraguay': 'PAR',
  'australia': 'AUS',
  'turkey': 'TUR',
  'türkiye': 'TUR',
  'germany': 'GER',
  'curaçao': 'CUW',
  'curacao': 'CUW',
  'ivory coast': 'CIV',
  "côte d'ivoire": 'CIV',
  'ecuador': 'ECU',
  'netherlands': 'NED',
  'japan': 'JPN',
  'sweden': 'SWE',
  'tunisia': 'TUN',
  'belgium': 'BEL',
  'egypt': 'EGY',
  'iran': 'IRN',
  'new zealand': 'NZL',
  'spain': 'ESP',
  'cape verde': 'CPV',
  'cabo verde': 'CPV',
  'saudi arabia': 'KSA',
  'uruguay': 'URU',
  'france': 'FRA',
  'senegal': 'SEN',
  'iraq': 'IRQ',
  'norway': 'NOR',
  'argentina': 'ARG',
  'algeria': 'ALG',
  'austria': 'AUT',
  'jordan': 'JOR',
  'portugal': 'POR',
  'dr congo': 'COD',
  'congo dr': 'COD',
  'dem. rep. congo': 'COD',
  'uzbekistan': 'UZB',
  'colombia': 'COL',
  'england': 'ENG',
  'croatia': 'CRO',
  'ghana': 'GHA',
  'panama': 'PAN',
};

function normalizeTeamName(name) {
  if (!name) return null;
  return ESPN_TEAM_NORMALIZE[name.toLowerCase()] || null;
}

/**
 * Obtener resultados en tiempo real desde ESPN API
 * @returns {Array|null} Array de matches normalizados o null si hay error
 */
export async function fetchEspnScoreboard() {
  try {
    const response = await fetch(`${ESPN_API}/scoreboard`);
    if (!response.ok) {
      console.warn('ESPN API error:', response.status);
      return null;
    }
    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error('Error fetching ESPN scoreboard:', error);
    return null;
  }
}

/**
 * Obtener resultados de fechas específicas desde ESPN
 */
export async function fetchEspnScoreboardByDate(dateStr) {
  try {
    // ESPN expects YYYYMMDD format
    const formatted = dateStr.replace(/-/g, '');
    const response = await fetch(`${ESPN_API}/scoreboard?dates=${formatted}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error('Error fetching ESPN by date:', error);
    return null;
  }
}

/**
 * Normaliza un evento ESPN a nuestro formato
 */
function normalizeEspnEvent(event) {
  const competition = event.competitions?.[0];
  if (!competition) return null;

  const home = competition.competitors?.find(t => t.homeAway === 'home');
  const away = competition.competitors?.find(t => t.homeAway === 'away');

  if (!home || !away) return null;

  const statusType = competition.status?.type?.name; // STATUS_FULL_TIME, STATUS_IN_PROGRESS, STATUS_SCHEDULED, STATUS_HALFTIME
  let status = 'SCHEDULED';
  if (statusType === 'STATUS_FULL_TIME') status = 'FINISHED';
  else if (['STATUS_IN_PROGRESS', 'STATUS_HALFTIME', 'STATUS_FIRST_HALF', 'STATUS_SECOND_HALF'].includes(statusType)) status = 'LIVE';

  return {
    homeTeamName: home.team?.name || 'TBD',
    awayTeamName: away.team?.name || 'TBD',
    homeCode: normalizeTeamName(home.team?.name) || home.team?.abbreviation,
    awayCode: normalizeTeamName(away.team?.name) || away.team?.abbreviation,
    homeScore: home.score != null ? parseInt(home.score, 10) : null,
    awayScore: away.score != null ? parseInt(away.score, 10) : null,
    status,
    statusDetail: competition.status?.type?.detail || '',
    date: event.date,
  };
}

/**
 * Sincroniza resultados reales con Supabase usando ESPN como fuente principal
 * y football-data.org como fallback.
 * 
 * @param {boolean} force - Si es true, ignora el throttle
 * @returns {Object} { success, updatedCount, reason? }
 */
export async function syncLiveResultsToSupabase(force = false) {
  // Throttling: solo permitir sincronizar una vez cada 30 segundos (más frecuente gracias a ESPN)
  const lastSync = localStorage.getItem('last_results_sync');
  const now = Date.now();
  if (!force && lastSync && (now - parseInt(lastSync, 10)) < 30000) {
    console.log('⏳ Sincronización omitida (throttle activo).');
    return { success: false, reason: 'THROTTLED' };
  }

  localStorage.setItem('last_results_sync', now.toString());
  console.log('🔄 Iniciando sincronización de resultados...');

  // Get all local matches — resolve knockout teams using existing results
  const existingResults = await getAllMatchResults().catch(() => []);
  const rawKnockouts = generateKnockoutMatches();
  const resolvedKnockouts = resolveKnockoutMatchTeams(rawKnockouts, existingResults);
  const localMatches = [
    ...generateGroupMatches(),
    ...resolvedKnockouts,
  ];

  let updatedCount = 0;

  // ─── Source 1: ESPN API (primary) ───
  console.log('📡 Intentando ESPN API...');
  const espnEvents = await fetchEspnScoreboard();

  if (espnEvents && espnEvents.length > 0) {
    // Also try fetching today's and yesterday's dates for more coverage
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    let allEvents = [...espnEvents];
    
    // Fetch yesterday too in case matches just ended
    const yesterdayEvents = await fetchEspnScoreboardByDate(yesterday);
    if (yesterdayEvents) {
      // Deduplicate by checking if event already exists
      const existingIds = new Set(allEvents.map(e => e.id));
      yesterdayEvents.forEach(e => {
        if (!existingIds.has(e.id)) allEvents.push(e);
      });
    }

    for (const event of allEvents) {
      const normalized = normalizeEspnEvent(event);
      if (!normalized) continue;
      if (normalized.status !== 'FINISHED' && normalized.status !== 'LIVE') continue;
      if (normalized.homeScore === null || normalized.awayScore === null) continue;

      // Find matching local match
      const localMatch = localMatches.find(m =>
        (m.homeCode === normalized.homeCode && m.awayCode === normalized.awayCode)
      );

      if (!localMatch) {
        console.log(`  ⚠️ No local match found for ${normalized.homeTeamName} vs ${normalized.awayTeamName} (${normalized.homeCode} vs ${normalized.awayCode})`);
        continue;
      }

      // Evitar guardar resultados de partidos futuros (permitimos 2 horas de margen)
      const matchTime = new Date(localMatch.date).getTime();
      if (matchTime > Date.now() + 2 * 60 * 60 * 1000) {
        console.log(`  ⏳ Omitiendo partido futuro ${localMatch.id}`);
        continue;
      }

      try {
        const status = normalized.status === 'FINISHED' ? 'FINISHED' : 'LIVE';
        await saveMatchResult(localMatch.id, normalized.homeScore, normalized.awayScore, status);
        updatedCount++;
        console.log(`  ✅ ${localMatch.id}: ${normalized.homeTeamName} ${normalized.homeScore}-${normalized.awayScore} ${normalized.awayTeamName} (${status})`);
      } catch (err) {
        console.warn(`  ❌ Error saving ${localMatch.id}:`, err.message);
      }
    }
  } else {
    console.log('  ESPN API no disponible, intentando football-data.org...');
  }

  // ─── Source 2: football-data.org (fallback) ───
  if (updatedCount === 0 && FD_API_KEY) {
    console.log('📡 Intentando football-data.org...');
    try {
      const url = `${FD_API_BASE}/competitions/${FD_COMPETITION_ID}/matches`;
      const response = await fetch(url, { headers: fdHeaders });
      if (response.ok) {
        const data = await response.json();
        const apiMatches = data.matches || [];

        for (const apiMatch of apiMatches) {
          const isFinished = apiMatch.status === 'FINISHED';
          const isLive = ['LIVE', 'IN_PLAY', 'PAUSED'].includes(apiMatch.status);
          if (!isFinished && !isLive) continue;

          const homeCode = apiMatch.homeTeam?.tla;
          const awayCode = apiMatch.awayTeam?.tla;
          if (!homeCode || !awayCode) continue;

          const localMatch = localMatches.find(m =>
            m.homeCode === homeCode && m.awayCode === awayCode
          );
          if (!localMatch) continue;

          // Evitar guardar resultados de partidos futuros (permitimos 2 horas de margen)
          const matchTime = new Date(localMatch.date).getTime();
          if (matchTime > Date.now() + 2 * 60 * 60 * 1000) {
            console.log(`  ⏳ Omitiendo partido futuro ${localMatch.id}`);
            continue;
          }

          // Try fullTime, then halfTime as fallback
          let homeScore = apiMatch.score?.fullTime?.home;
          let awayScore = apiMatch.score?.fullTime?.away;

          if (homeScore === null || homeScore === undefined) {
            homeScore = apiMatch.score?.halfTime?.home;
            awayScore = apiMatch.score?.halfTime?.away;
          }

          if (homeScore === null || homeScore === undefined) continue;

          try {
            const status = isFinished ? 'FINISHED' : 'LIVE';
            await saveMatchResult(localMatch.id, homeScore, awayScore, status);
            updatedCount++;
          } catch (err) {
            console.warn(`  ❌ Error saving from FD:`, err.message);
          }
        }
      }
    } catch (err) {
      console.error('football-data.org error:', err);
    }
  }

  console.log(`✅ Sincronización completa. ${updatedCount} partidos procesados.`);
  return { success: true, updatedCount };
}

/**
 * Obtener el estado actual del scoreboard para mostrar en la UI
 * Retorna los partidos con scores actuales sin escribir a la DB
 */
export async function getLiveScoreboard() {
  const events = await fetchEspnScoreboard();
  if (!events) return [];
  return events.map(normalizeEspnEvent).filter(Boolean);
}

/**
 * Verificar si la API está disponible
 */
export async function checkApiHealth() {
  try {
    const response = await fetch(`${ESPN_API}/scoreboard`);
    return { ok: response.ok, status: response.status, source: 'ESPN' };
  } catch {
    return { ok: false, reason: 'NETWORK_ERROR', source: 'ESPN' };
  }
}

// Legacy exports for backward compatibility
export async function fetchMatches(status = null) {
  try {
    let url = `${FD_API_BASE}/competitions/${FD_COMPETITION_ID}/matches`;
    if (status) url += `?status=${status}`;
    const response = await fetch(url, { headers: fdHeaders });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    return data.matches || [];
  } catch (error) {
    console.error('Error fetching matches from FD API:', error);
    return null;
  }
}

export async function fetchFinishedMatches() { return fetchMatches('FINISHED'); }
export async function fetchScheduledMatches() { return fetchMatches('SCHEDULED'); }
export async function fetchLiveMatches() { return fetchMatches('LIVE,IN_PLAY,PAUSED'); }

export async function fetchStandings() {
  try {
    const url = `${FD_API_BASE}/competitions/${FD_COMPETITION_ID}/standings`;
    const response = await fetch(url, { headers: fdHeaders });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    return data.standings || [];
  } catch (error) {
    console.error('Error fetching standings:', error);
    return null;
  }
}

export function normalizeApiMatch(apiMatch) {
  return {
    id: `API-${apiMatch.id}`,
    apiId: apiMatch.id,
    homeTeam: apiMatch.homeTeam?.name || 'TBD',
    awayTeam: apiMatch.awayTeam?.name || 'TBD',
    homeFlag: apiMatch.homeTeam?.crest || '',
    awayFlag: apiMatch.awayTeam?.crest || '',
    date: apiMatch.utcDate,
    stage: apiMatch.stage,
    group: apiMatch.group ? apiMatch.group.replace('GROUP_', 'Grupo ') : apiMatch.stage,
    status: apiMatch.status,
    homeScore: apiMatch.score?.fullTime?.home,
    awayScore: apiMatch.score?.fullTime?.away,
    venue: apiMatch.venue || '',
  };
}

export async function syncMatchesFromApi() {
  const apiMatches = await fetchMatches();
  if (!apiMatches) return null;
  return apiMatches.map(normalizeApiMatch);
}

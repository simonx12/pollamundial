/**
 * Servicio para obtener datos del Mundial desde football-data.org (API v4)
 * Documentación: https://www.football-data.org/documentation/quickstart
 * 
 * Competición FIFA World Cup = código "WC" (id: 2001)
 * Free tier: 10 peticiones/minuto
 */

const API_BASE = 'https://api.football-data.org/v4';
const API_KEY = import.meta.env.VITE_FOOTBALL_API_KEY;
const COMPETITION_ID = 2001; // FIFA World Cup

const headers = {
  'X-Auth-Token': API_KEY || '',
};

/**
 * Obtener todos los partidos del Mundial
 */
export async function fetchMatches(status = null) {
  try {
    let url = `${API_BASE}/competitions/${COMPETITION_ID}/matches`;
    if (status) url += `?status=${status}`;

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.matches || [];
  } catch (error) {
    console.error('Error fetching matches from API:', error);
    return null; // null = error, [] = sin resultados
  }
}

/**
 * Obtener partidos finalizados
 */
export async function fetchFinishedMatches() {
  return fetchMatches('FINISHED');
}

/**
 * Obtener partidos programados
 */
export async function fetchScheduledMatches() {
  return fetchMatches('SCHEDULED');
}

/**
 * Obtener partidos en vivo
 */
export async function fetchLiveMatches() {
  return fetchMatches('LIVE,IN_PLAY,PAUSED');
}

/**
 * Obtener standings/grupos
 */
export async function fetchStandings() {
  try {
    const url = `${API_BASE}/competitions/${COMPETITION_ID}/standings`;
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    return data.standings || [];
  } catch (error) {
    console.error('Error fetching standings:', error);
    return null;
  }
}

/**
 * Normaliza un partido de la API al formato de nuestra app
 */
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
    status: apiMatch.status, // SCHEDULED, LIVE, IN_PLAY, PAUSED, FINISHED
    homeScore: apiMatch.score?.fullTime?.home,
    awayScore: apiMatch.score?.fullTime?.away,
    venue: apiMatch.venue || '',
  };
}

/**
 * Sync: obtener todos los partidos y normalizar
 */
export async function syncMatchesFromApi() {
  const apiMatches = await fetchMatches();
  if (!apiMatches) return null;
  return apiMatches.map(normalizeApiMatch);
}

/**
 * Verificar si la API está disponible
 */
export async function checkApiHealth() {
  if (!API_KEY) return { ok: false, reason: 'NO_API_KEY' };
  try {
    const response = await fetch(`${API_BASE}/competitions/${COMPETITION_ID}`, { headers });
    return { ok: response.ok, status: response.status };
  } catch {
    return { ok: false, reason: 'NETWORK_ERROR' };
  }
}

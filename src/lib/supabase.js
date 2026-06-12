import { createClient } from '@supabase/supabase-js';
import { getMatchMultiplier } from './worldcupData';
import { getCache, setCache, invalidateCache } from './cache';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔌 Conectando a Supabase URL:', supabaseUrl ? 'OK' : 'MISSING');
console.log('🔑 Supabase Anon Key:', supabaseAnonKey ? 'OK' : 'MISSING');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase no está configurado. Crea un archivo .env con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

/* ─── Profiles ─── */
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('username');
  if (error) throw error;
  return data;
}

/* ─── Predictions ─── */
export async function savePrediction(userId, matchId, homeScore, awayScore) {
  const { data, error } = await supabase
    .from('predictions')
    .upsert(
      {
        user_id: userId,
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,match_id' }
    )
    .select()
    .single();
  if (error) throw error;
  
  // Invalidate cache
  invalidateCache(`predictions_${userId}`);
  return data;
}

export async function getUserPredictions(userId) {
  const cacheKey = `predictions_${userId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  
  setCache(cacheKey, data, 2 * 60 * 1000); // 2 minutes TTL
  return data;
}

export async function getAllPredictionsForMatch(matchId) {
  const { data, error } = await supabase
    .from('predictions')
    .select('*, profiles(username, avatar_url)')
    .eq('match_id', matchId);
  if (error) throw error;
  return data;
}

/* ─── Match Results ─── */
export async function saveMatchResult(matchId, homeScore, awayScore, status) {
  const { data, error } = await supabase
    .from('match_results')
    .upsert(
      {
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'match_id' }
    )
    .select()
    .single();
  if (error) throw error;
  
  // Invalidate caches
  invalidateCache('match_results_all');
  invalidateCache('leaderboard');
  return data;
}

export async function getAllMatchResults() {
  const cacheKey = 'match_results_all';
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('match_results')
    .select('*');
  if (error) throw error;
  
  setCache(cacheKey, data, 1 * 60 * 1000); // 1 minute TTL
  return data;
}

/* ─── Leaderboard (puntos) ─── */
export async function getLeaderboard() {
  const cacheKey = 'leaderboard';
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, bet_amount')
    .order('username');
  if (error) throw error;

  // Obtener todas las predicciones con puntos y match_id
  const { data: predictions, error: predError } = await supabase
    .from('predictions')
    .select('user_id, match_id, points_earned');
  if (predError) throw predError;

  // Calcular puntos totales por usuario
  const pointsMap = {};
  const exactMap = {};
  const winnerMap = {};
  predictions.forEach((p) => {
    if (p.points_earned != null) {
      pointsMap[p.user_id] = (pointsMap[p.user_id] || 0) + p.points_earned;
      const mult = getMatchMultiplier(p.match_id);
      
      // Clasificar tipos de aciertos basándose en los puntos y multiplicador
      if (p.points_earned === 5 * mult) {
        exactMap[p.user_id] = (exactMap[p.user_id] || 0) + 1;
      } else if (p.points_earned === 3 * mult || p.points_earned === 1 * mult) {
        winnerMap[p.user_id] = (winnerMap[p.user_id] || 0) + 1;
      }
    }
  });

  const finalData = data
    .map((profile) => ({
      ...profile,
      total_points: pointsMap[profile.id] || 0,
      exact_hits: exactMap[profile.id] || 0,
      winner_hits: winnerMap[profile.id] || 0,
    }))
    .sort((a, b) => b.total_points - a.total_points);

  setCache(cacheKey, finalData, 3 * 60 * 1000); // 3 minutes TTL
  return finalData;
}

/* ─── Calcular puntos después de un resultado ─── */
export async function calculatePoints(matchId, realHome, realAway) {
  // Los puntos ahora se calculan automáticamente en el servidor (Supabase)
  // mediante un trigger de base de datos para evitar errores de permisos (403 RLS) en el cliente.
  return true;
}

/* ─── Audit Logs ─── */
export async function getAuditLogs() {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*, profiles(username)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}


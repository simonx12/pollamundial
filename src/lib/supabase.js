import { createClient } from '@supabase/supabase-js';

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
  return data;
}

export async function getUserPredictions(userId) {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
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
  return data;
}

export async function getAllMatchResults() {
  const { data, error } = await supabase
    .from('match_results')
    .select('*');
  if (error) throw error;
  return data;
}

/* ─── Leaderboard (puntos) ─── */
export async function getLeaderboard() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, bet_amount')
    .order('username');
  if (error) throw error;

  // Obtener todas las predicciones con puntos
  const { data: predictions, error: predError } = await supabase
    .from('predictions')
    .select('user_id, points_earned');
  if (predError) throw predError;

  // Calcular puntos totales por usuario
  const pointsMap = {};
  const exactMap = {};
  const winnerMap = {};
  predictions.forEach((p) => {
    if (p.points_earned != null) {
      pointsMap[p.user_id] = (pointsMap[p.user_id] || 0) + p.points_earned;
      if (p.points_earned === 3) exactMap[p.user_id] = (exactMap[p.user_id] || 0) + 1;
      if (p.points_earned === 1) winnerMap[p.user_id] = (winnerMap[p.user_id] || 0) + 1;
    }
  });

  return data
    .map((profile) => ({
      ...profile,
      total_points: pointsMap[profile.id] || 0,
      exact_hits: exactMap[profile.id] || 0,
      winner_hits: winnerMap[profile.id] || 0,
    }))
    .sort((a, b) => b.total_points - a.total_points);
}

/* ─── Calcular puntos después de un resultado ─── */
export async function calculatePoints(matchId, realHome, realAway) {
  const { data: predictions, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('match_id', matchId);
  if (error) throw error;

  const updates = predictions.map((pred) => {
    let points = 0;
    if (pred.home_score === realHome && pred.away_score === realAway) {
      points = 3; // Marcador exacto
    } else {
      const predResult = Math.sign(pred.home_score - pred.away_score);
      const realResult = Math.sign(realHome - realAway);
      if (predResult === realResult) {
        points = 1; // Acertó ganador o empate
      }
    }
    return supabase
      .from('predictions')
      .update({ points_earned: points })
      .eq('id', pred.id);
  });

  await Promise.all(updates);
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


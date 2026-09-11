import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

export const cloudConfigured = () => Boolean(url && key);

let client = null;
export function getSupabase() {
  if (!cloudConfigured()) return null;
  if (!client) {
    client = createClient(url, key, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

export async function ensureCloudSession() {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) return { ok: false, error: sessionError.message };
  if (sessionData.session?.user) return { ok: true, user: sessionData.session.user };
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) return { ok: false, error: error.message };
  return { ok: true, user: data.user };
}

export async function syncCloudProfile(nickname) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };
  const session = await ensureCloudSession();
  if (!session.ok) return session;
  const { error } = await supabase.from('profiles').upsert({ id: session.user.id, nickname }, { onConflict: 'id' });
  return error ? { ok: false, error: error.message } : { ok: true, user: session.user };
}

export async function checkCloudConnection(nickname = '') {
  if (!cloudConfigured()) return { ok: false, configured: false, error: 'Noch nicht verbunden' };
  const session = await ensureCloudSession();
  if (!session.ok) return { ...session, configured: true };
  if (nickname) {
    const profile = await syncCloudProfile(nickname);
    if (!profile.ok) return { ...profile, configured: true };
  }
  return { ok: true, configured: true, userId: session.user.id };
}

export async function createCrewCloud(name) {
  const supabase = getSupabase();
  const session = await ensureCloudSession();
  if (!session.ok) return session;
  const { data, error } = await supabase.rpc('create_crew', { p_name: name.trim() });
  if (error) return { ok: false, error: error.message };
  return { ok: true, crew: Array.isArray(data) ? data[0] : data };
}

export async function joinCrewCloud(code) {
  const supabase = getSupabase();
  const session = await ensureCloudSession();
  if (!session.ok) return session;
  const { data, error } = await supabase.rpc('join_crew_by_code', { p_code: code.trim() });
  if (error) return { ok: false, error: error.message };
  return { ok: true, crew: Array.isArray(data) ? data[0] : data };
}

export async function getMyCrews() {
  const supabase = getSupabase();
  const session = await ensureCloudSession();
  if (!session.ok) return session;
  const { data, error } = await supabase
    .from('crew_members')
    .select('role, joined_at, crews(id,name,join_code,owner_id,created_at)')
    .eq('user_id', session.user.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, crews: (data || []).map((x) => ({ ...x.crews, role: x.role })) };
}

export async function setMySpotCloud(crewId, spot) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };
  const session = await ensureCloudSession();
  if (!session.ok) return session;
  const { data, error } = await supabase.rpc('set_my_spot', {
    p_crew_id: crewId,
    p_spot: spot.trim(),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, presence: Array.isArray(data) ? data[0] : data };
}

export async function clearMySpotCloud(crewId) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };
  const session = await ensureCloudSession();
  if (!session.ok) return session;
  const { error } = await supabase.rpc('clear_my_spot', { p_crew_id: crewId });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getActiveCrewSpotsCloud(crewId) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };
  const session = await ensureCloudSession();
  if (!session.ok) return session;
  const { data, error } = await supabase.rpc('get_active_crew_spots', { p_crew_id: crewId });
  if (error) return { ok: false, error: error.message };
  return { ok: true, spots: data || [], userId: session.user.id };
}

export async function syncMyStatsCloud(stats = {}) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };
  const session = await ensureCloudSession();
  if (!session.ok) return session;
  const payload = {
    p_wins: Math.max(0, Number(stats.wins || 0)),
    p_streak: Math.max(0, Number(stats.streak || 0)),
    p_tricks: Math.max(0, Number(stats.tricks || 0)),
    p_bails: Math.max(0, Number(stats.bails || 0)),
    p_training_minutes: Math.max(0, Number(stats.trainingMinutes || 0)),
  };
  const { data, error } = await supabase.rpc('sync_my_stats', payload);
  if (error) return { ok: false, error: error.message };
  return { ok: true, stats: Array.isArray(data) ? data[0] : data, userId: session.user.id };
}

export async function getCrewLeaderboardCloud(crewId) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };
  const session = await ensureCloudSession();
  if (!session.ok) return session;
  const { data, error } = await supabase.rpc('get_crew_leaderboard', { p_crew_id: crewId });
  if (error) return { ok: false, error: error.message };
  return { ok: true, members: data || [], userId: session.user.id };
}

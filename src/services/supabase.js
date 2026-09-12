import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File } from 'expo-file-system';
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
export async function ensureCurrentWeeklyBattleCloud(crewId) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };
  const session = await ensureCloudSession();
  if (!session.ok) return session;
  const { data, error } = await supabase.rpc('ensure_current_weekly_battle', { p_crew_id: crewId });
  if (error) return { ok: false, error: error.message };
  return { ok: true, battle: Array.isArray(data) ? data[0] : data };
}

export async function setMyWeeklyScoreCloud(crewId, score) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };
  const session = await ensureCloudSession();
  if (!session.ok) return session;
  const { data, error } = await supabase.rpc('set_my_weekly_score', {
    p_crew_id: crewId,
    p_score: Math.max(0, Number(score || 0)),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, score: Array.isArray(data) ? data[0] : data, userId: session.user.id };
}

export async function getWeeklyBattleLeaderboardCloud(crewId) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };
  const session = await ensureCloudSession();
  if (!session.ok) return session;
  const { data, error } = await supabase.rpc('get_weekly_battle_leaderboard', { p_crew_id: crewId });
  if (error) return { ok: false, error: error.message };
  return { ok: true, members: data || [], userId: session.user.id };
}

export async function getPreviousWeekWinnerCloud(crewId) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };
  const session = await ensureCloudSession();
  if (!session.ok) return session;
  const { data, error } = await supabase.rpc('get_previous_week_winner', { p_crew_id: crewId });
  if (error) return { ok: false, error: error.message };
  return { ok: true, winner: (data || [])[0] || null, userId: session.user.id };
}

export async function setMyWeeklyGoalCloud(crewId, goalName, sportName) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };
  const session = await ensureCloudSession();
  if (!session.ok) return session;

  const { data, error } = await supabase.rpc('set_my_weekly_goal', {
    p_crew_id: crewId,
    p_goal_name: String(goalName || '').trim(),
    p_sport_name: String(sportName || 'Freestyle').trim(),
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, goal: Array.isArray(data) ? data[0] : data, userId: session.user.id };
}

export async function setMyWeeklyGoalDoneCloud(crewId, done) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };
  const session = await ensureCloudSession();
  if (!session.ok) return session;

  const { data, error } = await supabase.rpc('set_my_weekly_goal_done', {
    p_crew_id: crewId,
    p_done: Boolean(done),
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, goal: Array.isArray(data) ? data[0] : data, userId: session.user.id };
}

export async function deleteMyWeeklyGoalCloud(crewId) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };
  const session = await ensureCloudSession();
  if (!session.ok) return session;

  const { data, error } = await supabase.rpc('delete_my_weekly_goal', {
    p_crew_id: crewId,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, deleted: Boolean(data), userId: session.user.id };
}

export async function getWeeklyGoalsCloud(crewId) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };
  const session = await ensureCloudSession();
  if (!session.ok) return session;

  const { data, error } = await supabase.rpc('get_weekly_goals', {
    p_crew_id: crewId,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, goals: data || [], userId: session.user.id };
}

export async function uploadCrewSpotPhotoCloud(crewId, imageUri, sportName) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };

  const session = await ensureCloudSession();
  if (!session.ok) return session;

  try {
    const source = new File(imageUri);
    const body = await source.arrayBuffer();
    const objectPath =
      `${crewId}/${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('crew-spot-photos')
      .upload(objectPath, body, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) return { ok: false, error: uploadError.message };

    const { data, error } = await supabase.rpc('add_crew_spot_photo', {
      p_crew_id: crewId,
      p_object_path: objectPath,
      p_sport_name: String(sportName || 'Freestyle').trim(),
    });

    if (error) {
      await supabase.storage.from('crew-spot-photos').remove([objectPath]);
      return { ok: false, error: error.message };
    }

    const photo = Array.isArray(data) ? data[0] : data;
    const { data: signed } = await supabase.storage
      .from('crew-spot-photos')
      .createSignedUrl(objectPath, 3600);

    return {
      ok: true,
      photo: { ...photo, url: signed?.signedUrl || null },
      userId: session.user.id,
    };
  } catch (error) {
    return { ok: false, error: error?.message || 'Foto konnte nicht hochgeladen werden.' };
  }
}

export async function getCrewSpotPhotosCloud(crewId) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };

  const session = await ensureCloudSession();
  if (!session.ok) return session;

  const { data, error } = await supabase.rpc('get_crew_spot_photos', {
    p_crew_id: crewId,
  });

  if (error) return { ok: false, error: error.message };

  const photos = await Promise.all(
    (data || []).map(async (photo) => {
      const { data: signed, error: signedError } = await supabase.storage
        .from('crew-spot-photos')
        .createSignedUrl(photo.object_path, 3600);

      return {
        ...photo,
        url: signedError ? null : (signed?.signedUrl || null),
      };
    })
  );

  return { ok: true, photos, userId: session.user.id };
}

export async function deleteMyCrewSpotPhotoCloud(photoId) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };

  const session = await ensureCloudSession();
  if (!session.ok) return session;

  const { data: objectPath, error } = await supabase.rpc('delete_my_crew_spot_photo', {
    p_photo_id: photoId,
  });

  if (error) return { ok: false, error: error.message };

  const { error: storageError } = await supabase.storage
    .from('crew-spot-photos')
    .remove([objectPath]);

  if (storageError) {
    return {
      ok: false,
      error: 'Foto-Eintrag wurde entfernt, aber die Datei konnte nicht geloescht werden.',
    };
  }

  return { ok: true };
}

export async function getCrewChatRoomsCloud(crewId) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };

  const session = await ensureCloudSession();
  if (!session.ok) return session;

  const { data, error } = await supabase.rpc('get_crew_chat_rooms', {
    p_crew_id: crewId,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, rooms: data || [], userId: session.user.id };
}

export async function createCrewChatRoomCloud(crewId, name) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };

  const session = await ensureCloudSession();
  if (!session.ok) return session;

  const { data, error } = await supabase.rpc('create_crew_chat_room', {
    p_crew_id: crewId,
    p_name: String(name || '').trim(),
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, room: Array.isArray(data) ? data[0] : data, userId: session.user.id };
}

export async function getCrewChatMessagesCloud(roomId, limit = 100) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };

  const session = await ensureCloudSession();
  if (!session.ok) return session;

  const { data, error } = await supabase.rpc('get_crew_chat_messages', {
    p_room_id: roomId,
    p_limit: Math.min(200, Math.max(1, Number(limit || 100))),
  });

  if (error) return { ok: false, error: error.message };

  const messages = [...(data || [])].reverse();
  return { ok: true, messages, userId: session.user.id };
}

export async function sendCrewChatMessageCloud(roomId, message) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };

  const session = await ensureCloudSession();
  if (!session.ok) return session;

  const { data, error } = await supabase.rpc('send_crew_chat_message', {
    p_room_id: roomId,
    p_message: String(message || '').trim(),
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, message: Array.isArray(data) ? data[0] : data, userId: session.user.id };
}

export async function deleteMyChatMessageCloud(messageId) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };

  const session = await ensureCloudSession();
  if (!session.ok) return session;

  const { data, error } = await supabase.rpc('delete_my_chat_message', {
    p_message_id: messageId,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, deleted: Boolean(data), userId: session.user.id };
}


import { File } from 'expo-file-system';
import {
  cloudConfigured,
  ensureCloudSession,
  getSupabase,
  getMyCrews,
  syncCloudProfile,
} from './supabase';

const BUCKET = 'social-media';
const MAX_MEDIA_BYTES = 80 * 1024 * 1024;

const normalizeMime = (mimeType, mediaType) => {
  if (mimeType) return mimeType;
  return mediaType === 'video' ? 'video/mp4' : 'image/jpeg';
};

const extensionFor = (mimeType, mediaType) => {
  const m = normalizeMime(mimeType, mediaType).toLowerCase();
  if (m.includes('png')) return 'png';
  if (m.includes('webp')) return 'webp';
  if (m.includes('mov') || m.includes('quicktime')) return 'mov';
  if (m.includes('video')) return 'mp4';
  return 'jpg';
};

async function signPostMedia(supabase, rows = []) {
  return Promise.all(
    rows.map(async (row) => {
      if (!row?.object_path) return { ...row, media_url: null };
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(row.object_path, 60 * 60);
      return {
        ...row,
        media_url: error ? null : (data?.signedUrl || null),
      };
    })
  );
}

export async function getSocialContext(profile = {}) {
  if (!cloudConfigured()) {
    return { ok: false, configured: false, error: 'Cloud ist noch nicht verbunden.' };
  }

  const session = await ensureCloudSession();
  if (!session.ok) return { ...session, configured: true };

  if (profile?.nickname) {
    await syncCloudProfile(profile.nickname).catch(() => {});
  }

  const crews = await getMyCrews().catch(() => ({ ok: false, crews: [] }));
  return {
    ok: true,
    configured: true,
    userId: session.user.id,
    crews: crews?.ok ? crews.crews || [] : [],
  };
}

export async function getSocialFeedCloud(kind = 'post', limit = 20) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };
  const session = await ensureCloudSession();
  if (!session.ok) return session;

  const cleanKind = kind === 'story' ? 'story' : 'post';
  const { data, error } = await supabase.rpc('get_social_feed', {
    p_kind: cleanKind,
    p_limit: Math.max(1, Math.min(50, Number(limit || 20))),
  });

  if (error) return { ok: false, error: error.message };
  const posts = await signPostMedia(supabase, data || []);
  return { ok: true, posts, userId: session.user.id };
}

export async function createSocialPostCloud({
  profile,
  kind = 'post',
  mediaUri,
  mediaType = 'image',
  mimeType,
  caption = '',
  sportId = null,
  trickName = '',
  spot = null,
  visibility = 'crew',
  crewId = null,
}) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };
  const session = await ensureCloudSession();
  if (!session.ok) return session;

  if (profile?.nickname) {
    const synced = await syncCloudProfile(profile.nickname);
    if (!synced.ok) return synced;
  }

  if (!mediaUri) return { ok: false, error: 'Wähle zuerst ein Foto oder Video aus.' };

  const cleanKind = kind === 'story' ? 'story' : 'post';
  const cleanMedia = mediaType === 'video' ? 'video' : 'image';
  const cleanVisibility = visibility === 'public' ? 'public' : 'crew';
  if (cleanVisibility === 'crew' && !crewId) {
    return { ok: false, error: 'Wähle für Crew-Sichtbarkeit eine Crew aus.' };
  }

  try {
    const source = new File(mediaUri);
    if (Number(source.size || 0) > MAX_MEDIA_BYTES) {
      return { ok: false, error: 'Die Datei ist zu groß. Maximal 80 MB.' };
    }
    const body = await source.arrayBuffer();
    if (body.byteLength > MAX_MEDIA_BYTES) {
      return { ok: false, error: 'Die Datei ist zu groß. Maximal 80 MB.' };
    }

    const contentType = normalizeMime(mimeType, cleanMedia);
    const ext = extensionFor(contentType, cleanMedia);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const objectPath = `${session.user.id}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, body, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) return { ok: false, error: uploadError.message };

    const expiresAt = cleanKind === 'story'
      ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from('social_posts')
      .insert({
        user_id: session.user.id,
        kind: cleanKind,
        media_type: cleanMedia,
        object_path: objectPath,
        caption: String(caption || '').trim().slice(0, 600),
        sport_id: sportId || null,
        trick_name: String(trickName || '').trim().slice(0, 80) || null,
        spot_name: spot?.name ? String(spot.name).slice(0, 120) : null,
        spot_lat: Number.isFinite(+spot?.latitude) ? +spot.latitude : null,
        spot_lon: Number.isFinite(+spot?.longitude) ? +spot.longitude : null,
        visibility: cleanVisibility,
        crew_id: cleanVisibility === 'crew' ? crewId : null,
        expires_at: expiresAt,
      })
      .select('id')
      .single();

    if (error) {
      await supabase.storage.from(BUCKET).remove([objectPath]);
      return { ok: false, error: error.message };
    }

    return { ok: true, postId: data?.id, userId: session.user.id };
  } catch (error) {
    return { ok: false, error: error?.message || 'Upload fehlgeschlagen.' };
  }
}

export async function toggleSocialLikeCloud(postId) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };
  const session = await ensureCloudSession();
  if (!session.ok) return session;
  const { data, error } = await supabase.rpc('toggle_social_like', { p_post_id: postId });
  if (error) return { ok: false, error: error.message };
  return { ok: true, liked: Boolean(data), userId: session.user.id };
}

export async function getSocialCommentsCloud(postId, limit = 80) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };
  const session = await ensureCloudSession();
  if (!session.ok) return session;
  const { data, error } = await supabase.rpc('get_social_comments', {
    p_post_id: postId,
    p_limit: Math.max(1, Math.min(100, Number(limit || 80))),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, comments: data || [], userId: session.user.id };
}

export async function addSocialCommentCloud(postId, body) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };
  const session = await ensureCloudSession();
  if (!session.ok) return session;
  const clean = String(body || '').trim();
  if (!clean) return { ok: false, error: 'Kommentar ist leer.' };
  const { data, error } = await supabase.rpc('add_social_comment', {
    p_post_id: postId,
    p_body: clean.slice(0, 500),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, comment: Array.isArray(data) ? data[0] : data, userId: session.user.id };
}

export async function deleteSocialCommentCloud(commentId) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };
  const session = await ensureCloudSession();
  if (!session.ok) return session;
  const { error } = await supabase.from('social_comments').delete().eq('id', commentId).eq('user_id', session.user.id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function reportSocialPostCloud(postId, reason = 'Unangemessener Inhalt') {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };
  const session = await ensureCloudSession();
  if (!session.ok) return session;
  const { data, error } = await supabase.rpc('report_social_post', {
    p_post_id: postId,
    p_reason: String(reason || '').trim().slice(0, 300),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, reportId: data };
}

export async function blockSocialUserCloud(blockedUserId) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };
  const session = await ensureCloudSession();
  if (!session.ok) return session;
  if (!blockedUserId || blockedUserId === session.user.id) return { ok: false, error: 'Ungültiger Nutzer.' };
  const { data, error } = await supabase.rpc('block_social_user', { p_blocked_id: blockedUserId });
  if (error) return { ok: false, error: error.message };
  return { ok: true, blocked: Boolean(data) };
}

export async function deleteMySocialPostCloud(postId) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase noch nicht eingerichtet.' };
  const session = await ensureCloudSession();
  if (!session.ok) return session;

  const { data: objectPath, error } = await supabase.rpc('delete_my_social_post', { p_post_id: postId });
  if (error) return { ok: false, error: error.message };
  if (objectPath) await supabase.storage.from(BUCKET).remove([objectPath]).catch(() => {});
  return { ok: true };
}

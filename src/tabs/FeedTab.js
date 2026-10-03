import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button, Card, Field, Muted, Notice, Pill, Title } from '../components/UI';
import AppIcon from '../components/AppIcon';
import { COLORS, FONTS, GRADIENTS, RADII, SHADOWS, TYPE } from '../theme';
import { Grad } from '../design/Grad';
import { Avatar } from '../design/kit';
import { localGet } from '../storage';
import {
  addSocialCommentCloud,
  blockSocialUserCloud,
  createSocialPostCloud,
  deleteMySocialPostCloud,
  deleteSocialCommentCloud,
  getSocialCommentsCloud,
  getSocialContext,
  getSocialFeedCloud,
  reportSocialPostCloud,
  toggleSocialLikeCloud,
} from '../services/social';

let ExpoVideo = null;
try {
  ExpoVideo = require('expo-video');
} catch {
  ExpoVideo = null;
}

function NativeVideoMedia({ uri, style, controls }) {
  const player = ExpoVideo.useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.muted = false;
  });
  return (
    <ExpoVideo.VideoView
      player={player}
      style={style}
      contentFit="cover"
      nativeControls={controls}
    />
  );
}

function VideoMedia({ uri, style, controls = true }) {
  if (!ExpoVideo || !uri) {
    return (
      <View style={[style, styles.videoFallback]}>
        <AppIcon name="play" size={32} color={COLORS.text} />
        <Muted>Video</Muted>
      </View>
    );
  }
  return <NativeVideoMedia uri={uri} style={style} controls={controls} />;
}

function Media({ item, style, controls = true }) {
  if (item?.media_type === 'video') {
    return <VideoMedia uri={item.media_url} style={style} controls={controls} />;
  }
  if (!item?.media_url) return <View style={[style, styles.mediaMissing]}><Muted>Medium nicht verfügbar</Muted></View>;
  return <Image source={{ uri: item.media_url }} style={style} resizeMode="cover" />;
}

const timeAgo = (iso) => {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.max(0, Math.floor(ms / 60000));
  if (min < 1) return 'gerade eben';
  if (min < 60) return `vor ${min} Min.`;
  const h = Math.floor(min / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.floor(h / 24);
  return `vor ${d} T.`;
};

export default function FeedTab({ profile, sport, onOpenSpot }) {
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [context, setContext] = useState({ userId: null, crews: [] });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [composerOpen, setComposerOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(null);
  const [commentsPost, setCommentsPost] = useState(null);
  const [actionPost, setActionPost] = useState(null);

  const [kind, setKind] = useState('post');
  const [asset, setAsset] = useState(null);
  const [caption, setCaption] = useState('');
  const [trickName, setTrickName] = useState('');
  const [visibility, setVisibility] = useState('crew');
  const [crewId, setCrewId] = useState(null);
  const [spot, setSpot] = useState(null);
  const [spotChoices, setSpotChoices] = useState([]);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);

  const myId = context.userId;
  const crews = context.crews || [];

  const load = async () => {
    setBusy(true);
    setNotice('');
    try {
      const ctx = await getSocialContext(profile);
      if (!ctx.ok) {
        setNotice(ctx.error || 'Social-Cloud nicht bereit.');
        setContext({ userId: null, crews: [] });
        return;
      }
      setContext(ctx);
      if (!crewId && ctx.crews?.[0]?.id) setCrewId(ctx.crews[0].id);
      if (!ctx.crews?.length) setVisibility('public');

      const [feed, storyFeed, cached] = await Promise.all([
        getSocialFeedCloud('post', 24),
        getSocialFeedCloud('story', 30),
        localGet(`parks:${sport.id}`, []),
      ]);

      if (!feed.ok) setNotice(feed.error || 'Feed konnte nicht geladen werden.');
      setPosts(feed.ok ? feed.posts || [] : []);
      setStories(storyFeed.ok ? storyFeed.posts || [] : []);
      setSpotChoices(Array.isArray(cached) ? cached.slice(0, 12) : []);
    } catch (error) {
      setNotice(error?.message || 'Feed konnte nicht geladen werden.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, [sport.id]);

  const openComposer = (nextKind = 'post') => {
    setKind(nextKind);
    setAsset(null);
    setCaption('');
    setTrickName('');
    setSpot(null);
    setComposerOpen(true);
  };

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setNotice('Für Uploads braucht After[Dark Zugriff auf ausgewählte Fotos und Videos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.9,
      allowsEditing: false,
      videoMaxDuration: kind === 'story' ? 30 : 90,
    });

    if (result.canceled || !result.assets?.[0]) return;
    const picked = result.assets[0];
    setAsset({
      uri: picked.uri,
      type: picked.type === 'video' ? 'video' : 'image',
      mimeType: picked.mimeType || (picked.type === 'video' ? 'video/mp4' : 'image/jpeg'),
      fileSize: picked.fileSize || 0,
    });
  };

  const submit = async () => {
    if (!asset) {
      setNotice('Wähle zuerst ein Foto oder Video aus.');
      return;
    }
    if (asset.fileSize && asset.fileSize > 80 * 1024 * 1024) {
      setNotice('Die Datei ist größer als 80 MB. Bitte kürzeres Video auswählen.');
      return;
    }

    setBusy(true);
    setNotice('');
    try {
      const result = await createSocialPostCloud({
        profile,
        kind,
        mediaUri: asset.uri,
        mediaType: asset.type,
        mimeType: asset.mimeType,
        caption,
        sportId: sport.id,
        trickName,
        spot,
        visibility,
        crewId: visibility === 'crew' ? crewId : null,
      });
      if (!result.ok) {
        setNotice(result.error || 'Upload fehlgeschlagen.');
        return;
      }
      setComposerOpen(false);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const like = async (post) => {
    const before = Boolean(post.liked_by_me);
    setPosts((items) => items.map((x) => x.post_id === post.post_id ? {
      ...x,
      liked_by_me: !before,
      like_count: Math.max(0, Number(x.like_count || 0) + (before ? -1 : 1)),
    } : x));
    const result = await toggleSocialLikeCloud(post.post_id);
    if (!result.ok) {
      setPosts((items) => items.map((x) => x.post_id === post.post_id ? {
        ...x,
        liked_by_me: before,
        like_count: Math.max(0, Number(x.like_count || 0) + (before ? 1 : -1)),
      } : x));
      setNotice(result.error || 'Like konnte nicht gespeichert werden.');
    }
  };

  const openComments = async (post) => {
    setCommentsPost(post);
    setComments([]);
    setCommentText('');
    const result = await getSocialCommentsCloud(post.post_id);
    if (result.ok) setComments(result.comments || []);
    else setNotice(result.error || 'Kommentare konnten nicht geladen werden.');
  };

  const sendComment = async () => {
    if (!commentsPost || !commentText.trim()) return;
    setCommentBusy(true);
    const result = await addSocialCommentCloud(commentsPost.post_id, commentText);
    if (result.ok) {
      setCommentText('');
      const refreshed = await getSocialCommentsCloud(commentsPost.post_id);
      if (refreshed.ok) setComments(refreshed.comments || []);
      setPosts((items) => items.map((x) => x.post_id === commentsPost.post_id ? {
        ...x,
        comment_count: Number(x.comment_count || 0) + 1,
      } : x));
    } else {
      setNotice(result.error || 'Kommentar konnte nicht gesendet werden.');
    }
    setCommentBusy(false);
  };

  const deleteComment = async (comment) => {
    const result = await deleteSocialCommentCloud(comment.comment_id);
    if (result.ok) setComments((items) => items.filter((x) => x.comment_id !== comment.comment_id));
    else setNotice(result.error || 'Kommentar konnte nicht gelöscht werden.');
  };

  const runPostAction = async (action) => {
    const post = actionPost;
    if (!post) return;
    setActionPost(null);
    setBusy(true);
    try {
      if (action === 'delete') {
        const result = await deleteMySocialPostCloud(post.post_id);
        if (!result.ok) setNotice(result.error || 'Post konnte nicht gelöscht werden.');
      }
      if (action === 'report') {
        const result = await reportSocialPostCloud(post.post_id, 'Vom Nutzer gemeldet');
        setNotice(result.ok ? 'Beitrag wurde gemeldet.' : (result.error || 'Melden fehlgeschlagen.'));
      }
      if (action === 'block') {
        const result = await blockSocialUserCloud(post.user_id);
        setNotice(result.ok ? 'Nutzer blockiert. Seine Beiträge werden ausgeblendet.' : (result.error || 'Blockieren fehlgeschlagen.'));
      }
      await load();
    } finally {
      setBusy(false);
    }
  };

  const storyGroups = useMemo(() => {
    const seen = new Set();
    return stories.filter((s) => {
      if (seen.has(s.user_id)) return false;
      seen.add(s.user_id);
      return true;
    });
  }, [stories]);

  return (
    <View style={styles.stack}>
      <Card style={styles.storyCard}>
        <View style={styles.headRow}>
          <View style={{ flex: 1 }}>
            <Title>Stories</Title>
            <Muted>24 Stunden · Crew oder öffentlich</Muted>
          </View>
          <Button title="Story +" compact onPress={() => openComposer('story')} icon="plus" />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storyRow} nestedScrollEnabled>
          <Pressable onPress={() => openComposer('story')} style={styles.storyItem}>
            <View style={[styles.storyRing, { borderColor: COLORS.lime }]}>
              <Avatar size={62} />
              <View style={styles.storyPlus}><AppIcon name="plus" size={13} color={COLORS.onLime} /></View>
            </View>
            <Text style={styles.storyName}>Deine Story</Text>
          </Pressable>
          {storyGroups.map((story) => (
            <Pressable key={story.post_id} onPress={() => setStoryOpen(story)} style={styles.storyItem}>
              <View style={[styles.storyRing, { borderColor: story.visibility === 'crew' ? COLORS.violet : COLORS.cyan }]}>
                {story.media_type === 'image' && story.media_url ? (
                  <Image source={{ uri: story.media_url }} style={styles.storyThumb} />
                ) : (
                  <View style={[styles.storyThumb, styles.videoStory]}><AppIcon name="play" size={24} color={COLORS.text} /></View>
                )}
              </View>
              <Text style={styles.storyName} numberOfLines={1}>@{story.nickname || 'Rider'}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Card>

      <View style={styles.feedHead}>
        <View>
          <Title>Feed</Title>
          <Muted>Clips, Fotos, Tricks und Spots</Muted>
        </View>
        <Button title="Posten" compact onPress={() => openComposer('post')} icon="camera" />
      </View>

      {notice ? <Notice tone="pink">{notice}</Notice> : null}
      {busy && !posts.length ? <ActivityIndicator color={COLORS.lime} /> : null}

      {posts.map((post) => (
        <View key={post.post_id} style={[styles.post, SHADOWS.card]}>
          <Grad {...GRADIENTS.card} radius={RADII.card} />
          <View style={styles.postHead}>
            <Avatar size={42} />
            <View style={{ flex: 1 }}>
              <Text style={styles.nick}>@{post.nickname || 'Rider'}</Text>
              <Text style={styles.meta}>{timeAgo(post.created_at)} · {post.visibility === 'crew' ? 'Crew' : 'Öffentlich'}</Text>
            </View>
            <Pressable onPress={() => setActionPost(post)} style={styles.moreButton} hitSlop={10}>
              <Text style={styles.moreDots}>•••</Text>
            </Pressable>
          </View>

          <Media item={post} style={styles.postMedia} />

          <View style={styles.postBody}>
            <View style={styles.actionRow}>
              <Pressable onPress={() => like(post)} style={styles.actionButton}>
                <AppIcon name="heart" size={22} color={post.liked_by_me ? COLORS.pink : COLORS.text} fillOpacity={post.liked_by_me ? 0.8 : 0.1} />
                <Text style={styles.actionText}>{Number(post.like_count || 0)}</Text>
              </Pressable>
              <Pressable onPress={() => openComments(post)} style={styles.actionButton}>
                <AppIcon name="chat" size={21} color={COLORS.text} />
                <Text style={styles.actionText}>{Number(post.comment_count || 0)}</Text>
              </Pressable>
              {post.spot_name ? (
                <Pressable onPress={() => onOpenSpot?.(post)} style={[styles.actionButton, styles.spotButton]}>
                  <AppIcon name="pin" size={18} color={COLORS.cyan} />
                  <Text numberOfLines={1} style={[styles.actionText, { color: COLORS.cyan }]}>{post.spot_name}</Text>
                </Pressable>
              ) : null}
            </View>

            {post.caption ? <Text style={styles.caption}><Text style={styles.nickInline}>@{post.nickname || 'Rider'} </Text>{post.caption}</Text> : null}
            <View style={styles.tags}>
              {post.sport_id ? <View style={styles.tag}><Text style={styles.tagText}>{post.sport_id}</Text></View> : null}
              {post.trick_name ? <View style={styles.tag}><Text style={styles.tagText}>{post.trick_name}</Text></View> : null}
            </View>
          </View>
        </View>
      ))}

      {!busy && !posts.length ? (
        <Card>
          <Title>Noch keine Clips</Title>
          <Muted>Poste den ersten Trick, ein Bild vom Spot oder eine Story.</Muted>
          <Button title="Ersten Post erstellen" onPress={() => openComposer('post')} icon="plus" />
        </Card>
      ) : null}

      <Pressable onPress={load} style={styles.refreshButton}>
        <AppIcon name="reset" size={18} color={COLORS.text2} />
        <Text style={styles.refreshText}>Feed aktualisieren</Text>
      </Pressable>

      <Modal visible={composerOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setComposerOpen(false)}>
        <View style={styles.modalPage}>
          <View style={styles.modalHead}>
            <Pressable onPress={() => setComposerOpen(false)}><Text style={styles.cancel}>Abbrechen</Text></Pressable>
            <Text style={styles.modalTitle}>{kind === 'story' ? 'Neue Story' : 'Neuer Post'}</Text>
            <Pressable onPress={submit} disabled={busy}><Text style={[styles.postNow, busy && { opacity: 0.5 }]}>Posten</Text></Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.kindRow}>
              <Pill label="Post" active={kind === 'post'} onPress={() => setKind('post')} />
              <Pill label="Story · 24 h" active={kind === 'story'} onPress={() => setKind('story')} />
            </View>

            <Pressable onPress={pickMedia} style={styles.mediaPicker}>
              {asset ? (
                asset.type === 'image' ? <Image source={{ uri: asset.uri }} style={styles.pickerPreview} /> : <VideoMedia uri={asset.uri} style={styles.pickerPreview} />
              ) : (
                <View style={styles.pickEmpty}><AppIcon name="camera" size={32} color={COLORS.cyan} /><Text style={styles.pickText}>Foto oder Video auswählen</Text></View>
              )}
            </Pressable>

            <Field value={caption} onChangeText={setCaption} multiline placeholder="Was ist passiert?" />
            <Field value={trickName} onChangeText={setTrickName} placeholder="Trick, z. B. Fingerwhip (optional)" />

            <Title small>Spot verlinken</Title>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills} nestedScrollEnabled>
              <Pill label="Kein Spot" active={!spot} onPress={() => setSpot(null)} />
              {spotChoices.map((p, i) => (
                <Pill key={`${p.name}-${i}`} label={p.name} active={spot?.name === p.name} onPress={() => setSpot(p)} />
              ))}
            </ScrollView>
            {!spotChoices.length ? <Muted>Suche vorher einmal unter Parks. Dann erscheinen deine gefundenen Spots hier.</Muted> : null}

            <Title small>Sichtbarkeit</Title>
            <View style={styles.kindRow}>
              {crews.length ? <Pill label="Nur Crew" active={visibility === 'crew'} onPress={() => setVisibility('crew')} /> : null}
              <Pill label="Öffentlich" active={visibility === 'public'} onPress={() => setVisibility('public')} />
            </View>
            {visibility === 'crew' && crews.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
                {crews.map((c) => <Pill key={c.id} label={c.name} active={crewId === c.id} onPress={() => setCrewId(c.id)} />)}
              </ScrollView>
            ) : null}

            <Notice tone="ice">Veröffentliche keine privaten Wohnadressen, Schulen oder deinen Live-Standort. Verlinke nur Spots, die andere auch finden dürfen.</Notice>
            {busy ? <ActivityIndicator color={COLORS.lime} /> : null}
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={Boolean(storyOpen)} animationType="fade" transparent onRequestClose={() => setStoryOpen(null)}>
        <View style={styles.storyModalBg}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setStoryOpen(null)} />
          {storyOpen ? (
            <View style={styles.storyViewer}>
              <Media item={storyOpen} style={styles.storyFull} />
              <View style={styles.storyOverlay}>
                <Text style={styles.storyViewerNick}>@{storyOpen.nickname || 'Rider'}</Text>
                {storyOpen.caption ? <Text style={styles.storyCaption}>{storyOpen.caption}</Text> : null}
                {storyOpen.spot_name ? <Text style={styles.storySpot}>⌖ {storyOpen.spot_name}</Text> : null}
              </View>
            </View>
          ) : null}
        </View>
      </Modal>

      <Modal visible={Boolean(commentsPost)} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setCommentsPost(null)}>
        <View style={styles.modalPage}>
          <View style={styles.modalHead}>
            <Pressable onPress={() => setCommentsPost(null)}><Text style={styles.cancel}>Schließen</Text></Pressable>
            <Text style={styles.modalTitle}>Kommentare</Text>
            <View style={{ width: 58 }} />
          </View>
          <ScrollView contentContainerStyle={styles.commentsList} keyboardShouldPersistTaps="handled">
            {comments.map((c) => (
              <View key={c.comment_id} style={styles.commentRow}>
                <Avatar size={34} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.commentText}><Text style={styles.nickInline}>@{c.nickname || 'Rider'} </Text>{c.body}</Text>
                  <Text style={styles.meta}>{timeAgo(c.created_at)}</Text>
                </View>
                {c.user_id === myId ? <Pressable onPress={() => deleteComment(c)}><AppIcon name="trash" size={17} color={COLORS.text3} /></Pressable> : null}
              </View>
            ))}
            {!comments.length ? <Muted>Noch keine Kommentare.</Muted> : null}
          </ScrollView>
          <View style={styles.commentComposer}>
            <Field value={commentText} onChangeText={setCommentText} placeholder="Kommentar …" style={{ flex: 1 }} />
            <Pressable onPress={sendComment} disabled={commentBusy || !commentText.trim()} style={styles.sendButton}>
              <AppIcon name="send" size={20} color={COLORS.onLime} />
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(actionPost)} animationType="fade" transparent onRequestClose={() => setActionPost(null)}>
        <View style={styles.actionModalBg}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setActionPost(null)} />
          <View style={styles.actionSheet}>
            {actionPost?.user_id === myId ? (
              <Pressable onPress={() => runPostAction('delete')} style={styles.sheetRow}><AppIcon name="trash" size={20} color={COLORS.pink} /><Text style={[styles.sheetText, { color: COLORS.pink }]}>Beitrag löschen</Text></Pressable>
            ) : (
              <>
                <Pressable onPress={() => runPostAction('report')} style={styles.sheetRow}><AppIcon name="shield" size={20} color={COLORS.text} /><Text style={styles.sheetText}>Beitrag melden</Text></Pressable>
                <Pressable onPress={() => runPostAction('block')} style={styles.sheetRow}><AppIcon name="user" size={20} color={COLORS.pink} /><Text style={[styles.sheetText, { color: COLORS.pink }]}>Nutzer blockieren</Text></Pressable>
              </>
            )}
            <Pressable onPress={() => setActionPost(null)} style={styles.sheetRow}><Text style={styles.sheetText}>Abbrechen</Text></Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 14 },
  storyCard: { paddingBottom: 16 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  storyRow: { gap: 14, paddingRight: 8, paddingTop: 4 },
  storyItem: { width: 72, alignItems: 'center', gap: 6 },
  storyRing: { width: 68, height: 68, borderRadius: 34, borderWidth: 2.5, padding: 3, alignItems: 'center', justifyContent: 'center' },
  storyThumb: { width: 58, height: 58, borderRadius: 29, backgroundColor: COLORS.raised },
  videoStory: { alignItems: 'center', justifyContent: 'center' },
  storyPlus: { position: 'absolute', right: -1, bottom: -1, width: 23, height: 23, borderRadius: 12, backgroundColor: COLORS.lime, borderWidth: 3, borderColor: COLORS.midnight, alignItems: 'center', justifyContent: 'center' },
  storyName: { fontFamily: FONTS.medium, color: COLORS.text2, fontSize: 10.5, maxWidth: 72 },
  feedHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 2 },
  post: { borderRadius: RADII.card, backgroundColor: COLORS.midnight, overflow: 'hidden' },
  postHead: { minHeight: 66, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 11 },
  nick: { fontFamily: FONTS.bold, color: COLORS.text, fontSize: 14 },
  meta: { ...TYPE.caption, fontSize: 11.5 },
  moreButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  moreDots: { color: COLORS.text2, fontSize: 18, letterSpacing: 2 },
  postMedia: { width: '100%', aspectRatio: 4 / 5, backgroundColor: COLORS.well },
  videoFallback: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  mediaMissing: { alignItems: 'center', justifyContent: 'center' },
  postBody: { padding: 14, gap: 10 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 34 },
  actionText: { fontFamily: FONTS.semibold, color: COLORS.text2, fontSize: 12.5 },
  spotButton: { marginLeft: 'auto', maxWidth: '58%', backgroundColor: COLORS.cyanSoft, borderRadius: 999, paddingHorizontal: 10 },
  caption: { ...TYPE.body, color: COLORS.text, lineHeight: 20 },
  nickInline: { fontFamily: FONTS.bold, color: COLORS.text },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  tag: { backgroundColor: COLORS.raised, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { ...TYPE.label, color: COLORS.text2 },
  refreshButton: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 15, paddingVertical: 10 },
  refreshText: { fontFamily: FONTS.semibold, color: COLORS.text2, fontSize: 12.5 },
  modalPage: { flex: 1, backgroundColor: COLORS.bg, paddingTop: 12 },
  modalHead: { minHeight: 58, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.line },
  modalTitle: { fontFamily: FONTS.head, color: COLORS.text, fontSize: 17 },
  cancel: { fontFamily: FONTS.medium, color: COLORS.text2, fontSize: 14 },
  postNow: { fontFamily: FONTS.bold, color: COLORS.lime, fontSize: 14 },
  modalContent: { padding: 18, gap: 15, paddingBottom: 40 },
  kindRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mediaPicker: { width: '100%', aspectRatio: 4 / 5, borderRadius: RADII.card, overflow: 'hidden', backgroundColor: COLORS.well },
  pickerPreview: { width: '100%', height: '100%' },
  pickEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  pickText: { fontFamily: FONTS.semibold, color: COLORS.text2 },
  pills: { gap: 8, paddingRight: 12 },
  storyModalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center', padding: 14 },
  storyViewer: { width: '100%', maxWidth: 520, aspectRatio: 9 / 16, borderRadius: 28, overflow: 'hidden', backgroundColor: COLORS.well },
  storyFull: { width: '100%', height: '100%' },
  storyOverlay: { position: 'absolute', left: 16, right: 16, bottom: 18, gap: 6, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 16, padding: 12 },
  storyViewerNick: { fontFamily: FONTS.bold, color: '#fff', fontSize: 14 },
  storyCaption: { fontFamily: FONTS.body, color: '#fff', fontSize: 14 },
  storySpot: { fontFamily: FONTS.semibold, color: COLORS.cyan, fontSize: 12 },
  commentsList: { padding: 18, gap: 14, paddingBottom: 100 },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  commentText: { fontFamily: FONTS.body, color: COLORS.text, fontSize: 14, lineHeight: 20 },
  commentComposer: { padding: 12, paddingBottom: 22, borderTopWidth: 1, borderTopColor: COLORS.line, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.bg },
  sendButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.lime, alignItems: 'center', justifyContent: 'center' },
  actionModalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  actionSheet: { backgroundColor: COLORS.panel, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 14, paddingBottom: 34, gap: 4 },
  sheetRow: { minHeight: 54, borderRadius: 18, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetText: { fontFamily: FONTS.semibold, color: COLORS.text, fontSize: 14.5 },
});

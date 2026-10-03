import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import AppIcon from '../components/AppIcon';
import { Grad } from '../design/Grad';
import { SecondaryButton, Segmented, Tag } from '../design/kit';
import { Card, Button, Muted, Notice, Pill, Title } from '../components/UI';
import { COLORS, FONTS, RADII, SHADOWS } from '../theme';
import { EmptyScene } from '../design/ambient';
import { localGet, localSet, sharedGet, sharedSet } from '../storage';
import { pickAndResizeImage, persistImage } from '../services/media';
import {
  cloudConfigured,
  getMyCrews,
  syncCloudProfile,
  uploadMemoryCloud,
  getMemoriesCloud,
  toggleMemoryLikeCloud,
  deleteMyMemoryCloud,
} from '../services/supabase';

const today = () => new Date().toISOString().slice(0, 10);

export default function MemoriesTab({ profile }) {
  const [scope, setScope] = useState('private');
  const [items, setItems] = useState([]);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [cloudMode, setCloudMode] = useState(false);
  const [crewId, setCrewId] = useState(null);
  const [cloudUserId, setCloudUserId] = useState(null);

  const max = scope === 'private' ? 12 : 9;

  const loadLocal = async (scopeValue = scope) => {
    const key = scopeValue === 'private'
      ? 'memories:private'
      : 'memories:crew';

    const getter = scopeValue === 'private'
      ? localGet
      : sharedGet;

    setItems(await getter(key, []));
    setCloudMode(false);
  };

  const resolveCrew = async () => {
    let activeCrew = await localGet('crew:activeCloudCrewId', null);
    const result = await getMyCrews();

    if (!result.ok || !(result.crews || []).length) {
      return {
        ok: false,
        error: result.error || 'Du bist noch in keiner Cloud-Crew.',
      };
    }

    const crews = result.crews || [];

    if (!activeCrew || !crews.some((c) => c.id === activeCrew)) {
      activeCrew = crews[0].id;
      await localSet('crew:activeCloudCrewId', activeCrew);
    }

    return { ok: true, crewId: activeCrew };
  };

  const loadCloud = async (scopeValue = scope) => {
    if (!cloudConfigured()) {
      await loadLocal(scopeValue);
      return;
    }

    const profileResult = await syncCloudProfile(profile.nickname);
    if (!profileResult.ok) {
      setNotice(profileResult.error || 'Cloud-Profil konnte nicht geladen werden.');
      await loadLocal(scopeValue);
      return;
    }

    let targetCrewId = null;

    if (scopeValue === 'crew') {
      const crewResult = await resolveCrew();

      if (!crewResult.ok) {
        setNotice(crewResult.error);
        await loadLocal(scopeValue);
        return;
      }

      targetCrewId = crewResult.crewId;
      setCrewId(targetCrewId);
    }

    const result = await getMemoriesCloud(
      scopeValue,
      targetCrewId,
      scopeValue === 'private' ? 12 : 50
    );

    if (!result.ok) {
      setNotice(result.error || 'Memories konnten nicht geladen werden.');
      await loadLocal(scopeValue);
      return;
    }

    setItems(result.memories || []);
    setCloudUserId(result.userId || null);
    setCloudMode(true);
    setNotice('');
  };

  useEffect(() => {
    loadCloud(scope);
  }, [scope, profile.nickname]);

  useEffect(() => {
    if (!cloudMode) return;

    const id = setInterval(() => {
      loadCloud(scope);
    }, scope === 'crew' ? 5000 : 15000);

    return () => clearInterval(id);
  }, [cloudMode, scope, crewId]);

  const add = async () => {
    setNotice('');

    if (items.length >= max) {
      setNotice(`Hier passen maximal ${max} Bilder rein.`);
      return;
    }

    const img = await pickAndResizeImage();
    if (!img) return;

    if (cloudMode && cloudConfigured()) {
      setBusy(true);

      const result = await uploadMemoryCloud(
        scope,
        scope === 'crew' ? crewId : null,
        img.uri
      );

      if (result.ok) {
        await loadCloud(scope);
      } else {
        setNotice(result.error || 'Bild konnte nicht hochgeladen werden.');
      }

      setBusy(false);
      return;
    }

    const uri = await persistImage(img.uri, scope);
    const next = [
      {
        id: Date.now(),
        uri,
        by: profile.nickname,
        likes: 0,
        day: today(),
      },
      ...items,
    ];

    setItems(next);

    const key = scope === 'private'
      ? 'memories:private'
      : 'memories:crew';

    if (scope === 'private') {
      await localSet(key, next);
    } else {
      await sharedSet(key, next);
    }
  };

  const like = async (id) => {
    if (scope !== 'crew' || busy) return;

    if (cloudMode) {
      setBusy(true);
      const result = await toggleMemoryLikeCloud(id);

      if (result.ok) {
        await loadCloud('crew');
      } else {
        setNotice(result.error || 'Like konnte nicht gespeichert werden.');
      }

      setBusy(false);
      return;
    }

    const next = items.map((x) =>
      x.id === id
        ? { ...x, likes: (x.likes || 0) + 1 }
        : x
    );

    setItems(next);
    await sharedSet('memories:crew', next);
  };

  const remove = async (id) => {
    if (!cloudMode || busy) return;

    setBusy(true);
    const result = await deleteMyMemoryCloud(id);

    if (result.ok) {
      await loadCloud(scope);
    } else {
      setNotice(result.error || 'Memory konnte nicht gelöscht werden.');
    }

    setBusy(false);
  };

  const localCrown = !cloudMode && scope === 'crew'
    ? items
        .filter((x) => x.day === today())
        .sort((a, b) => (b.likes || 0) - (a.likes || 0))[0]?.id
    : null;

  return (
    <View style={styles.stack}>
      {notice ? <Notice tone="pink">{notice}</Notice> : null}

      <Card>
        <Segmented
          items={[
            { key: 'private', label: 'Privat' },
            { key: 'crew', label: 'Crew' },
          ]}
          value={scope}
          onChange={(next) => setScope(next)}
        />
        <View style={styles.wrap}>
          <Tag label={`${items.length} / ${max} Bilder`} tone="neutral" icon="memories" />
          <Tag
            label={cloudMode ? 'Cloud aktiv' : 'Lokaler Testmodus'}
            tone={cloudMode ? 'cyan' : 'neutral'}
            dot={cloudMode}
          />
        </View>
        <Button
          title={busy ? 'Bitte warten…' : 'Bild hinzufügen'}
          icon="camera"
          disabled={busy}
          onPress={add}
        />
      </Card>

      <View style={styles.grid}>
        {items.map((x) => {
          const isCloud = cloudMode;
          const crown = isCloud
            ? Boolean(x.daily_crown)
            : localCrown === x.id;
          const by = isCloud
            ? x.nickname
            : x.by;
          const likes = isCloud
            ? Number(x.likes || 0)
            : Number(x.likes || 0);
          const likedByMe = isCloud
            ? Boolean(x.liked_by_me)
            : false;
          const mine = isCloud
            ? x.user_id === cloudUserId
            : by === profile.nickname;
          const imageUri = isCloud
            ? x.url
            : x.uri;

          return (
            <View key={x.id} style={styles.tileWrap}>
              <View style={[styles.tile, SHADOWS.card]}>
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.image}
                  />
                ) : (
                  <View style={styles.imageFallback}>
                    <AppIcon name="memories" size={28} color={COLORS.text3} />
                    <Muted style={{ textAlign: 'center' }}>Bild konnte nicht geladen werden.</Muted>
                  </View>
                )}

                <View pointerEvents="none" style={styles.fade}>
                  <Grad colors={['rgba(3,5,10,0)', 'rgba(3,5,10,0.88)']} angle={180} />
                </View>

                <View style={styles.info}>
                  <View style={styles.byRow}>
                    {crown ? <AppIcon name="crown" size={15} color={COLORS.lime} fillOpacity={0.6} /> : null}
                    <Text style={styles.by} numberOfLines={1}>
                      {by}
                    </Text>
                  </View>

                  {scope === 'crew' ? (
                    <Pressable
                      disabled={busy}
                      onPress={() => like(x.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Like, ${likes}`}
                      style={[
                        styles.like,
                        likedByMe && styles.likeActive,
                      ]}
                    >
                      <AppIcon
                        name="heart"
                        size={14}
                        color={likedByMe ? COLORS.pinkText : COLORS.text}
                        fillOpacity={likedByMe ? 0.8 : 0.22}
                      />
                      <Text style={[styles.likeText, likedByMe && { color: COLORS.pinkText }]}>
                        {likes}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>

              {isCloud && mine ? (
                <SecondaryButton
                  title="Mein Bild löschen"
                  tone="pink"
                  size="sm"
                  icon="trash"
                  disabled={busy}
                  onPress={() => remove(x.id)}
                />
              ) : null}
            </View>
          );
        })}
      </View>

      {!items.length ? (
        <Card>
          <View style={{ alignItems: 'center', gap: 10, paddingVertical: 10 }}>
            <EmptyScene kind="memories" accent={COLORS.blue} />
          </View>
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 14 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tileWrap: {
    width: '48.5%',
    flexGrow: 1,
    gap: 8,
  },
  tile: {
    aspectRatio: 1,
    borderRadius: RADII.tile,
    overflow: 'hidden',
    backgroundColor: COLORS.tile,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
  },
  info: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  byRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
  },
  by: {
    fontFamily: FONTS.bold,
    color: COLORS.text,
    fontSize: 13,
    flexShrink: 1,
  },
  like: {
    height: 32,
    borderRadius: 999,
    paddingHorizontal: 10,
    backgroundColor: COLORS.glass,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  likeActive: {
    backgroundColor: COLORS.pinkSoft,
  },
  likeText: {
    fontFamily: FONTS.bold,
    color: COLORS.text,
    fontSize: 12,
  },
});

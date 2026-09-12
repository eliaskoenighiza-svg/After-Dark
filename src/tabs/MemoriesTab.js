import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Button, Muted, Notice, Pill, Title } from '../components/UI';
import { COLORS } from '../theme';
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
        <Title>Memories</Title>

        <View style={styles.wrap}>
          <Pill
            label="Privat"
            active={scope === 'private'}
            onPress={() => setScope('private')}
          />
          <Pill
            label="Crew"
            active={scope === 'crew'}
            onPress={() => setScope('crew')}
          />
        </View>

        <Muted>
          {cloudMode ? 'Cloud aktiv · ' : 'Lokaler Testmodus · '}
          {items.length} / {max} Bilder
        </Muted>

        <Button
          title={busy ? 'Bitte warten…' : 'Bild hinzufügen'}
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
            <View key={x.id} style={styles.tile}>
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={styles.image}
                />
              ) : (
                <View style={styles.imageFallback}>
                  <Muted>Bild konnte nicht geladen werden.</Muted>
                </View>
              )}

              <View style={styles.info}>
                <Text style={styles.by}>
                  {crown ? '♛ ' : ''}
                  {by}
                </Text>

                {scope === 'crew' ? (
                  <Pressable
                    disabled={busy}
                    onPress={() => like(x.id)}
                    style={[
                      styles.like,
                      likedByMe && styles.likeActive,
                    ]}
                  >
                    <Text style={styles.likeText}>
                      👍 {likes}
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              {isCloud && mine ? (
                <View style={styles.deleteWrap}>
                  <Button
                    title="Mein Bild löschen"
                    tone="dark"
                    disabled={busy}
                    onPress={() => remove(x.id)}
                  />
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      {!items.length ? (
        <Card>
          <Muted>Noch keine Bilder.</Muted>
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  wrap: { flexDirection: 'row', gap: 8 },
  grid: { gap: 10 },
  tile: {
    backgroundColor: COLORS.panel,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  image: {
    width: '100%',
    height: 260,
    resizeMode: 'cover',
  },
  imageFallback: {
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  info: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  by: {
    color: COLORS.text,
    fontWeight: '800',
  },
  like: {
    padding: 8,
    backgroundColor: COLORS.panel2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  likeActive: {
    borderColor: COLORS.volt,
  },
  likeText: {
    color: COLORS.text,
    fontWeight: '800',
  },
  deleteWrap: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
});

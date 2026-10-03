// Night Badges: runde Profilbilder (PNG) und ihre Loop-Animationen (MP4).
// Rein dekorativ – keine Speicher-, Supabase-, KI- oder Maps-Logik.
import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { COLORS, FONTS, TYPE } from '../theme';
import AppIcon from '../components/AppIcon';
import { haptic } from './haptics';
import { localGet, localSet } from '../storage';

// expo-video ist optional: fehlt das native Modul (alter Dev-Build), zeigen wir das PNG.
let ExpoVideo = null;
try {
  ExpoVideo = require('expo-video');
} catch (e) {
  ExpoVideo = null;
}

export const PROFILE_IMAGES = {
  nightbadge: require('../../assets/profile/profile-nightbadge.png'),
  levelup: require('../../assets/profile/profile-levelup.png'),
  crew: require('../../assets/profile/profile-crew.png'),
  spot: require('../../assets/profile/profile-spot.png'),
  battle: require('../../assets/profile/profile-battle.png'),
  schwarzwald: require('../../assets/profile/profile-schwarzwald.png'),
};

export const BADGE_ANIMATIONS = {
  nightbadge: require('../../assets/animations/anim-nightbadge.mp4'),
  levelup: require('../../assets/animations/anim-levelup.mp4'),
  crew: require('../../assets/animations/anim-crew.mp4'),
  spot: require('../../assets/animations/anim-spotpin.mp4'),
  battle: require('../../assets/animations/anim-battle.mp4'),
  schwarzwald: require('../../assets/animations/anim-schwarzwald.mp4'),
};

// Freischaltung nur aus vorhandenen Statistiken abgeleitet (nur lesen, nichts gespeichert)
const n = (v) => Number(v) || 0;
export const BADGES = [
  { id: 'nightbadge', name: 'Night Badge', sub: 'After[Dark', color: COLORS.lime, goal: 'Immer dabei', need: () => 1, max: 1 },
  { id: 'levelup', name: 'Level Up', sub: 'Skills & Fortschritt', color: COLORS.lime, goal: '8 Tricks geschafft', need: (s) => n(s.tricks), max: 8 },
  { id: 'battle', name: 'Battle', sub: 'Game of Skate', color: COLORS.pink, goal: 'Erster Battle-Sieg', need: (s) => n(s.wins), max: 1 },
  { id: 'spot', name: 'Spot', sub: 'Find your Spot', color: COLORS.cyan, goal: '60 Minuten trainiert', need: (s) => n(s.trainingMinutes), max: 60 },
  { id: 'crew', name: 'Crew', sub: 'Ride together', color: COLORS.violet, goal: '3 Tage Streak', need: (s) => n(s.streak), max: 3 },
  { id: 'schwarzwald', name: 'Schwarzwald', sub: 'Local Legend', color: COLORS.cyan, goal: '25 Tricks geschafft', need: (s) => n(s.tricks), max: 25 },
];

export function badgeState(badge, stats = {}) {
  const have = Math.min(badge.max, badge.need(stats || {}));
  return { unlocked: have >= badge.max, have, rest: Math.max(0, badge.max - have) };
}

export function unlockedIds(stats) {
  return BADGES.filter((b) => badgeState(b, stats).unlocked).map((b) => b.id);
}

function useReduceMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((v) => alive && setReduced(!!v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v) => setReduced(!!v));
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);
  return reduced;
}

// Statisches rundes Badge (locked = grau mit Schloss)
export function BadgeImage({ id = 'nightbadge', size = 72, ring, locked = false, style }) {
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2 },
        ring ? { borderWidth: 2, borderColor: ring, padding: 2 } : null,
        style,
      ]}
    >
      <Image
        source={PROFILE_IMAGES[id] || PROFILE_IMAGES.nightbadge}
        style={[
          { width: '100%', height: '100%', borderRadius: size / 2 },
          locked ? { opacity: 0.32, filter: 'grayscale(1)' } : null,
        ]}
        resizeMode="cover"
      />
      {locked ? (
        <View style={[styles.lock, { width: size * 0.36, height: size * 0.36, borderRadius: size * 0.18 }]}>
          <AppIcon name="key" size={size * 0.18} color={COLORS.text} />
        </View>
      ) : null}
    </View>
  );
}

function VideoLoop({ id, size }) {
  const player = ExpoVideo.useVideoPlayer(BADGE_ANIMATIONS[id], (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return (
    <ExpoVideo.VideoView
      player={player}
      style={{ width: size, height: size }}
      contentFit="cover"
      nativeControls={false}
      allowsFullscreen={false}
      allowsPictureInPicture={false}
      surfaceType={Platform.OS === 'android' ? 'textureView' : undefined}
      pointerEvents="none"
    />
  );
}

// Animiertes Badge (Loop, stumm). Fällt bei „Bewegung reduzieren“ oder fehlendem Modul aufs PNG zurück.
export function BadgeVideo({ id = 'nightbadge', size = 120, style, playing = true }) {
  const reduced = useReduceMotion();
  const canPlay = playing && !reduced && ExpoVideo && BADGE_ANIMATIONS[id];
  return (
    <View
      style={[
        styles.videoWrap,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <Image
        source={PROFILE_IMAGES[id] || PROFILE_IMAGES.nightbadge}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      {canPlay ? <VideoLoop id={id} size={size} /> : null}
    </View>
  );
}

// Abzeichen-Sammlung für „Mehr“: antippen = Animation groß, als Profilbild wählen, teilen.
export function BadgeShelf({ stats = {}, avatarBadge = null, onSetAvatar, onShare, style }) {
  const [open, setOpen] = useState(null);
  const current = BADGES.find((b) => b.id === open);
  const st = current ? badgeState(current, stats) : null;
  return (
    <View style={style}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.shelf}
      >
        {BADGES.map((b) => {
          const s = badgeState(b, stats);
          return (
            <Pressable
              key={b.id}
              onPress={() => {
                haptic.select();
                setOpen(b.id);
              }}
              accessibilityRole="button"
              accessibilityLabel={s.unlocked ? `${b.name} Animation abspielen` : `${b.name} gesperrt: ${b.goal}`}
              style={({ pressed }) => [styles.shelfItem, pressed && { transform: [{ scale: 0.95 }] }]}
            >
              <BadgeImage id={b.id} size={76} locked={!s.unlocked} ring={avatarBadge === b.id ? COLORS.lime : undefined} />
              <Text style={[styles.shelfName, !s.unlocked && { color: COLORS.text3 }]} numberOfLines={1}>{b.name}</Text>
              {!s.unlocked ? (
                <View style={styles.bar}>
                  <View style={[styles.barFill, { width: `${Math.round((s.have / b.max) * 100)}%`, backgroundColor: b.color }]} />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <Modal
        transparent
        visible={!!current}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpen(null)}
      >
        <View style={styles.scrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(null)} accessibilityLabel="Schließen" />
          {current ? (
            <>
              {st.unlocked ? <BadgeVideo id={current.id} size={260} /> : <BadgeImage id={current.id} size={260} locked />}
              <Text style={styles.modalName}>{current.name}</Text>
              <Text style={[styles.modalSub, { color: current.color }]}>
                {st.unlocked ? current.sub : `Gesperrt · ${current.goal}`}
              </Text>
              {!st.unlocked ? (
                <Text style={styles.modalHint}>Noch {st.rest} {current.max === 60 ? 'Minuten' : current.id === 'crew' ? 'Tage' : current.id === 'battle' ? 'Sieg' : 'Tricks'}</Text>
              ) : (
                <View style={styles.modalBtns}>
                  {onSetAvatar ? (
                    <Pressable
                      onPress={() => {
                        haptic.success();
                        onSetAvatar(avatarBadge === current.id ? null : current.id);
                      }}
                      accessibilityRole="button"
                      style={({ pressed }) => [styles.mBtn, avatarBadge === current.id ? styles.mBtnGhost : styles.mBtnLime, pressed && { opacity: 0.85 }]}
                    >
                      <Text style={avatarBadge === current.id ? styles.mBtnGhostText : styles.mBtnLimeText}>
                        {avatarBadge === current.id ? 'Wieder Foto nutzen' : 'Als Profilbild'}
                      </Text>
                    </Pressable>
                  ) : null}
                  {onShare ? (
                    <Pressable
                      onPress={() => {
                        setOpen(null);
                        onShare(current);
                      }}
                      accessibilityRole="button"
                      style={({ pressed }) => [styles.mBtn, styles.mBtnGhost, pressed && { opacity: 0.85 }]}
                    >
                      <Text style={styles.mBtnGhostText}>Teilen</Text>
                    </Pressable>
                  ) : null}
                </View>
              )}
              <Text style={styles.modalHint}>Tippen zum Schließen</Text>
            </>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

// Profilbild: Badge (falls gewählt) sonst Foto/Initial über renderFallback
export function ProfilePic({ badge, size, fallback }) {
  if (badge && PROFILE_IMAGES[badge]) return <BadgeImage id={badge} size={size} />;
  return fallback;
}

// Zeigt neu freigeschaltete Abzeichen einmal groß an.
// Eigener Schlüssel "ui:badgesSeen" – bestehende Daten bleiben unberührt.
export function BadgeUnlockWatcher({ stats, onShare }) {
  const [seen, setSeen] = useState(null);
  const [fresh, setFresh] = useState(null);

  useEffect(() => {
    let alive = true;
    localGet('ui:badgesSeen', null).then((v) => {
      if (!alive) return;
      if (Array.isArray(v)) setSeen(v);
      else {
        // erster Start: alles bisher Erreichte gilt als gesehen
        const now = unlockedIds(stats);
        setSeen(now);
        localSet('ui:badgesSeen', now).catch(() => {});
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!seen) return;
    const now = unlockedIds(stats);
    const neu = now.filter((id) => !seen.includes(id));
    if (neu.length) {
      const next = [...seen, ...neu];
      setSeen(next);
      localSet('ui:badgesSeen', next).catch(() => {});
      setFresh(BADGES.find((b) => b.id === neu[0]));
      haptic.success();
    }
  }, [stats, seen]);

  if (!fresh) return null;
  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={() => setFresh(null)}>
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setFresh(null)} accessibilityLabel="Schließen" />
        <View style={[styles.newTag, { backgroundColor: fresh.color }]}>
          <Text style={styles.newTagText}>Neues Abzeichen</Text>
        </View>
        <BadgeVideo id={fresh.id} size={250} />
        <Text style={styles.modalName}>{fresh.name}</Text>
        <Text style={[styles.modalSub, { color: fresh.color }]}>{fresh.goal}</Text>
        {onShare ? (
          <View style={styles.modalBtns}>
            <Pressable
              onPress={() => {
                const b = fresh;
                setFresh(null);
                onShare(b);
              }}
              accessibilityRole="button"
              style={({ pressed }) => [styles.mBtn, styles.mBtnLime, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.mBtnLimeText}>Teilen</Text>
            </Pressable>
          </View>
        ) : null}
        <Text style={styles.modalHint}>Tippen zum Schließen</Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  newTag: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: 'center',
    transform: [{ rotate: '-5deg' }],
    marginBottom: 10,
  },
  newTagText: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: COLORS.onLime,
  },
  videoWrap: {
    overflow: 'hidden',
    backgroundColor: '#070C17',
  },
  shelf: {
    gap: 14,
    paddingRight: 4,
  },
  shelfItem: {
    alignItems: 'center',
    gap: 8,
    width: 80,
  },
  lock: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: COLORS.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    width: 56,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.tile,
    overflow: 'hidden',
  },
  barFill: {
    height: 4,
    borderRadius: 2,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  mBtn: {
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  mBtnLime: {
    backgroundColor: COLORS.lime,
  },
  mBtnGhost: {
    backgroundColor: COLORS.raised,
  },
  mBtnLimeText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.onLime,
  },
  mBtnGhostText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.text,
  },
  shelfName: {
    fontFamily: FONTS.semibold,
    fontSize: 12,
    color: COLORS.text2,
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(3,5,10,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  modalName: {
    ...TYPE.display,
    fontSize: 44,
    lineHeight: 46,
    marginTop: 14,
    textAlign: 'center',
  },
  modalSub: {
    fontFamily: FONTS.semibold,
    fontSize: 14,
  },
  modalHint: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.text3,
    marginTop: 18,
  },
});

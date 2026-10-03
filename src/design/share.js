// Teilbare Story-Karten (9:16, 1080 × 1920) im Night-Badge-Stil.
// openShare({ kind, ... }) von überall aufrufen – <ShareHost/> in App.js zeigt Vorschau + Teilen.
import React, { useEffect, useRef, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { COLORS, FONTS, TYPE } from '../theme';
import { PROFILE_IMAGES } from './badges';
import { FirLine } from './ambient';
import { haptic } from './haptics';

let ViewShot = null;
let Sharing = null;
try {
  ViewShot = require('react-native-view-shot');
} catch (e) {
  ViewShot = null;
}
try {
  Sharing = require('expo-sharing');
} catch (e) {
  Sharing = null;
}

// ---- mini Event-Bus ----
const listeners = new Set();
export function openShare(card) {
  listeners.forEach((fn) => fn(card));
}

const W = 270;
const H = 480;

const KIND = {
  level: { badge: 'levelup', accent: COLORS.lime, kicker: 'Level geschafft' },
  battle: { badge: 'battle', accent: COLORS.pink, kicker: 'Battle-Sieg' },
  week: { badge: 'nightbadge', accent: COLORS.cyan, kicker: 'Meine Woche' },
  badge: { badge: 'nightbadge', accent: COLORS.violet, kicker: 'Neues Abzeichen' },
};

function StatPill({ label, value, accent }) {
  return (
    <View style={styles.statPill}>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function StoryCard({ card, sport, profile }) {
  const k = KIND[card.kind] || KIND.week;
  const badge = card.badge || k.badge;
  const accent = card.accent || k.accent;
  const nick = profile?.nickname ? `@${profile.nickname}` : '';
  const stats = card.stats || {};

  let headline = card.title;
  if (!headline) {
    if (card.kind === 'level') headline = card.level || 'Level Up';
    else if (card.kind === 'battle') headline = card.winner ? `${card.winner} gewinnt` : 'Gewonnen';
    else if (card.kind === 'badge') headline = card.name || 'Night Badge';
    else headline = `${stats.tricks || 0} Tricks`;
  }

  return (
    <View style={styles.card} collapsable={false}>
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="sbg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0B1736" />
            <Stop offset="0.55" stopColor="#060C1C" />
            <Stop offset="1" stopColor="#03050A" />
          </LinearGradient>
          <RadialGradient id="sgl" cx="50%" cy="38%" r="55%">
            <Stop offset="0" stopColor={accent} stopOpacity={0.38} />
            <Stop offset="1" stopColor={accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={W} height={H} fill="url(#sbg)" />
        <Rect x="0" y="0" width={W} height={H} fill="url(#sgl)" />
        {[[24, 40, 1.4], [70, 92, 1], [220, 30, 1.6], [246, 120, 1], [36, 170, 0.9], [200, 210, 1.1], [130, 22, 1]].map(([x, y, r], i) => (
          <Circle key={i} cx={x} cy={y} r={r} fill="#F4F6FB" fillOpacity={0.7} />
        ))}
      </Svg>
      <FirLine height={70} back="#0D1E2E" front="#050A12" />

      <View style={styles.cardTop}>
        <Text style={styles.brand}>
          AFTER<Text style={{ color: COLORS.cyan }}>[</Text>DARK
        </Text>
        <Text style={styles.sport}>{sport?.name || ''}</Text>
      </View>

      <View style={styles.badgeWrap}>
        <Image source={PROFILE_IMAGES[badge] || PROFILE_IMAGES.nightbadge} style={styles.badge} />
      </View>

      <View style={[styles.kicker, { backgroundColor: accent }]}>
        <Text style={styles.kickerText}>{k.kicker}</Text>
      </View>
      <Text style={styles.headline} numberOfLines={2} adjustsFontSizeToFit>
        {headline}
      </Text>
      {card.sub ? <Text style={styles.sub} numberOfLines={2}>{card.sub}</Text> : null}

      {card.kind === 'week' ? (
        <View style={styles.statRow}>
          <StatPill label="Streak" value={`${stats.streak || 0}`} accent={COLORS.lime} />
          <StatPill label="Minuten" value={`${stats.trainingMinutes || 0}`} accent={COLORS.cyan} />
          <StatPill label="Siege" value={`${stats.wins || 0}`} accent={COLORS.pink} />
        </View>
      ) : null}

      <Text style={styles.nick}>{nick}</Text>
    </View>
  );
}

export function ShareHost({ sport, profile }) {
  const [card, setCard] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const fn = (c) => {
      setMsg('');
      setCard(c);
    };
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);

  const share = async () => {
    if (!ViewShot || !Sharing) {
      setMsg('Teilen ist in dieser App-Version nicht verfügbar.');
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      haptic.tap();
      const uri = await ViewShot.captureRef(ref, {
        format: 'png',
        quality: 1,
        width: 1080,
        height: 1920,
        result: 'tmpfile',
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'After[Dark teilen' });
      } else {
        setMsg('Auf diesem Gerät kann nicht geteilt werden.');
      }
    } catch (e) {
      setMsg('Bild konnte nicht erstellt werden.');
    } finally {
      setBusy(false);
    }
  };

  if (!card) return null;

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={() => setCard(null)}>
      <View style={styles.scrim}>
        <View ref={ref} collapsable={false} style={styles.shadow}>
          <StoryCard card={card} sport={sport} profile={profile} />
        </View>
        {msg ? <Text style={styles.msg}>{msg}</Text> : null}
        <View style={styles.btnRow}>
          <Pressable
            onPress={() => setCard(null)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.btnGhostText}>Schließen</Text>
          </Pressable>
          <Pressable
            onPress={share}
            disabled={busy}
            accessibilityRole="button"
            style={({ pressed }) => [styles.btn, styles.btnLime, (pressed || busy) && { opacity: 0.85 }]}
          >
            <Text style={styles.btnLimeText}>{busy ? 'Moment…' : 'Story teilen'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(3,5,10,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    padding: 24,
  },
  shadow: {
    borderRadius: 22,
    overflow: 'hidden',
    boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
  },
  card: {
    width: W,
    height: H,
    backgroundColor: '#03050A',
    alignItems: 'center',
    paddingTop: 22,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  cardTop: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    fontFamily: FONTS.logo,
    fontSize: 17,
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  sport: {
    fontFamily: FONTS.semibold,
    fontSize: 11,
    color: COLORS.text2,
  },
  badgeWrap: {
    marginTop: 26,
    width: 168,
    height: 168,
    borderRadius: 84,
    boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
  },
  badge: {
    width: 168,
    height: 168,
    borderRadius: 84,
  },
  kicker: {
    marginTop: 22,
    paddingHorizontal: 12,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    transform: [{ rotate: '-4deg' }],
  },
  kickerText: {
    fontFamily: FONTS.display,
    fontSize: 15,
    color: COLORS.onLime,
  },
  headline: {
    ...TYPE.display,
    fontSize: 40,
    lineHeight: 42,
    textAlign: 'center',
    marginTop: 12,
    alignSelf: 'stretch',
  },
  sub: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.text2,
    textAlign: 'center',
    marginTop: 4,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  statPill: {
    backgroundColor: 'rgba(22,32,58,0.85)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 64,
  },
  statValue: {
    ...TYPE.number,
    fontSize: 22,
    lineHeight: 24,
  },
  statLabel: {
    fontFamily: FONTS.medium,
    fontSize: 10,
    color: COLORS.text3,
  },
  nick: {
    position: 'absolute',
    bottom: 18,
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.text,
  },
  msg: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.pinkText,
    textAlign: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    height: 52,
    borderRadius: 26,
    paddingHorizontal: 22,
    justifyContent: 'center',
  },
  btnGhost: {
    backgroundColor: COLORS.raised,
  },
  btnGhostText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.text,
  },
  btnLime: {
    backgroundColor: COLORS.lime,
  },
  btnLimeText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.onLime,
  },
});

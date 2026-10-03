// Night Ride v2 – Atmosphäre: Tageszeit-Himmel, Sport-Farbwelt, Winter-Schnee,
// Tannen-Silhouette und Leerzustände mit Charakter. Reine Darstellung.
import React, { memo, useEffect, useId, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Mask, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { COLORS, FONTS, TYPE } from '../theme';

const uid = (raw) => `b${String(raw).replace(/[^a-zA-Z0-9]/g, '')}`;

function useReduced() {
  const [r, setR] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then((v) => alive && setR(!!v)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v) => setR(!!v));
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);
  return r;
}

// ---------- 1 · Tageszeit ----------
// dawn 5–8 · day 8–17 · dusk 17–21 · night 21–5
export function skyPhase(date = new Date()) {
  const h = date.getHours() + date.getMinutes() / 60;
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 17) return 'day';
  if (h >= 17 && h < 21) return 'dusk';
  return 'night';
}

export const PHASE_LABEL = {
  dawn: 'Morgengrauen',
  day: 'Tag',
  dusk: 'Dämmerung',
  night: 'Nacht',
};

// Phase aktualisiert sich jede Minute
export function useSkyPhase() {
  const [phase, setPhase] = useState(skyPhase());
  useEffect(() => {
    const t = setInterval(() => setPhase(skyPhase()), 60000);
    return () => clearInterval(t);
  }, []);
  return phase;
}

const SKY = {
  // [oben, mitte, unten-transparent], Horizontlicht
  dawn: { top: '#1B2350', mid: '#3A2A5C', horizon: '#FFB38A', horizonOpacity: 0.32, stars: 0.35 },
  day: { top: '#123A6B', mid: '#0E2747', horizon: '#6CB6FF', horizonOpacity: 0.18, stars: 0 },
  dusk: { top: '#2A1F5C', mid: '#3B1C4F', horizon: '#FF3D8B', horizonOpacity: 0.22, stars: 0.6 },
  night: { top: '#081329', mid: '#060C1C', horizon: '#38E1F2', horizonOpacity: 0.08, stars: 1 },
};

// Mondposition je Phase (Offset für MoonArt)
export const MOON_POS = {
  dawn: { right: 170, top: -18, scale: 0.6 },
  day: { right: -70, top: -50, scale: 0.55 },
  dusk: { right: 40, top: -14, scale: 0.78 },
  night: { right: -34, top: -6, scale: 1 },
};

const STARS = [
  [0.08, 0.14, 1.6], [0.2, 0.32, 1], [0.34, 0.1, 1.3], [0.46, 0.26, 0.9], [0.58, 0.08, 1.5],
  [0.12, 0.5, 1], [0.27, 0.62, 1.2], [0.41, 0.44, 0.8], [0.66, 0.36, 1], [0.86, 0.18, 1.2],
  [0.92, 0.46, 0.9], [0.74, 0.6, 1.1], [0.05, 0.78, 0.8], [0.52, 0.7, 1],
];

export const SkyBackdrop = memo(function SkyBackdrop({ phase = 'night', accent = COLORS.lime, height = 236, winter = false }) {
  const id = uid(useId());
  const s = SKY[phase] || SKY.night;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height={height} viewBox="0 0 412 236" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={s.top} stopOpacity={0.95} />
            <Stop offset="0.6" stopColor={s.mid} stopOpacity={0.55} />
            <Stop offset="1" stopColor={COLORS.bg} stopOpacity={0} />
          </LinearGradient>
          <RadialGradient id={`${id}h`} cx="50%" cy="100%" r="70%">
            <Stop offset="0" stopColor={s.horizon} stopOpacity={s.horizonOpacity} />
            <Stop offset="1" stopColor={s.horizon} stopOpacity={0} />
          </RadialGradient>
          {/* 2 · Sport-Farbwelt: weiches Licht unten links in der Sportfarbe */}
          <RadialGradient id={`${id}a`} cx="0%" cy="100%" r="80%">
            <Stop offset="0" stopColor={accent} stopOpacity={0.42} />
            <Stop offset="1" stopColor={accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="412" height="236" fill={`url(#${id}s)`} />
        <Rect x="0" y="60" width="412" height="176" fill={`url(#${id}h)`} />
        <Rect x="0" y="40" width="300" height="196" fill={`url(#${id}a)`} />
        {s.stars > 0
          ? STARS.map(([x, y, r], i) => (
              <Circle key={i} cx={x * 412} cy={y * 236} r={r} fill={winter ? '#DCEBFA' : '#F4F6FB'} fillOpacity={s.stars * (0.35 + (i % 3) * 0.2)} />
            ))
          : null}
        {/* Sportfarbe als dünne Linie am unteren Rand */}
        <Rect x="18" y="232" width="64" height="4" rx="2" fill={accent} fillOpacity={0.9} />
      </Svg>
    </View>
  );
});

// ---------- 3 · Winter-Schnee ----------
function Flake({ x, size, duration, delay, drift, height, reduced }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return undefined;
    const loop = Animated.loop(
      Animated.timing(v, { toValue: 1, duration, delay, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [v, duration, delay, reduced]);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [-20, height + 20] });
  const translateX = v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, drift, 0] });
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: 0,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#E8F2FF',
        opacity: reduced ? 0 : 0.18 + size / 18,
        transform: [{ translateY }, { translateX }],
      }}
    />
  );
}

export const SnowFall = memo(function SnowFall({ count = 26 }) {
  const { width, height } = useWindowDimensions();
  const reduced = useReduced();
  const flakes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (i / count) * width + ((i * 37) % 23) - 10,
        size: 2 + ((i * 7) % 4),
        duration: 9000 + ((i * 1311) % 7000),
        delay: (i * 677) % 9000,
        drift: ((i % 2 ? 1 : -1) * (8 + ((i * 13) % 18))),
      })),
    [count, width]
  );
  if (reduced) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {flakes.map((f, i) => (
        <Flake key={i} {...f} height={height} reduced={reduced} />
      ))}
    </View>
  );
});

// ---------- 10 · Tannen-Silhouette ----------
function firPath(x, base, h, w) {
  const t = base - h;
  return `M${x} ${t} L${x + w * 0.32} ${t + h * 0.34} L${x + w * 0.18} ${t + h * 0.34} L${x + w * 0.44} ${t + h * 0.66} L${x + w * 0.26} ${t + h * 0.66} L${x + w * 0.5} ${base} L${x - w * 0.5} ${base} L${x - w * 0.26} ${t + h * 0.66} L${x - w * 0.44} ${t + h * 0.66} L${x - w * 0.18} ${t + h * 0.34} L${x - w * 0.32} ${t + h * 0.34} Z`;
}

const FIRS_BACK = [[10, 46], [38, 58], [66, 40], [96, 62], [128, 48], [160, 66], [196, 44], [226, 60], [258, 52], [290, 68], [322, 46], [352, 60], [384, 50], [410, 62]];
const FIRS_FRONT = [[24, 36], [80, 44], [140, 32], [214, 42], [276, 34], [340, 46], [398, 38]];

export const FirLine = memo(function FirLine({ height = 74, back = '#0F2A2A', front = '#06100F', snow = false, style }) {
  const d1 = FIRS_BACK.map(([x, h]) => firPath(x, 74, h, h * 0.55)).join(' ');
  const d2 = FIRS_FRONT.map(([x, h]) => firPath(x, 74, h, h * 0.6)).join(' ');
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, height }, style]}>
      <Svg width="100%" height={height} viewBox="0 0 412 74" preserveAspectRatio="xMidYMax slice">
        <Path d={d1} fill={back} />
        <Path d={d2} fill={front} />
        {snow
          ? FIRS_FRONT.map(([x, h], i) => (
              <Path key={i} d={`M${x} ${74 - h} L${x + 5} ${74 - h + 8} L${x - 5} ${74 - h + 8} Z`} fill="#E8F2FF" fillOpacity={0.85} />
            ))
          : null}
        <Rect x="0" y="70" width="412" height="4" fill={front} />
      </Svg>
    </View>
  );
});

// ---------- 6 · Leerzustände ----------
const EMPTY_LINES = {
  chat: ['Noch still hier.', 'Schreib die erste Nachricht – irgendwer muss ja anfangen.'],
  memories: ['Noch keine Highlights.', 'Der beste Clip ist der, den du noch nicht gefilmt hast.'],
  notes: ['Notizbuch ist leer.', 'Schreib dir den Trick auf, bevor du ihn wieder vergisst.'],
  crew: ['Noch keiner draußen.', 'Sei der Erste – die anderen kommen nach.'],
  history: ['Noch keine Battles.', 'Münze werfen, Trick setzen, los.'],
  default: ['Hier ist noch nichts.', 'Die Nacht ist noch jung.'],
};

export const EmptyScene = memo(function EmptyScene({ kind = 'default', title, text, accent = COLORS.cyan, style }) {
  const id = uid(useId());
  const [t, s] = EMPTY_LINES[kind] || EMPTY_LINES.default;
  return (
    <View style={[styles.empty, style]}>
      <Svg width={120} height={84} viewBox="0 0 120 84">
        <Defs>
          <RadialGradient id={`${id}g`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={accent} stopOpacity={0.35} />
            <Stop offset="1" stopColor={accent} stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id={`${id}m`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#F4F6FB" />
            <Stop offset="1" stopColor={accent} />
          </LinearGradient>
          <Mask id={`${id}k`}>
            <Rect x="0" y="0" width="120" height="84" fill="#fff" />
            <Circle cx="72" cy="22" r="16" fill="#000" />
          </Mask>
        </Defs>
        <Circle cx="62" cy="32" r="34" fill={`url(#${id}g)`} />
        <Circle cx="62" cy="32" r="18" fill={`url(#${id}m)`} mask={`url(#${id}k)`} />
        <Circle cx="16" cy="14" r="1.6" fill="#F4F6FB" fillOpacity={0.7} />
        <Circle cx="104" cy="10" r="1.2" fill="#F4F6FB" fillOpacity={0.5} />
        <Circle cx="98" cy="46" r="1" fill="#F4F6FB" fillOpacity={0.6} />
        <Path d="M0 84 L0 70 C24 62 40 66 60 72 C80 78 96 64 120 66 L120 84 Z" fill="#16203A" />
        <Rect x="44" y="66" width="20" height="4" rx="2" fill={COLORS.lime} />
      </Svg>
      <Text style={styles.emptyTitle}>{title || t}</Text>
      <Text style={styles.emptyText}>{text || s}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  emptyTitle: {
    ...TYPE.head,
    fontSize: 18,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 4,
  },
  emptyText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.text3,
    textAlign: 'center',
    maxWidth: 260,
  },
});

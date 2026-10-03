import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import AppIcon from '../components/AppIcon';
import { COLORS, FONTS, TYPE } from '../theme';
import { BadgeVideo } from './badges';
import { haptic } from './haptics';
import { openShare } from './share';

// Night Ride v2 – Bewegung. Reine Darstellung, alle Animationen laufen auf dem nativen Treiber.
// Respektiert die Systemeinstellung "Bewegung reduzieren".

export function useReducedMotion() {
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

// Weiches Hereingleiten beim ersten Anzeigen (z. B. Poster-Grafik, Spot-Karten)
export function FadeSlideIn({ children, from = 'up', distance = 24, delay = 0, duration = 420, style }) {
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [v, duration, delay]);
  if (reduced) return <View style={style}>{children}</View>;
  const offset = v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] });
  const transform = from === 'right' ? [{ translateX: offset }] : from === 'left' ? [{ translateX: Animated.multiply(offset, -1) }] : [{ translateY: offset }];
  return <Animated.View style={[style, { opacity: v, transform }]}>{children}</Animated.View>;
}

// Kurzer Pop (Skalierung mit Überschwinger). Neu auslösen über `key`.
export function PopIn({ children, from = 0.6, style }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(v, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }).start();
  }, [v]);
  return (
    <Animated.View style={[style, { transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [from, 1] }) }] }]}>
      {children}
    </Animated.View>
  );
}

// Knallt groß rein (Sticker, Bingo)
export function SlamIn({ children, style }) {
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(v, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }).start();
  }, [v]);
  if (reduced) return <View style={style}>{children}</View>;
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [2.4, 1] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// Funkenstoß aus eckigen Schnipseln, einmalig. Neu auslösen über `key`.
export function Burst({ size = 120, colors = [COLORS.lime, COLORS.text, COLORS.cyan] }) {
  const v = useRef(new Animated.Value(0)).current;
  const parts = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 + Math.random() * 0.4;
        const d = size * (0.38 + Math.random() * 0.18);
        return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, c: colors[i % colors.length], r: Math.random() * 180 };
      }),
    [size, colors]
  );
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 650, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [v]);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
      {parts.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width: 7,
            height: 7,
            borderRadius: 1.5,
            backgroundColor: p.c,
            opacity: v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] }) },
              { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, p.dy] }) },
              { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.r + 180}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

// Dauerschleife 0 → 1 (für Atmen, Orbit, Schweben)
export function useLoop(duration, { pingPong = false, easing = Easing.linear, active = true } = {}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) {
      v.setValue(0);
      return undefined;
    }
    const anim = pingPong
      ? Animated.loop(
          Animated.sequence([
            Animated.timing(v, { toValue: 1, duration, easing, useNativeDriver: true }),
            Animated.timing(v, { toValue: 0, duration, easing, useNativeDriver: true }),
          ])
        )
      : Animated.loop(Animated.timing(v, { toValue: 1, duration, easing, useNativeDriver: true }));
    anim.start();
    return () => anim.stop();
  }, [v, duration, pingPong, easing, active]);
  return v;
}

// KI denkt: drei Cyan-Punkte kreisen um ein KI-Symbol
export function ThinkingOrbit({ label = 'Der Coach denkt nach…', color = COLORS.cyan, size = 34 }) {
  const spin = useLoop(1400);
  const rot = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <View style={styles.thinkRow}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <AppIcon name="chip" size={size * 0.48} color={color} />
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: rot }] }]}>
          {[0, 1, 2].map((i) => {
            const a = (i / 3) * Math.PI * 2;
            const r = size / 2 - 3;
            return (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  left: size / 2 + Math.cos(a) * r - 3,
                  top: size / 2 + Math.sin(a) * r - 3,
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: color,
                  opacity: 1 - i * 0.28,
                }}
              />
            );
          })}
        </Animated.View>
      </View>
      {label ? <Text style={[TYPE.caption, { color: COLORS.cyanText }]}>{label}</Text> : null}
    </View>
  );
}

// Weicher Lichthof, der "atmet" (Session läuft)
export function Breathe({ active, color = COLORS.lime, size = 250 }) {
  const t = useLoop(1400, { pingPong: true, easing: Easing.inOut(Easing.quad), active });
  if (!active) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        alignSelf: 'center',
        backgroundColor: color,
        opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.04, 0.12] }),
        transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] }) }],
      }}
    />
  );
}

// Battle-Buchstabe: klappt beim Verlieren um und wackelt
export function LetterTile({ letter, lost, style, lostStyle, textStyle, lostLayer }) {
  const v = useRef(new Animated.Value(lost ? 1 : 0)).current;
  const prev = useRef(lost);
  useEffect(() => {
    if (lost && !prev.current) {
      haptic.heavy();
      v.setValue(0);
      Animated.spring(v, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
    } else if (!lost) {
      v.setValue(0);
    }
    prev.current = lost;
  }, [lost, v]);
  return (
    <Animated.View
      style={[
        style,
        lost && lostStyle,
        {
          transform: [
            { perspective: 400 },
            { rotateX: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '90deg', '0deg'] }) },
            { rotate: v.interpolate({ inputRange: [0, 0.7, 0.85, 1], outputRange: ['0deg', '-6deg', '5deg', '0deg'] }) },
          ],
        },
      ]}
    >
      {lost ? lostLayer : null}
      <Text style={[textStyle, lost && { color: '#FFFFFF' }]}>{letter}</Text>
    </Animated.View>
  );
}

// Münze dreht sich beim Wurf. Neu auslösen über `key`.
export function CoinFlip({ children, animate = true }) {
  const v = useRef(new Animated.Value(animate ? 0 : 1)).current;
  useEffect(() => {
    if (!animate) return;
    haptic.medium();
    Animated.timing(v, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [v, animate]);
  return (
    <Animated.View
      style={{
        alignSelf: 'flex-start',
        transform: [
          { perspective: 500 },
          { rotateY: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '1080deg'] }) },
          { translateY: v.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, -26, 0] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

// Mond geht hinter einer Kante auf (Leerzustände)
export function MoonRise({ size = 64, style }) {
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const glow = useLoop(1800, { pingPong: true, easing: Easing.inOut(Easing.quad) });
  useEffect(() => {
    if (reduced) return;
    Animated.timing(v, { toValue: 1, duration: 1400, delay: 200, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }).start();
  }, [v, reduced]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        style,
        {
          opacity: v,
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [size * 0.8, 0] }) }],
        },
      ]}
    >
      <Animated.View
        style={{
          position: 'absolute',
          left: -size * 0.35,
          top: -size * 0.35,
          width: size * 1.7,
          height: size * 1.7,
          borderRadius: size,
          backgroundColor: COLORS.cyan,
          opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.16] }),
        }}
      />
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path d="M64 8 A44 44 0 1 0 92 66 A36 36 0 1 1 64 8 Z" fill="#9AF0F8" />
      </Svg>
    </Animated.View>
  );
}

// Keine Verbindung: Mond verschwindet hinter einer vorbeiziehenden Wolke
export function CloudMoon({ size = 42 }) {
  const t = useLoop(2600, { pingPong: true, easing: Easing.inOut(Easing.quad) });
  return (
    <View style={{ width: size, height: size, borderRadius: 14, backgroundColor: COLORS.pinkSoft, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size * 0.62} height={size * 0.62} viewBox="0 0 100 100">
        <Path d="M64 8 A44 44 0 1 0 92 66 A36 36 0 1 1 64 8 Z" fill="#9AF0F8" />
      </Svg>
      <Animated.View
        style={{
          position: 'absolute',
          transform: [{ translateX: t.interpolate({ inputRange: [0, 1], outputRange: [-size * 0.55, size * 0.25] }) }],
        }}
      >
        <Svg width={size * 0.8} height={size * 0.5} viewBox="0 0 80 50">
          <Path d="M18 44h44a12 12 0 0 0 1-24A18 18 0 0 0 28 16 14 14 0 0 0 18 44z" fill="#FF7DB0" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const CONFETTI = [COLORS.lime, COLORS.cyan, COLORS.pink, COLORS.text, COLORS.violet];

function ConfettiPiece({ x, delay, height, color, w, h, spin }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 1900 + Math.random() * 700, delay, easing: Easing.in(Easing.quad), useNativeDriver: true }).start();
  }, [v, delay]);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: -30,
        width: w,
        height: h,
        borderRadius: 1.5,
        backgroundColor: color,
        opacity: v.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] }),
        transform: [
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, height] }) },
          { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${spin}deg`] }) },
        ],
      }}
    />
  );
}

// Vollbild-Moment, wenn ein Level komplett ist
export function LevelCelebration({ level, onDone }) {
  const { width, height } = useWindowDimensions();
  const scrim = useRef(new Animated.Value(0)).current;
  const pieces = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        x: Math.random() * width,
        delay: Math.random() * 500,
        color: CONFETTI[i % CONFETTI.length],
        w: 6 + Math.random() * 6,
        h: 10 + Math.random() * 10,
        spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540),
      })),
    [width, level]
  );

  const doneRef = useRef(onDone);
  const timerRef = useRef(null);
  doneRef.current = onDone;

  useEffect(() => {
    if (!level) return undefined;
    scrim.setValue(0);
    haptic.success();
    Animated.timing(scrim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    const timer = setTimeout(() => doneRef.current?.(), 4200);
    timerRef.current = timer;
    return () => clearTimeout(timer);
  }, [level, scrim]);

  if (!level) return null;

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={onDone}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDone} accessibilityLabel="Schließen">
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, { opacity: scrim }]}>
          {pieces.map((p, i) => (
            <ConfettiPiece key={`${level}-${i}`} {...p} height={height + 60} />
          ))}
          <SlamIn style={{ alignItems: 'center', gap: 18 }}>
            <BadgeVideo id="levelup" size={168} />
            <View style={styles.sticker}>
              <Text style={[TYPE.display, { color: COLORS.onLime, fontSize: 24, lineHeight: 28 }]}>Level geschafft</Text>
            </View>
            <Text style={styles.levelName} numberOfLines={1} adjustsFontSizeToFit>
              {level}
            </Text>
            <Text style={styles.levelSub}>Starke Leistung – weiter geht’s</Text>
            <Pressable
              onPress={() => {
                clearTimeout(timerRef.current);
                const lv = level;
                doneRef.current?.();
                openShare({ kind: 'level', level: lv, sub: 'Neues Level freigeschaltet' });
              }}
              accessibilityRole="button"
              style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.shareText}>Story teilen</Text>
            </Pressable>
          </SlamIn>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  thinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scrim: {
    backgroundColor: 'rgba(3,5,10,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sticker: {
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.lime,
    justifyContent: 'center',
    alignSelf: 'center',
    transform: [{ rotate: '-6deg' }],
  },
  levelName: {
    ...TYPE.display,
    fontSize: 84,
    lineHeight: 82,
    textAlign: 'center',
  },
  shareBtn: {
    height: 46,
    borderRadius: 23,
    paddingHorizontal: 22,
    backgroundColor: COLORS.lime,
    justifyContent: 'center',
    marginTop: 6,
  },
  shareText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.onLime,
  },
  levelSub: {
    fontFamily: FONTS.semibold,
    fontSize: 14,
    color: COLORS.text2,
  },
});

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Mask,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
  TextPath,
} from 'react-native-svg';
import Logo from '../components/Logo';
import { COLORS, FONTS } from '../theme';

// Night Ride v2 – animierter Ladebildschirm (Night Badge).
// Reine Darstellung: zeigt nur Animationen, lädt und speichert nichts.

const RING_R = 352;
const RING_C = 2 * Math.PI * RING_R;

const STARS = [
  { x: 330, y: 300, r: 6, d: 0 },
  { x: 700, y: 250, r: 5, d: 400 },
  { x: 390, y: 215, r: 4, d: 800 },
  { x: 760, y: 410, r: 4, d: 1200 },
  { x: 255, y: 440, r: 4, d: 600 },
];

function useLoop(duration, delay = 0) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration, delay, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [v, duration, delay]);
  return v;
}

function Star({ x, y, r, d, scale }) {
  const t = useLoop(900, d);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: (x - 160) * scale - r * scale,
        top: (y - 160) * scale - r * scale,
        width: r * 2 * scale,
        height: r * 2 * scale,
        borderRadius: r * scale,
        backgroundColor: COLORS.text,
        opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.95] }),
        transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.25] }) }],
      }}
    />
  );
}

function Dot({ delay }) {
  const t = useLoop(420, delay);
  return (
    <Animated.View
      style={[
        styles.dot,
        {
          opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
          transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }],
        },
      ]}
    />
  );
}

export default function LoadingScreen({ fontsReady = false }) {
  const { width } = useWindowDimensions();
  const size = Math.min(width * 0.8, 340);
  const k = size / 1024;
  const inner = 704 * k;

  const intro = useRef(new Animated.Value(0)).current;
  const ringIn = useRef(new Animated.Value(0)).current;
  const comet = useRef(new Animated.Value(0)).current;
  const moon = useRef(new Animated.Value(0)).current;
  const word = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const textIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(intro, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(ringIn, { toValue: 1, duration: 900, delay: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(moon, { toValue: 1, duration: 1300, delay: 300, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
    ]).start();

    const rotate = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 24000, easing: Easing.linear, useNativeDriver: true })
    );
    const orbit = Animated.loop(
      Animated.timing(comet, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
    );
    rotate.start();
    orbit.start();
    return () => {
      rotate.stop();
      orbit.stop();
    };
  }, [intro, ringIn, comet, moon, spin]);

  useEffect(() => {
    if (!fontsReady) return;
    Animated.parallel([
      Animated.timing(textIn, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(word, { toValue: 1, duration: 700, delay: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fontsReady, textIn, word]);

  return (
    <View style={styles.screen}>
      <Animated.View
        style={{
          width: size,
          height: size,
          opacity: intro,
          transform: [{ scale: intro.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) }],
        }}
      >
        <Svg width={size} height={size} viewBox="0 0 1024 1024" style={StyleSheet.absoluteFill}>
          <Circle cx="512" cy="512" r="500" fill="#0A111F" />
        </Svg>

        {fontsReady ? (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: textIn,
                transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
              },
            ]}
          >
            <Svg width={size} height={size} viewBox="0 0 1024 1024">
              <Defs>
                <Path id="ldRing" d="M512 512 m-420 0 a420 420 0 1 1 840 0 a420 420 0 1 1 -840 0" />
              </Defs>
              <SvgText fill="#8793AA" fontSize="54" fontFamily={FONTS.headX} letterSpacing="9">
                <TextPath href="#ldRing" startOffset="0">
                  AFTER[DARK · FREESTYLE · NIGHT RIDE · CREW ·
                </TextPath>
              </SvgText>
            </Svg>
          </Animated.View>
        ) : null}

        <View
          style={{
            position: 'absolute',
            left: 160 * k,
            top: 160 * k,
            width: inner,
            height: inner,
            borderRadius: inner / 2,
            overflow: 'hidden',
          }}
        >
          <Svg width={inner} height={inner} viewBox="160 160 704 704" style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="ldBg" cx="50%" cy="38%" r="70%">
                <Stop offset="0" stopColor="#16305A" />
                <Stop offset="0.6" stopColor="#0A111F" />
                <Stop offset="1" stopColor="#03050A" />
              </RadialGradient>
            </Defs>
            <Rect x="160" y="160" width="704" height="704" fill="url(#ldBg)" />
          </Svg>

          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: moon,
                transform: [{ translateY: moon.interpolate({ inputRange: [0, 1], outputRange: [inner * 0.35, 0] }) }],
              },
            ]}
          >
            <Svg width={inner} height={inner} viewBox="160 160 704 704">
              <Defs>
                <RadialGradient id="ldHalo" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor="#38E1F2" stopOpacity="0.45" />
                  <Stop offset="1" stopColor="#38E1F2" stopOpacity="0" />
                </RadialGradient>
                <LinearGradient id="ldMoon" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#E6FDFF" />
                  <Stop offset="0.42" stopColor="#38E1F2" />
                  <Stop offset="1" stopColor="#0B3A4A" />
                </LinearGradient>
                <Mask id="ldMask">
                  <Rect x="0" y="0" width="1024" height="1024" fill="#fff" />
                  <Circle cx="590" cy="350" r="168" fill="#000" />
                </Mask>
              </Defs>
              <Circle cx="512" cy="420" r="300" fill="url(#ldHalo)" />
              <Circle cx="512" cy="420" r="200" mask="url(#ldMask)" fill="url(#ldMoon)" />
            </Svg>
          </Animated.View>

          {STARS.map((s) => (
            <Star key={`${s.x}-${s.y}`} {...s} scale={k} />
          ))}

          <Svg width={inner} height={inner} viewBox="160 160 704 704" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="ldRamp" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#2E4478" />
                <Stop offset="1" stopColor="#121C36" />
              </LinearGradient>
            </Defs>
            <Path
              d="M150 900 L150 560 L196 560 L196 586 C196 760 330 820 520 820 L640 820 L640 724 L860 724 L860 820 L900 820 L900 900 Z"
              fill="url(#ldRamp)"
            />
            <Rect x="150" y="548" width="60" height="18" rx="9" fill="#CFFF3A" />
            <Rect x="628" y="712" width="244" height="16" rx="8" fill="#6CB6FF" />
          </Svg>
        </View>

        <Animated.View style={[StyleSheet.absoluteFill, { opacity: ringIn }]}>
          <Svg width={size} height={size} viewBox="0 0 1024 1024">
            <Circle cx="512" cy="512" r={RING_R} fill="none" stroke="#CFFF3A" strokeOpacity={0.55} strokeWidth="10" />
          </Svg>
        </Animated.View>

        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: ringIn,
              transform: [{ rotate: comet.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
            },
          ]}
        >
          <Svg width={size} height={size} viewBox="0 0 1024 1024">
            <Circle cx="512" cy="512" r={RING_R} fill="none" stroke="#CFFF3A" strokeOpacity={0.25} strokeWidth="30" strokeLinecap="round" strokeDasharray={`260 ${RING_C}`} rotation={-90} origin="512, 512" />
            <Circle cx="512" cy="512" r={RING_R} fill="none" stroke="#CFFF3A" strokeWidth="14" strokeLinecap="round" strokeDasharray={`260 ${RING_C}`} rotation={-90} origin="512, 512" />
            <Circle cx="512" cy="512" r={RING_R} fill="none" stroke="#FFFFFF" strokeOpacity={0.85} strokeWidth="6" strokeLinecap="round" strokeDasharray={`40 ${RING_C}`} strokeDashoffset={-220} rotation={-90} origin="512, 512" />
          </Svg>
        </Animated.View>
      </Animated.View>

      <View style={styles.bottom}>
        {fontsReady ? (
          <Animated.View
            style={{
              opacity: word,
              transform: [{ translateY: word.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Logo centered />
            <Text style={styles.tagline}>Night Ride · Freestyle Crew</Text>
          </Animated.View>
        ) : (
          <View style={{ height: 70 }} />
        )}
        <View style={styles.dots}>
          <Dot delay={0} />
          <Dot delay={140} />
          <Dot delay={280} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },
  bottom: {
    alignItems: 'center',
    gap: 22,
  },
  tagline: {
    fontFamily: FONTS.semibold,
    fontSize: 13,
    letterSpacing: 2,
    color: COLORS.text3,
    textTransform: 'uppercase',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.lime,
  },
});

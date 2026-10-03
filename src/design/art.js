import React, { memo, useId } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Mask, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { COLORS, FONTS, TYPE } from '../theme';
import { Breathe } from './motion';
import { MOON_POS } from './ambient';

// Night Ride v2 – Poster-Grafiken. Reine Darstellung, pointerEvents none.

const uid = (raw) => `a${String(raw).replace(/[^a-zA-Z0-9]/g, '')}`;

export function MoonArt({ width = 250, height = 228, phase = 'night', style }) {
  const id = uid(useId());
  const pos = MOON_POS[phase] || MOON_POS.night;
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', right: pos.right, top: pos.top, transform: [{ scale: pos.scale }] }, style]}>
      <Svg width={width} height={height} viewBox="0 0 220 200">
        <Defs>
          <RadialGradient id={`${id}h`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#38E1F2" stopOpacity={0.34} />
            <Stop offset="1" stopColor="#38E1F2" stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#E6FDFF" />
            <Stop offset="0.42" stopColor="#38E1F2" />
            <Stop offset="1" stopColor="#0B3A4A" />
          </LinearGradient>
          <Mask id={`${id}m`}>
            <Rect x="0" y="0" width="220" height="200" fill="#fff" />
            <Circle cx="150" cy="78" r="64" fill="#000" />
          </Mask>
        </Defs>
        <Circle cx="120" cy="100" r="100" fill={`url(#${id}h)`} />
        <Circle cx="120" cy="100" r="70" mask={`url(#${id}m)`} fill={`url(#${id}f)`} />
        <Circle cx="40" cy="36" r="2" fill="#F4F6FB" fillOpacity={0.8} />
        <Circle cx="24" cy="120" r="1.4" fill="#F4F6FB" fillOpacity={0.5} />
        <Circle cx="196" cy="170" r="1.8" fill="#F4F6FB" fillOpacity={0.6} />
      </Svg>
    </View>
  );
}

export function StairsArt({ style }) {
  const id = uid(useId());
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', right: -8, top: 10 }, style]}>
      <Svg width={230} height={210} viewBox="0 0 220 200">
        <Defs>
          <LinearGradient id={`${id}1`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#EAFF9A" />
            <Stop offset="1" stopColor="#8DB70C" />
          </LinearGradient>
          <LinearGradient id={`${id}2`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#CFFF3A" />
            <Stop offset="1" stopColor="#4F6A08" />
          </LinearGradient>
          <LinearGradient id={`${id}3`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1C2946" />
            <Stop offset="1" stopColor="#0B1221" />
          </LinearGradient>
          <RadialGradient id={`${id}h`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#CFFF3A" stopOpacity={0.5} />
            <Stop offset="1" stopColor="#CFFF3A" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="14" y="138" width="42" height="56" rx="12" fill={`url(#${id}1)`} />
        <Rect x="64" y="104" width="42" height="90" rx="12" fill={`url(#${id}2)`} />
        <Rect x="114" y="68" width="42" height="126" rx="12" fill={`url(#${id}3)`} />
        <Rect x="164" y="30" width="42" height="164" rx="12" fill={`url(#${id}3)`} fillOpacity={0.7} />
        <Circle cx="85" cy="82" r="26" fill={`url(#${id}h)`} />
        <Circle cx="85" cy="82" r="9" fill="#F4F6FB" />
      </Svg>
    </View>
  );
}

export function TapeArt({ word = 'SCOOT', style }) {
  const w = String(word || '').toUpperCase();
  const pinkText = `${w} · ${w} · ${w} · ${w} · ${w}`;
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', right: -40, top: -4 }, style]}>
      <Svg width={300} height={236} viewBox="0 0 300 236">
        <G transform="rotate(-16 150 100)">
          <Rect x="-6" y="92" width="330" height="46" fill="#000" fillOpacity={0.45} />
          <Rect x="-10" y="84" width="330" height="46" fill="#F4F6FB" />
          <SvgText x="4" y="117" fill="#060A10" fontSize="27" fontFamily={FONTS.display} letterSpacing="1">
            VS · VS · VS · VS · VS · VS · VS
          </SvgText>
        </G>
        <G transform="rotate(13 150 110)">
          <Rect x="-6" y="100" width="330" height="46" fill="#000" fillOpacity={0.45} />
          <Rect x="-10" y="92" width="330" height="46" fill="#FF3D8B" />
          <SvgText x="10" y="125" fill="#2A0615" fontSize="27" fontFamily={FONTS.display} letterSpacing="1">
            {pinkText}
          </SvgText>
        </G>
      </Svg>
    </View>
  );
}

export function BubblesArt({ style }) {
  const id = uid(useId());
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', right: -20, top: 6 }, style]}>
      <Svg width={240} height={220} viewBox="0 0 220 200">
        <Defs>
          <LinearGradient id={`${id}v`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#C3BAFF" />
            <Stop offset="0.5" stopColor="#8C7CFF" />
            <Stop offset="1" stopColor="#2A1F6A" />
          </LinearGradient>
          <LinearGradient id={`${id}w`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="1" stopColor="#7D88A3" />
          </LinearGradient>
          <LinearGradient id={`${id}c`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#9AF6FF" />
            <Stop offset="1" stopColor="#13869A" />
          </LinearGradient>
        </Defs>
        <Circle cx="92" cy="112" r="62" fill={`url(#${id}v)`} />
        <Circle cx="162" cy="74" r="40" fill={`url(#${id}w)`} />
        <Circle cx="158" cy="152" r="24" fill={`url(#${id}c)`} />
        <Circle cx="40" cy="40" r="3" fill="#F4F6FB" fillOpacity={0.6} />
      </Svg>
    </View>
  );
}

export function SmallArt({ kind = 'crew', style }) {
  const color = kind === 'chat' ? '#FF3D8B' : kind === 'memories' ? '#6CB6FF' : '#8C7CFF';
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', right: -10, top: -6 }, style]}>
      <Svg width={130} height={120} viewBox="0 0 130 120">
        <Circle cx="70" cy="64" r="46" fill={color} fillOpacity={0.85} />
        <Circle cx="108" cy="36" r="22" fill="#F4F6FB" fillOpacity={0.9} />
        <Circle cx="104" cy="98" r="12" fill="#38E1F2" />
      </Svg>
    </View>
  );
}

export function RampArt({ height = 128, colors = ['#16305A', '#0C1A33'], moon = true, snow = false, style }) {
  const id = uid(useId());
  if (snow) return <SnowHillArt height={height} moon={moon} style={style} />;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width="100%" height={height} viewBox="0 0 316 128" preserveAspectRatio="xMidYMax slice">
        <Defs>
          <LinearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors[0]} />
            <Stop offset="1" stopColor={colors[1]} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="316" height="128" fill={`url(#${id}s)`} />
        {moon ? <Circle cx="250" cy="36" r="16" fill="#E6FDFF" fillOpacity={0.9} /> : null}
        {moon ? <Circle cx="258" cy="30" r="14" fill={colors[0]} /> : null}
        <Path d="M0 128 L0 50 L14 50 L14 58 C14 100 50 116 110 116 L180 116 L180 92 L240 92 L240 116 L316 116 L316 128 Z" fill="#0A111F" />
        <Rect x="0" y="46" width="18" height="6" rx="3" fill="#CFFF3A" />
        <Rect x="176" y="88" width="68" height="5" rx="2.5" fill="#6CB6FF" />
      </Svg>
    </View>
  );
}

// Winter: Schneehügel statt Rampe
export function SnowHillArt({ height = 128, moon = true, style }) {
  const id = uid(useId());
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width="100%" height={height} viewBox="0 0 316 128" preserveAspectRatio="xMidYMax slice">
        <Defs>
          <LinearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1C3656" />
            <Stop offset="1" stopColor="#0C1A33" />
          </LinearGradient>
          <LinearGradient id={`${id}h`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F4F9FF" />
            <Stop offset="1" stopColor="#9DB6D6" />
          </LinearGradient>
          <LinearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#8FA9CC" />
            <Stop offset="1" stopColor="#3D5577" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="316" height="128" fill={`url(#${id}s)`} />
        {moon ? <Circle cx="250" cy="34" r="16" fill="#E6FDFF" fillOpacity={0.9} /> : null}
        {moon ? <Circle cx="258" cy="28" r="14" fill="#1C3656" /> : null}
        <Circle cx="40" cy="22" r="1.4" fill="#F4F6FB" fillOpacity={0.7} />
        <Circle cx="120" cy="14" r="1.1" fill="#F4F6FB" fillOpacity={0.6} />
        <Circle cx="190" cy="40" r="1.3" fill="#F4F6FB" fillOpacity={0.5} />
        <Path d="M0 128 L0 82 C40 62 80 64 120 84 C150 98 170 70 216 66 C256 62 290 78 316 74 L316 128 Z" fill={`url(#${id}b)`} />
        <Path d="M0 128 L0 102 C50 86 90 90 140 104 C180 114 220 90 270 92 C292 93 306 98 316 100 L316 128 Z" fill={`url(#${id}h)`} />
        <Rect x="132" y="96" width="44" height="5" rx="2.5" fill="#CFFF3A" transform="rotate(-8 154 98)" />
      </Svg>
    </View>
  );
}

export function DiceArt() {
  return (
    <View pointerEvents="none" style={{ height: 54, width: 90 }}>
      <View style={[styles.die, { left: 0, top: 6, backgroundColor: '#F4F6FB', transform: [{ rotate: '-14deg' }] }]}>
        <View style={[styles.pip, { left: 10, top: 10, backgroundColor: COLORS.onLime }]} />
        <View style={[styles.pip, { right: 10, bottom: 10, backgroundColor: COLORS.onLime }]} />
      </View>
      <View style={[styles.die, { left: 32, top: 0, backgroundColor: '#8C7CFF', transform: [{ rotate: '12deg' }] }]}>
        <View style={[styles.pip, { left: 17, top: 17, width: 8, height: 8, backgroundColor: '#F4F6FB' }]} />
      </View>
    </View>
  );
}

export function CoinArt({ letter = '' }) {
  const id = uid(useId());
  return (
    <View style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={64} height={64} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id={id} cx="35%" cy="30%" r="75%">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="0.45" stopColor="#B9C2D3" />
            <Stop offset="1" stopColor="#5D6780" />
          </RadialGradient>
        </Defs>
        <Circle cx="32" cy="32" r="31" fill={`url(#${id})`} />
      </Svg>
      <Text style={[TYPE.display, { fontSize: 30, lineHeight: 34, color: '#2A3348', paddingRight: 0 }]}>{letter || '?'}</Text>
    </View>
  );
}

export function ChatArt() {
  return (
    <View pointerEvents="none" style={{ height: 70 }}>
      <View style={{ position: 'absolute', left: 0, top: 4, width: 78, height: 44, borderRadius: 22, borderBottomLeftRadius: 6, backgroundColor: COLORS.pink }} />
      <View style={{ position: 'absolute', left: 44, top: 30, width: 66, height: 38, borderRadius: 20, borderBottomRightRadius: 6, backgroundColor: COLORS.text, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
        <View style={styles.chatDot} />
        <View style={styles.chatDot} />
        <View style={styles.chatDot} />
      </View>
    </View>
  );
}

export function PolaroidArt() {
  return (
    <View pointerEvents="none" style={{ height: 70 }}>
      <View style={{ position: 'absolute', left: 8, top: 8, width: 58, height: 62, borderRadius: 8, backgroundColor: '#2A3A5E', transform: [{ rotate: '-10deg' }] }} />
      <View style={{ position: 'absolute', left: 34, top: 0, width: 60, height: 66, borderRadius: 8, backgroundColor: COLORS.text, transform: [{ rotate: '6deg' }] }}>
        <View style={{ position: 'absolute', left: 6, top: 6, right: 6, height: 40, borderRadius: 4, backgroundColor: '#3C78B8' }} />
        <View style={{ position: 'absolute', left: 14, top: 14, width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFE9A8' }} />
      </View>
    </View>
  );
}

// Session-Zifferblatt: 48 Segmente, gefüllt nach Minuten innerhalb der laufenden Stunde.
export const SessionDial = memo(function SessionDial({ minutes = 0, seconds = 0, running = false, children }) {
  const size = 224;
  const segs = 48;
  const filled = running ? Math.min(segs, Math.floor(((minutes % 60) / 60) * segs) + 1) : 0;
  // Lauflicht: ein heller Punkt wandert pro Sekunde ein Segment weiter
  const sweep = running ? seconds % segs : -1;
  const items = [];
  for (let i = 0; i < segs; i += 1) {
    const a = (i / segs) * 2 * Math.PI - Math.PI / 2;
    const r1 = 96;
    const r2 = 111;
    const x1 = 112 + Math.cos(a) * r1;
    const y1 = 112 + Math.sin(a) * r1;
    const x2 = 112 + Math.cos(a) * r2;
    const y2 = 112 + Math.sin(a) * r2;
    items.push(
      <Path
        key={i}
        d={`M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`}
        stroke={i === sweep ? '#F4F6FB' : i < filled ? COLORS.lime : (running && (i === (sweep + segs - 1) % segs || i === (sweep + segs - 2) % segs)) ? '#5C7A2A' : '#1C2744'}
        strokeWidth={9}
        strokeLinecap="round"
      />
    );
  }
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }}>
      <Breathe active={running} size={size + 30} />
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {items}
      </Svg>
      <View style={styles.dialInner}>{children}</View>
    </View>
  );
});

const styles = StyleSheet.create({
  die: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 12,
    boxShadow: '0 8px 18px rgba(0,0,0,0.5)',
  },
  pip: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  chatDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.onLime,
  },
  dialInner: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: '#0B1326',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.06), 0 12px 30px rgba(0,0,0,0.6)',
  },
});

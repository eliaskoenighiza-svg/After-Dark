import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import AppIcon from '../components/AppIcon';
import { COLORS, FONTS, GRADIENTS, RADII, SHADOWS, TYPE } from '../theme';
import { Grad } from './Grad';

// Night Ride v2 – reine UI-Bausteine. Keine Daten, kein State außer Press-Feedback.

export function Surface({ children, style, gradient = GRADIENTS.card, radius = RADII.card, shadow = SHADOWS.card }) {
  return (
    <View style={[{ borderRadius: radius, backgroundColor: COLORS.midnight }, shadow, style]}>
      <Grad {...gradient} radius={radius} />
      {children}
    </View>
  );
}

export function PressSurface({ children, style, gradient = GRADIENTS.card, radius = RADII.card, onPress, disabled, accessibilityLabel }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        { borderRadius: radius, backgroundColor: COLORS.midnight },
        SHADOWS.card,
        style,
        pressed && { transform: [{ scale: 0.985 }], opacity: 0.92 },
      ]}
    >
      <Grad {...gradient} radius={radius} />
      {children}
    </Pressable>
  );
}

export function PosterCard({ children, gradient = GRADIENTS.coach, glow = 'rgba(56,225,242,0.35)', watermark, style }) {
  return (
    <View style={[styles.poster, SHADOWS.poster(glow), style]}>
      <Grad {...gradient} radius={RADII.poster} />
      {watermark ? (
        <Text pointerEvents="none" style={styles.watermark} numberOfLines={1}>
          {watermark}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

export function ScreenPoster({ title, subtitle, art = null, height = 236 }) {
  return (
    <View style={[styles.screenPoster, { height }]}>
      {art ? <View pointerEvents="none" style={StyleSheet.absoluteFill}>{art}</View> : null}
      <View style={styles.screenPosterText}>
        <Text style={styles.screenTitle} numberOfLines={1} adjustsFontSizeToFit>
          {title}
        </Text>
        {subtitle ? <Text style={styles.screenSub}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

export function SectionHead({ title, right = null, size = 19 }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={[TYPE.head, { fontSize: size, lineHeight: size + 4, flexShrink: 1 }]}>{title}</Text>
      {right}
    </View>
  );
}

export function PrimaryButton({ title, onPress, disabled = false, icon = 'arrow', compact = false, style }) {
  const iconColor = disabled ? '#6F7B93' : COLORS.lime;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.cta,
        compact && styles.ctaCompact,
        disabled ? styles.ctaOff : SHADOWS.cta,
        pressed && !disabled && { transform: [{ scale: 0.98 }], opacity: 0.92 },
        style,
      ]}
    >
      <View style={[styles.knob, compact && styles.knobCompact, disabled && styles.knobOff]}>
        <AppIcon
          name={icon}
          size={compact ? 16 : 19}
          color={iconColor}
          strokeWidth={2.4}
          fillOpacity={icon === 'play' ? 1 : 0.35}
        />
      </View>
      <Text numberOfLines={1} style={[styles.ctaText, compact && styles.ctaTextCompact, disabled && { color: '#6F7B93' }]}>
        {title}
      </Text>
    </Pressable>
  );
}

const SECONDARY = {
  default: { bg: COLORS.raised, fg: COLORS.text },
  cyan: { bg: COLORS.raised, fg: COLORS.cyanText },
  pink: { bg: COLORS.pinkSoft, fg: COLORS.pinkText },
  glass: { bg: COLORS.glass, fg: COLORS.text },
  light: { bg: COLORS.text, fg: COLORS.onLime },
  danger: { bg: COLORS.pink, fg: '#FFFFFF' },
};

export function SecondaryButton({ title, onPress, disabled = false, tone = 'default', icon, size = 'md', style, iconColor }) {
  const t = SECONDARY[tone] || SECONDARY.default;
  const small = size === 'sm';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.secondary,
        small && styles.secondarySmall,
        { backgroundColor: t.bg, opacity: disabled ? 0.42 : pressed ? 0.85 : 1 },
        pressed && !disabled && { transform: [{ scale: 0.985 }] },
        style,
      ]}
    >
      {icon ? <AppIcon name={icon} size={small ? 15 : 17} color={iconColor || t.fg} /> : null}
      <Text numberOfLines={1} style={[styles.secondaryText, small && { fontSize: 13 }, { color: t.fg }]}>
        {title}
      </Text>
    </Pressable>
  );
}

export function Segmented({ items, value, onChange, scroll = false, style }) {
  const list = items.map((x) => (typeof x === 'string' ? { key: x, label: x } : x));
  const inner = list.map((x) => {
    const on = x.key === value;
    return (
      <Pressable
        key={String(x.key)}
        onPress={() => onChange(x.key)}
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
        style={[styles.segItem, !scroll && { flex: 1 }, on && styles.segItemOn]}
      >
        {x.icon ? <AppIcon name={x.icon} size={14} color={on ? COLORS.onLime : COLORS.text2} /> : null}
        <Text numberOfLines={1} style={[styles.segText, on && styles.segTextOn]}>
          {x.label}
        </Text>
      </Pressable>
    );
  });
  if (scroll) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        style={[{ marginRight: -18 }, style]}
        contentContainerStyle={[styles.seg, { paddingRight: 4, marginRight: 18 }]}
      >
        {inner}
      </ScrollView>
    );
  }
  return <View style={[styles.seg, style]}>{inner}</View>;
}

const TAG = {
  lime: { bg: COLORS.limeSoft, fg: COLORS.limeText, dot: COLORS.lime },
  pink: { bg: COLORS.pinkSoft, fg: COLORS.pinkText, dot: COLORS.pink },
  cyan: { bg: COLORS.cyanSoft, fg: COLORS.cyanText, dot: COLORS.cyan },
  violet: { bg: COLORS.violetSoft, fg: COLORS.violetText, dot: COLORS.violet },
  neutral: { bg: COLORS.raised, fg: COLORS.text2, dot: COLORS.text3 },
  glass: { bg: COLORS.glass, fg: COLORS.text, dot: COLORS.text },
  dark: { bg: 'rgba(3,5,10,0.55)', fg: COLORS.text, dot: COLORS.text },
  solidLime: { bg: COLORS.lime, fg: COLORS.onLime, dot: COLORS.onLime },
  solidPink: { bg: COLORS.pink, fg: '#1A0510', dot: '#1A0510' },
};

export function Tag({ label, tone = 'neutral', dot = false, icon, big = false, style }) {
  const t = TAG[tone] || TAG.neutral;
  return (
    <View style={[styles.tag, big && styles.tagBig, { backgroundColor: t.bg }, style]}>
      {dot ? <View style={[styles.dot, { backgroundColor: t.dot, boxShadow: `0 0 10px ${t.dot}` }]} /> : null}
      {icon ? <AppIcon name={icon} size={12} color={t.fg} /> : null}
      <Text numberOfLines={1} style={[TYPE.tag, { color: t.fg }]}>
        {label}
      </Text>
    </View>
  );
}

const STICKER = {
  lime: { bg: COLORS.lime, fg: COLORS.onLime },
  white: { bg: COLORS.text, fg: COLORS.onLime },
  pink: { bg: COLORS.pink, fg: '#FFFFFF' },
};

export function Sticker({ label, tone = 'lime', rotate = -5, size = 17, style }) {
  const t = STICKER[tone] || STICKER.lime;
  return (
    <View style={[styles.sticker, { backgroundColor: t.bg, transform: [{ rotate: `${rotate}deg` }] }, style]}>
      <Text style={[TYPE.display, { color: t.fg, fontSize: size, lineHeight: size + 4, paddingRight: 2 }]}>{label}</Text>
    </View>
  );
}

export function StatCard({ value, label, style }) {
  return (
    <View style={[styles.stat, style]}>
      <Text style={[TYPE.number, { fontSize: 30, lineHeight: 32 }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={[TYPE.label, { fontSize: 11 }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function ProgressRing({ size = 58, stroke = 7, progress = 0, color = COLORS.lime, track = '#1A2440', inner = '#0D1527', children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress || 0));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill={inner} />
        {p > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${c * p} ${c}`}
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        ) : null}
      </Svg>
      {children}
    </View>
  );
}

export function IconTile({ name, size = 46, iconSize = 22, gradient, bg, color = COLORS.onLime, radius = 16, fillOpacity = 0.4 }) {
  return (
    <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: bg || 'transparent', alignItems: 'center', justifyContent: 'center' }}>
      {gradient ? <Grad {...gradient} radius={radius} /> : null}
      <AppIcon name={name} size={iconSize} color={color} fillOpacity={fillOpacity} />
    </View>
  );
}

export function Avatar({ uri, letter, size = 40, gradient = GRADIENTS.avatarCyan, color = '#04202A', ring }) {
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
        ring ? { borderWidth: 3, borderColor: ring } : null,
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} />
      ) : (
        <>
          <Grad {...gradient} radius={size / 2} />
          {letter ? (
            <Text style={[TYPE.display, { color, fontSize: size * 0.48, lineHeight: size * 0.56, paddingRight: 0 }]}>{letter}</Text>
          ) : (
            <AppIcon name="user" size={size * 0.5} color={color} fillOpacity={0.5} />
          )}
        </>
      )}
    </View>
  );
}

export function Bubble({ children, tone = 'raised', mine = false, style }) {
  const bg = tone === 'cyan' ? 'rgba(56,225,242,0.10)' : tone === 'violet' ? 'rgba(140,124,255,0.22)' : COLORS.raised;
  return (
    <View
      style={[
        styles.bubble,
        { backgroundColor: bg },
        mine ? { borderTopRightRadius: 6, borderTopLeftRadius: 20, alignSelf: 'flex-end' } : null,
        style,
      ]}
    >
      {typeof children === 'string' ? <Text style={styles.bubbleText}>{children}</Text> : children}
    </View>
  );
}

const styles = StyleSheet.create({
  poster: {
    borderRadius: RADII.poster,
    padding: 22,
    backgroundColor: COLORS.midnight,
    overflow: 'hidden',
  },
  watermark: {
    ...TYPE.display,
    position: 'absolute',
    right: -18,
    top: 30,
    fontSize: 150,
    lineHeight: 150,
    color: 'rgba(255,255,255,0.035)',
  },
  screenPoster: {
    position: 'relative',
    marginHorizontal: -18,
    overflow: 'hidden',
  },
  screenPosterText: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 24,
  },
  screenTitle: {
    ...TYPE.display,
    fontSize: 96,
    lineHeight: 92,
    letterSpacing: -1.2,
  },
  screenSub: {
    ...TYPE.body,
    marginTop: 8,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  cta: {
    height: 60,
    borderRadius: 999,
    backgroundColor: COLORS.lime,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingLeft: 6,
    paddingRight: 24,
  },
  ctaCompact: {
    height: 50,
    gap: 10,
    paddingLeft: 4,
    paddingRight: 16,
  },
  ctaOff: {
    backgroundColor: '#2A3350',
  },
  knob: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.onLime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  knobCompact: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  knobOff: {
    backgroundColor: '#1A2440',
  },
  ctaText: {
    ...TYPE.button,
    color: COLORS.onLime,
    fontSize: 16,
    flexShrink: 1,
  },
  ctaTextCompact: {
    fontSize: 14,
  },
  secondary: {
    height: 48,
    borderRadius: 999,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondarySmall: {
    height: 40,
    paddingHorizontal: 14,
    gap: 7,
  },
  secondaryText: {
    fontFamily: FONTS.semibold,
    fontSize: 14,
    flexShrink: 1,
  },
  seg: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    borderRadius: 999,
    backgroundColor: COLORS.well,
  },
  segItem: {
    height: 36,
    borderRadius: 999,
    paddingHorizontal: 13,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segItemOn: {
    backgroundColor: COLORS.text,
  },
  segText: {
    fontFamily: FONTS.bold,
    fontSize: 12.5,
    color: COLORS.text3,
  },
  segTextOn: {
    color: COLORS.onLime,
  },
  tag: {
    height: 26,
    borderRadius: 999,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  tagBig: {
    height: 32,
    paddingHorizontal: 13,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sticker: {
    height: 30,
    borderRadius: RADII.sticker,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  stat: {
    flex: 1,
    borderRadius: RADII.stat,
    backgroundColor: COLORS.stat,
    paddingTop: 13,
    paddingHorizontal: 12,
    paddingBottom: 11,
    gap: 7,
  },
  bubble: {
    borderRadius: 20,
    borderTopLeftRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 15,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  bubbleText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 21,
    color: '#DDE3EE',
  },
});

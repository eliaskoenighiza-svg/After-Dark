import React from 'react';
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { COLORS, shadow } from '../theme';

const SCENES = {
  cyan: require('../../assets/card-cyan.jpg'),
  pink: require('../../assets/card-pink.jpg'),
  blue: require('../../assets/card-blue.jpg'),
  purple: require('../../assets/card-purple.jpg'),
  lime: require('../../assets/card-lime.jpg'),
  night: require('../../assets/card-night.jpg'),
};

function textOf(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(' ');
  if (node?.props?.children != null) return textOf(node.props.children);
  return '';
}

function sceneFor(children, requested) {
  if (requested && SCENES[requested]) return requested;

  const t = textOf(children).toLowerCase();

  if (t.includes('trick des tages') || t.includes('nächster skill')) return 'cyan';
  if (t.includes('session') || t.includes('countdown') || t.includes('training')) return 'lime';
  if (t.includes('ki-') || t.includes('chat') || t.includes('nachricht')) return 'pink';
  if (t.includes('battle') || t.includes('bingo') || t.includes('münz')) return 'purple';
  if (t.includes('park') || t.includes('wetter') || t.includes('maps')) return 'blue';
  if (t.includes('memory') || t.includes('memories') || t.includes('foto') || t.includes('bild')) return 'blue';
  if (t.includes('crew') || t.includes('bestenliste') || t.includes('wochen')) return 'night';

  let hash = 0;
  for (let i = 0; i < t.length; i += 1) hash = ((hash << 5) - hash + t.charCodeAt(i)) | 0;
  return ['cyan', 'pink', 'blue', 'purple', 'lime', 'night'][Math.abs(hash) % 6];
}

const ACCENT = {
  cyan: COLORS.ice,
  pink: COLORS.pink,
  blue: '#52A9FF',
  purple: COLORS.purple,
  lime: COLORS.volt,
  night: '#80CFFF',
};

export function Card({ children, style, variant, plain = false }) {
  const flat = StyleSheet.flatten(style) || {};
  const noPad = flat.padding === 0;
  const scene = sceneFor(children, variant);
  const accent = ACCENT[scene];

  if (plain) {
    return <View style={[styles.cardPlain, style]}>{children}</View>;
  }

  return (
    <View style={[styles.cardShell, { borderColor: `${accent}48` }, style]}>
      <ImageBackground
        source={SCENES[scene]}
        resizeMode="cover"
        style={styles.cardBackground}
        imageStyle={styles.cardImage}
      >
        <View style={styles.cardShade} />
        <View style={[styles.cardGlow, { backgroundColor: `${accent}24` }]} />
        <View style={[styles.cardRail, { backgroundColor: accent }]} />
        <View style={[styles.cardContent, noPad && styles.cardContentNoPad]}>
          {children}
        </View>
      </ImageBackground>
    </View>
  );
}

export function Title({ children, color = COLORS.text, small = false }) {
  return (
    <View style={styles.titleRow}>
      <View style={[styles.titleMarker, { backgroundColor: color }]} />
      <Text style={[styles.title, small && styles.titleSmall, { color }]}>
        {children}
      </Text>
    </View>
  );
}

export function Muted({ children, style }) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}

export function Button({ title, onPress, tone = 'volt', disabled = false, compact = false }) {
  const bg =
    tone === 'pink'
      ? COLORS.pink
      : tone === 'ice'
        ? COLORS.ice
        : tone === 'dark'
          ? '#0B1725D9'
          : COLORS.volt;

  const border =
    tone === 'dark'
      ? COLORS.line
      : bg;

  const fg = tone === 'dark' ? COLORS.text : COLORS.bg;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        {
          backgroundColor: bg,
          borderColor: border,
          opacity: disabled ? 0.42 : pressed ? 0.84 : 1,
          transform: [{ scale: pressed && !disabled ? 0.982 : 1 }],
        },
      ]}
    >
      <View style={styles.buttonHighlight} />
      <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Field({ value, onChangeText, placeholder, multiline = false, keyboardType, secureTextEntry }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={COLORS.muted}
      multiline={multiline}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      style={[styles.input, multiline && styles.inputMulti]}
    />
  );
}

export function Pill({ label, active, onPress, color = COLORS.volt }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        active && {
          borderColor: color,
          backgroundColor: `${color}16`,
          shadowColor: color,
          shadowOpacity: 0.18,
          shadowRadius: 8,
        },
        pressed && { opacity: 0.82 },
      ]}
    >
      <Text style={[styles.pillText, active && { color }]}>{label}</Text>
    </Pressable>
  );
}

export function Notice({ children, tone = 'ice' }) {
  const color =
    tone === 'pink'
      ? COLORS.pink
      : tone === 'volt'
        ? COLORS.volt
        : COLORS.ice;

  return (
    <View
      style={[
        styles.notice,
        {
          borderColor: `${color}55`,
          backgroundColor: `${color}0E`,
        },
      ]}
    >
      <View style={[styles.noticeBar, { backgroundColor: color }]} />
      <Text style={styles.noticeText}>{children}</Text>
    </View>
  );
}

export function StatBadge({ label, value, color = COLORS.volt }) {
  return (
    <View
      style={[
        styles.statBadge,
        {
          borderColor: `${color}42`,
          backgroundColor: `${color}12`,
          shadowColor: color,
        },
      ]}
    >
      <View style={[styles.statGlow, { backgroundColor: `${color}18` }]} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={[styles.statLabel, { color }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

export function SectionCode({ children }) {
  return <Text style={styles.sectionCode}>{children}</Text>;
}

const styles = StyleSheet.create({
  cardShell: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: COLORS.panel,
    ...shadow,
  },
  cardPlain: {
    backgroundColor: COLORS.panel,
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.lineSoft,
    gap: 10,
    ...shadow,
  },
  cardBackground: {
    minHeight: 1,
  },
  cardImage: {
    borderRadius: 23,
  },
  cardShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#02070DCC',
  },
  cardGlow: {
    position: 'absolute',
    right: -42,
    top: -52,
    width: 170,
    height: 170,
    borderRadius: 999,
  },
  cardRail: {
    position: 'absolute',
    left: 0,
    top: 16,
    bottom: 16,
    width: 3,
    borderRadius: 999,
    opacity: 0.95,
  },
  cardContent: {
    padding: 15,
    gap: 10,
  },
  cardContentNoPad: {
    padding: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  titleMarker: {
    width: 4,
    height: 18,
    borderRadius: 999,
  },
  title: {
    fontSize: 20.5,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.3,
    textShadowColor: '#000A',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  titleSmall: {
    fontSize: 16.7,
  },
  muted: {
    color: '#A2AEC0',
    fontSize: 13.2,
    lineHeight: 19,
  },
  button: {
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 3,
  },
  buttonCompact: {
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  buttonHighlight: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 1,
    height: 1,
    borderRadius: 999,
    backgroundColor: '#FFFFFF55',
  },
  buttonText: {
    fontSize: 14.5,
    fontWeight: '900',
  },
  input: {
    backgroundColor: '#07111DD9',
    color: COLORS.text,
    borderWidth: 1,
    borderColor: '#29465F',
    borderRadius: 17,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 50,
    fontSize: 15,
  },
  inputMulti: {
    minHeight: 105,
    textAlignVertical: 'top',
  },
  pill: {
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: '#07111DD9',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
    minHeight: 40,
    justifyContent: 'center',
  },
  pillText: {
    color: '#A7B2C2',
    fontWeight: '800',
    fontSize: 13.4,
  },
  notice: {
    borderWidth: 1,
    borderRadius: 17,
    padding: 11,
    flexDirection: 'row',
    gap: 9,
    alignItems: 'flex-start',
  },
  noticeBar: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 999,
  },
  noticeText: {
    color: COLORS.text,
    lineHeight: 19,
    flex: 1,
  },
  statBadge: {
    flexGrow: 1,
    minWidth: 72,
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 17,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statGlow: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 99,
    right: -20,
    top: -30,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 18.5,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  sectionCode: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
});

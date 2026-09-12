import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { COLORS, shadow } from '../theme';

function textOf(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(' ');
  if (node?.props?.children != null) return textOf(node.props.children);
  return '';
}

function inferredVariant(children, requested) {
  if (requested) return requested;

  const text = textOf(children).toLowerCase();

  if (text.includes('trick des tages') || text.includes('nächster skill')) return 'cyan';
  if (text.includes('session') || text.includes('training') || text.includes('ziel')) return 'lime';
  if (text.includes('ki-') || text.includes('chat') || text.includes('nachricht')) return 'pink';
  if (text.includes('battle') || text.includes('bingo') || text.includes('münz')) return 'purple';
  if (text.includes('park') || text.includes('maps') || text.includes('wetter')) return 'blue';
  if (text.includes('memory') || text.includes('memories') || text.includes('foto') || text.includes('bild')) return 'blue';
  if (text.includes('crew') || text.includes('bestenliste') || text.includes('wochen')) return 'cyan';

  return 'neutral';
}

const CARD = {
  neutral: {
    backgroundColor: COLORS.panel,
    borderColor: COLORS.lineSoft,
    accent: '#38536D',
  },
  cyan: {
    backgroundColor: '#081821',
    borderColor: '#1F5262',
    accent: COLORS.ice,
  },
  pink: {
    backgroundColor: '#160B16',
    borderColor: '#57304B',
    accent: COLORS.pink,
  },
  blue: {
    backgroundColor: '#081522',
    borderColor: '#264B69',
    accent: COLORS.blue,
  },
  purple: {
    backgroundColor: '#100D1A',
    borderColor: '#42365F',
    accent: COLORS.purple,
  },
  lime: {
    backgroundColor: '#101608',
    borderColor: '#445222',
    accent: COLORS.volt,
  },
  night: {
    backgroundColor: '#09131E',
    borderColor: '#233A4E',
    accent: '#84CFFF',
  },
};

export function Card({ children, style, variant = null, plain = false }) {
  const key = inferredVariant(children, variant);
  const look = CARD[key] || CARD.neutral;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: plain ? COLORS.panel : look.backgroundColor,
          borderColor: plain ? COLORS.lineSoft : look.borderColor,
        },
        style,
      ]}
    >
      {!plain ? (
        <>
          <View
            pointerEvents="none"
            style={[
              styles.cardGlow,
              { backgroundColor: `${look.accent}0E` },
            ]}
          />
          <View
            pointerEvents="none"
            style={[
              styles.cardTopLine,
              { backgroundColor: `${look.accent}55` },
            ]}
          />
        </>
      ) : null}

      {children}
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

export function Button({
  title,
  onPress,
  tone = 'volt',
  disabled = false,
  compact = false,
}) {
  const bg =
    tone === 'pink'
      ? COLORS.pink
      : tone === 'ice'
        ? COLORS.ice
        : tone === 'dark'
          ? '#0A1420'
          : COLORS.volt;

  const border =
    tone === 'dark'
      ? COLORS.line
      : bg;

  const fg =
    tone === 'dark'
      ? COLORS.text
      : COLORS.bg;

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
          transform: [{ scale: pressed && !disabled ? 0.985 : 1 }],
        },
      ]}
    >
      <Text style={[styles.buttonText, { color: fg }]}>
        {title}
      </Text>
    </Pressable>
  );
}

export function Field({
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType,
  secureTextEntry,
}) {
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
          backgroundColor: `${color}13`,
        },
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text style={[styles.pillText, active && { color }]}>
        {label}
      </Text>
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
          borderColor: `${color}44`,
          backgroundColor: `${color}0B`,
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
          borderColor: `${color}35`,
          backgroundColor: `${color}0D`,
        },
      ]}
    >
      <Text style={styles.statValue}>{value}</Text>
      <Text style={[styles.statLabel, { color }]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

export function SectionCode({ children }) {
  return <Text style={styles.sectionCode}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 15,
    borderWidth: 1,
    gap: 10,
    overflow: 'hidden',
    position: 'relative',
    ...shadow,
  },
  cardGlow: {
    position: 'absolute',
    right: -42,
    top: -58,
    width: 140,
    height: 140,
    borderRadius: 999,
  },
  cardTopLine: {
    position: 'absolute',
    left: 17,
    top: 0,
    width: 44,
    height: 2,
    borderRadius: 999,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  titleMarker: {
    width: 3,
    height: 17,
    borderRadius: 999,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.25,
  },
  titleSmall: {
    fontSize: 16.5,
  },
  muted: {
    color: COLORS.muted,
    fontSize: 13.2,
    lineHeight: 19,
  },
  button: {
    minHeight: 49,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCompact: {
    minHeight: 39,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 13,
  },
  buttonText: {
    fontSize: 14.2,
    fontWeight: '900',
  },
  input: {
    backgroundColor: '#09131E',
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 50,
    fontSize: 15,
  },
  inputMulti: {
    minHeight: 104,
    textAlignVertical: 'top',
  },
  pill: {
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: '#09131E',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
    minHeight: 39,
    justifyContent: 'center',
  },
  pillText: {
    color: COLORS.muted,
    fontWeight: '800',
    fontSize: 13.2,
  },
  notice: {
    borderWidth: 1,
    borderRadius: 16,
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
    borderRadius: 16,
    borderWidth: 1,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 10.2,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  sectionCode: {
    color: COLORS.muted,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
});

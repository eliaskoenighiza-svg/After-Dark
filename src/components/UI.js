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
  neutral: { background: '#09131D', border: '#172738', accent: '#4A647C' },
  cyan: { background: '#09151C', border: '#1D3C48', accent: COLORS.ice },
  pink: { background: '#110C14', border: '#3B2635', accent: COLORS.pink },
  blue: { background: '#09131E', border: '#23384F', accent: COLORS.blue },
  purple: { background: '#0E0C15', border: '#332B48', accent: COLORS.purple },
  lime: { background: '#0D120B', border: '#314022', accent: COLORS.volt },
  night: { background: '#09131D', border: '#203548', accent: '#79CFFF' },
};

export function Card({ children, style, variant = null, plain = false }) {
  const key = inferredVariant(children, variant);
  const look = CARD[key] || CARD.neutral;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: plain ? COLORS.panel : look.background,
          borderColor: plain ? COLORS.lineSoft : look.border,
        },
        style,
      ]}
    >
      {!plain ? (
        <View
          pointerEvents="none"
          style={[styles.cardAccent, { backgroundColor: look.accent }]}
        />
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
          ? COLORS.panel2
          : COLORS.volt;

  const border = tone === 'dark' ? COLORS.line : bg;
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
          transform: [{ scale: pressed && !disabled ? 0.985 : 1 }],
        },
      ]}
    >
      <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
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
          borderColor: color + '88',
          backgroundColor: color + '10',
        },
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text style={[styles.pillText, active && { color }]}>{label}</Text>
    </Pressable>
  );
}

export function Notice({ children, tone = 'ice' }) {
  const color = tone === 'pink' ? COLORS.pink : tone === 'volt' ? COLORS.volt : COLORS.ice;

  return (
    <View
      style={[
        styles.notice,
        {
          borderColor: color + '32',
          backgroundColor: color + '08',
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
    <View style={[styles.statBadge, { borderColor: color + '28' }]}> 
      <Text style={styles.statValue}>{value}</Text>
      <Text style={[styles.statLabel, { color }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

export function SectionCode({ children }) {
  return <Text style={styles.sectionCode}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    gap: 9,
    overflow: 'hidden',
    position: 'relative',
    ...shadow,
  },
  cardAccent: {
    position: 'absolute',
    left: 14,
    top: 0,
    width: 34,
    height: 2,
    borderRadius: 999,
    opacity: 0.78,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleMarker: {
    width: 3,
    height: 15,
    borderRadius: 999,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  titleSmall: {
    fontSize: 15.5,
  },
  muted: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18.5,
  },
  button: {
    minHeight: 46,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCompact: {
    minHeight: 37,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  input: {
    backgroundColor: '#08121C',
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.lineSoft,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 11,
    minHeight: 47,
    fontSize: 14.5,
  },
  inputMulti: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pill: {
    borderWidth: 1,
    borderColor: COLORS.lineSoft,
    backgroundColor: '#08121C',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: 35,
    justifyContent: 'center',
  },
  pillText: {
    color: COLORS.muted,
    fontWeight: '700',
    fontSize: 12.5,
  },
  notice: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  noticeBar: {
    width: 2,
    alignSelf: 'stretch',
    borderRadius: 999,
  },
  noticeText: {
    color: COLORS.text,
    lineHeight: 18.5,
    flex: 1,
  },
  statBadge: {
    flexGrow: 1,
    minWidth: 72,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: '#08121C',
  },
  statValue: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 9.8,
    fontWeight: '800',
    letterSpacing: 0.45,
    marginTop: 2,
  },
  sectionCode: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
});

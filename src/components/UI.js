import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS, shadow } from '../theme';

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
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
          opacity: disabled ? 0.42 : pressed ? 0.82 : 1,
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
          borderColor: color,
          backgroundColor: `${color}14`,
        },
        pressed && { opacity: 0.8 },
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
          backgroundColor: `${color}0C`,
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
          borderColor: `${color}3A`,
          backgroundColor: `${color}10`,
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
    backgroundColor: COLORS.panel,
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.lineSoft,
    gap: 10,
    ...shadow,
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
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.2,
  },
  titleSmall: {
    fontSize: 16.5,
  },
  muted: {
    color: COLORS.muted,
    fontSize: 13.3,
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
  },
  buttonCompact: {
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  buttonText: {
    fontSize: 14.5,
    fontWeight: '900',
  },
  input: {
    backgroundColor: COLORS.panel2,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.line,
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
    backgroundColor: COLORS.bgSoft,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
    minHeight: 40,
    justifyContent: 'center',
  },
  pillText: {
    color: COLORS.muted,
    fontWeight: '800',
    fontSize: 13.5,
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

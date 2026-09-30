import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS, FONTS, GRADIENTS, RADII, SHADOWS, TYPE } from '../theme';
import { Grad } from '../design/Grad';
import { PrimaryButton, SecondaryButton } from '../design/kit';
import AppIcon from './AppIcon';

// Night Ride v2 – gleiche Exporte und Props wie bisher, nur neues Aussehen.
// `variant`, `plain` und `color` werden aus Kompatibilität angenommen, ändern aber nichts mehr.

export function Card({ children, style, gradient = GRADIENTS.card }) {
  return (
    <View style={[styles.card, SHADOWS.card, style]}>
      <Grad {...gradient} radius={RADII.card} />
      {children}
    </View>
  );
}

export function Title({ children, small = false }) {
  return (
    <Text style={[styles.title, small && styles.titleSmall]}>
      {children}
    </Text>
  );
}

export function Muted({ children, style }) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}

const TONE_MAP = {
  dark: 'default',
  ice: 'cyan',
  pink: 'pink',
};

export function Button({
  title,
  onPress,
  tone = 'volt',
  disabled = false,
  compact = false,
  icon,
  style,
}) {
  if (tone === 'volt') {
    return (
      <PrimaryButton
        title={title}
        onPress={onPress}
        disabled={disabled}
        compact={compact}
        icon={icon || 'arrow'}
        style={style}
      />
    );
  }

  return (
    <SecondaryButton
      title={title}
      onPress={onPress}
      disabled={disabled}
      tone={TONE_MAP[tone] || 'default'}
      size={compact ? 'sm' : 'md'}
      icon={icon}
      style={style}
    />
  );
}

export function Field({
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType,
  secureTextEntry,
  autoCapitalize,
  style,
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={COLORS.placeholder}
      selectionColor={COLORS.lime}
      cursorColor={COLORS.lime}
      multiline={multiline}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      autoCapitalize={autoCapitalize}
      style={[styles.input, multiline && styles.inputMulti, style]}
    />
  );
}

export function Pill({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [
        styles.pill,
        active && styles.pillActive,
        pressed && { opacity: 0.82 },
      ]}
    >
      <Text numberOfLines={1} style={[styles.pillText, active && styles.pillTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const NOTICE = {
  ice: { bg: COLORS.cyanSoft, fg: COLORS.cyanText },
  pink: { bg: COLORS.pinkSoft, fg: COLORS.pinkText },
  volt: { bg: COLORS.limeSoft, fg: COLORS.limeText },
};

export function Notice({ children, tone = 'ice' }) {
  const t = NOTICE[tone] || NOTICE.ice;
  return (
    <View style={[styles.notice, { backgroundColor: t.bg }]}>
      <View style={{ paddingTop: 1 }}>
        <AppIcon name="info" size={16} color={t.fg} />
      </View>
      <Text style={[styles.noticeText, { color: t.fg }]}>{children}</Text>
    </View>
  );
}

export function StatBadge({ label, value }) {
  return (
    <View style={styles.statBadge}>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function SectionCode({ children }) {
  return <Text style={styles.sectionCode}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADII.card,
    padding: 20,
    gap: 14,
    backgroundColor: COLORS.midnight,
  },
  title: {
    ...TYPE.head,
    fontSize: 19,
    lineHeight: 23,
  },
  titleSmall: {
    fontSize: 17,
    lineHeight: 21,
  },
  muted: {
    ...TYPE.caption,
    fontSize: 13,
    lineHeight: 19,
  },
  input: {
    backgroundColor: COLORS.well,
    color: COLORS.text,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 54,
    fontFamily: FONTS.body,
    fontSize: 14.5,
  },
  inputMulti: {
    borderRadius: RADII.tile,
    minHeight: 100,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  pill: {
    backgroundColor: COLORS.raised,
    borderRadius: 999,
    paddingHorizontal: 15,
    height: 38,
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: COLORS.text,
  },
  pillText: {
    fontFamily: FONTS.semibold,
    color: COLORS.text2,
    fontSize: 13,
  },
  pillTextActive: {
    color: COLORS.onLime,
  },
  notice: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  noticeText: {
    fontFamily: FONTS.medium,
    fontSize: 13.5,
    lineHeight: 19,
    flex: 1,
  },
  statBadge: {
    flexGrow: 1,
    flexBasis: 90,
    borderRadius: RADII.stat,
    backgroundColor: COLORS.stat,
    paddingTop: 13,
    paddingHorizontal: 12,
    paddingBottom: 11,
    gap: 7,
  },
  statValue: {
    ...TYPE.number,
    fontSize: 28,
    lineHeight: 30,
  },
  statLabel: {
    ...TYPE.label,
    fontSize: 11,
  },
  sectionCode: {
    ...TYPE.label,
  },
});

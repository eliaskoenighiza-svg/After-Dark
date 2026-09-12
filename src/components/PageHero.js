import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme';

export default function PageHero({
  title,
  subtitle,
  accent = COLORS.ice,
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>

      {subtitle ? (
        <Text style={styles.subtitle}>{subtitle}</Text>
      ) : null}

      <View style={styles.lineWrap}>
        <View style={[styles.line, { backgroundColor: accent }]} />
        <View style={[styles.lineShort, { backgroundColor: `${accent}99` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 3,
    paddingTop: 7,
    paddingBottom: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 42,
    lineHeight: 45,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -1.7,
  },
  subtitle: {
    color: '#B8C2D0',
    fontSize: 9.6,
    fontWeight: '900',
    letterSpacing: 2.25,
    marginTop: 2,
  },
  lineWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  line: {
    width: 58,
    height: 3,
    borderRadius: 999,
    transform: [{ rotate: '-3deg' }],
  },
  lineShort: {
    width: 22,
    height: 2,
    borderRadius: 999,
    transform: [{ rotate: '3deg' }],
  },
});

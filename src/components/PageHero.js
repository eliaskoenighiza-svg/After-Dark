import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../theme';

export default function PageHero({
  title,
  subtitle,
  accent = COLORS.ice,
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>

      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.wave}>
        <Svg width="96" height="17" viewBox="0 0 96 17">
          <Path
            d="M2 10 C17 3 30 4 43 9 C57 14 71 13 94 5"
            fill="none"
            stroke={accent}
            strokeWidth={3.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 2,
    paddingTop: 5,
    paddingBottom: 1,
  },
  title: {
    color: COLORS.text,
    fontSize: 39,
    lineHeight: 42,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -1.45,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 9.4,
    fontWeight: '800',
    letterSpacing: 2.15,
    marginTop: 1,
  },
  wave: {
    width: 96,
    height: 17,
    marginTop: 5,
    marginLeft: -1,
    opacity: 0.92,
  },
});

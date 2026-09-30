import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS } from '../theme';

// After[Dark – Schreibweise ohne schließende Klammer. Klammer in Cyan (Night Ride v2).
export default function Logo({ compact = false, centered = false }) {
  return (
    <View style={[styles.wrap, centered && styles.centered]}>
      <Text style={[styles.logo, compact && styles.logoCompact]}>
        <Text style={styles.white}>After</Text>
        <Text style={styles.bracket}>[</Text>
        <Text style={styles.white}>Dark</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
  },
  centered: {
    alignSelf: 'center',
  },
  logo: {
    fontFamily: FONTS.logo,
    color: COLORS.text,
    fontSize: 40,
    letterSpacing: -0.8,
    paddingRight: 6,
  },
  logoCompact: {
    fontSize: 28,
    letterSpacing: -0.5,
  },
  white: {
    color: COLORS.text,
  },
  bracket: {
    color: COLORS.cyan,
  },
});

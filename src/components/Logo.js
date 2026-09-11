import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme';

export default function Logo({ compact = false }) {
  return (
    <View style={styles.wrap}>
      <Text style={[styles.shadowA, compact && styles.compactShadow]}>After[Dark</Text>
      <Text style={[styles.shadowB, compact && styles.compactShadow]}>After[Dark</Text>
      <Text style={[styles.logo, compact && styles.compact]}>
        <Text style={styles.white}>After</Text>
        <Text style={styles.pink}>[</Text>
        <Text style={styles.white}>Dark</Text>
      </Text>
      {!compact ? <Text style={styles.sub}>RIDE · TRICK · REPEAT</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'flex-start', position: 'relative' },
  logo: { fontSize: 34, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1.1 },
  compact: { fontSize: 26 },
  shadowA: { position: 'absolute', left: -1, top: 2, color: COLORS.ice, opacity: 0.5, fontSize: 34, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1.1 },
  shadowB: { position: 'absolute', left: 2, top: -1, color: COLORS.pink, opacity: 0.36, fontSize: 34, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1.1 },
  compactShadow: { fontSize: 26 },
  white: { color: COLORS.text },
  pink: { color: COLORS.pink },
  sub: { color: COLORS.muted, fontSize: 11, fontWeight: '800', letterSpacing: 2.5, marginTop: 4 },
});

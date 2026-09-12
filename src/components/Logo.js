import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme';

export default function Logo({ compact = false, centered = false }) {
  return (
    <View style={[
      styles.wrap,
      compact && styles.wrapCompact,
      centered && styles.centered,
    ]}>
      <Text style={[
        styles.logo,
        compact && styles.logoCompact,
      ]}>
        <Text style={styles.white}>After</Text>
        <Text style={styles.pink}>[</Text>
        <Text style={styles.white}>Dark</Text>
      </Text>
      <View style={[
        styles.slash,
        compact && styles.slashCompact,
      ]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    alignSelf: 'flex-start',
    paddingBottom: 4,
  },
  wrapCompact: {
    paddingBottom: 2,
  },
  centered: {
    alignSelf: 'center',
  },
  logo: {
    color: COLORS.text,
    fontSize: 35,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -1.5,
    textShadowColor: '#00000099',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  logoCompact: {
    fontSize: 27,
    letterSpacing: -1.1,
  },
  white: {
    color: '#FFFFFF',
  },
  pink: {
    color: COLORS.pink,
  },
  slash: {
    position: 'absolute',
    left: 7,
    bottom: 0,
    width: 62,
    height: 3,
    borderRadius: 99,
    backgroundColor: COLORS.ice,
    transform: [{ rotate: '-3deg' }],
  },
  slashCompact: {
    width: 42,
    height: 2,
    left: 5,
  },
});

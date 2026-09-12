import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

export default function Logo({ compact = false, centered = false }) {
  return (
    <View style={[
      styles.wrap,
      compact && styles.wrapCompact,
      centered && styles.centered,
    ]}>
      <Image
        source={require('../../assets/afterdark-logo.png')}
        style={[styles.logo, compact && styles.logoCompact]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 242,
    height: 82,
    justifyContent: 'center',
  },
  wrapCompact: {
    width: 148,
    height: 48,
  },
  centered: {
    alignSelf: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  logoCompact: {
    width: '100%',
    height: '100%',
  },
});

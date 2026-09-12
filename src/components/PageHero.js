import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import AppIcon from './AppIcon';
import { COLORS } from '../theme';

const BG = {
  coach: require('../../assets/card-cyan.jpg'),
  skills: require('../../assets/card-lime.jpg'),
  battle: require('../../assets/card-purple.jpg'),
  parks: require('../../assets/card-blue.jpg'),
};

const ICON = {
  coach: 'coach',
  skills: 'skills',
  battle: 'battle',
  parks: 'parks',
};

export default function PageHero({
  type = 'coach',
  title,
  subtitle,
  accent = COLORS.ice,
}) {
  return (
    <View style={[styles.shell, { borderColor: `${accent}55` }]}>
      <ImageBackground
        source={BG[type] || BG.coach}
        resizeMode="cover"
        style={styles.bg}
        imageStyle={styles.image}
      >
        <View style={styles.shade} />
        <View style={[styles.glow, { backgroundColor: `${accent}28` }]} />
        <View style={styles.row}>
          <View style={[styles.icon, { borderColor: `${accent}66` }]}>
            <AppIcon
              name={ICON[type] || 'coach'}
              size={29}
              color={accent}
              strokeWidth={2.2}
            />
          </View>
          <View style={styles.texts}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            <View style={[styles.slash, { backgroundColor: accent }]} />
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderWidth: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: COLORS.panel,
    shadowColor: '#000',
    shadowOpacity: 0.38,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  bg: {
    minHeight: 116,
    justifyContent: 'center',
    padding: 15,
  },
  image: {
    borderRadius: 23,
  },
  shade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#02070DB8',
  },
  glow: {
    position: 'absolute',
    right: -30,
    top: -40,
    width: 150,
    height: 150,
    borderRadius: 999,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  icon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    borderWidth: 1,
    backgroundColor: '#06101CD9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 31,
    lineHeight: 34,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -1.1,
  },
  subtitle: {
    color: '#C2CDDA',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.35,
    marginTop: 4,
  },
  slash: {
    width: 62,
    height: 3,
    borderRadius: 99,
    marginTop: 8,
    transform: [{ rotate: '-3deg' }],
  },
});

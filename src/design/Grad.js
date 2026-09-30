import React, { useId, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

// Reine Darstellung: Verlaufsfläche hinter dem Inhalt eines Containers.
// Zeichnet ihre Rundung selbst, damit Schatten des Containers nicht abgeschnitten werden.

function vector(angle) {
  const rad = (angle * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  return {
    x1: 0.5 - dx / 2,
    y1: 0.5 - dy / 2,
    x2: 0.5 + dx / 2,
    y2: 0.5 + dy / 2,
  };
}

function safeId(raw) {
  return `g${String(raw).replace(/[^a-zA-Z0-9]/g, '')}`;
}

export function Grad({ colors, locations, angle = 180, radius = 0, opacity = 1 }) {
  const id = safeId(useId());
  const [size, setSize] = useState(null);
  const v = vector(angle);
  const stops = colors.map((c, i) => ({
    c,
    o: locations ? locations[i] : colors.length === 1 ? 0 : i / (colors.length - 1),
  }));

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (!size || size.width !== width || size.height !== height) setSize({ width, height });
      }}
    >
      {size ? (
        <Svg width={size.width} height={size.height}>
          <Defs>
            <LinearGradient id={id} x1={v.x1} y1={v.y1} x2={v.x2} y2={v.y2}>
              {stops.map((s, i) => (
                <Stop key={i} offset={s.o} stopColor={s.c} stopOpacity={opacity} />
              ))}
            </LinearGradient>
          </Defs>
          <Rect
            x={0}
            y={0}
            width={size.width}
            height={size.height}
            rx={Math.min(radius, size.height / 2, size.width / 2)}
            fill={`url(#${id})`}
          />
        </Svg>
      ) : null}
    </View>
  );
}

// Weiches Licht (z. B. oben rechts im Screen oder in Poster-Karten)
export function Glow({ color, opacity = 0.16, size = 420, style }) {
  const id = safeId(useId());
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={opacity} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={size} height={size} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

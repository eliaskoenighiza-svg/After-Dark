// Sport-Farbwelt: jede Sportart färbt Kopfbereich, Navigation, Fortschritt & Co.
// Reine Darstellung – die Farbe kommt aus src/data/sports.js (sport.color).
import { createContext, useContext } from 'react';
import { COLORS } from '../theme';

function rgb(hex) {
  const h = String(hex || '#CFFF3A').replace('#', '');
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(f, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const lum = ([r, g, b]) => {
  const c = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};

const rgba = (hex, a) => {
  const [r, g, b] = rgb(hex);
  return `rgba(${r},${g},${b},${a})`;
};

const mix = (hex, target, t) => {
  const a = rgb(hex);
  const b = rgb(target);
  const m = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `#${m.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};

export function accentFor(hex) {
  const color = hex || COLORS.lime;
  const light = lum(rgb(color)) > 0.32;
  return {
    color,
    ink: light ? '#060A10' : '#FFFFFF', // Text/Icon auf der Farbe
    soft: rgba(color, 0.14), // Chip-Hintergrund
    glow: rgba(color, 0.45), // Schatten / Leuchten
    faint: rgba(color, 0.22),
    deep: mix(color, '#03050A', 0.55), // dunkle Variante für Verläufe
    text: mix(color, '#FFFFFF', 0.25), // gut lesbar auf Dunkel
    tile: { colors: [mix(color, '#0F182C', 0.8), '#0F182C'], locations: [0, 0.7], angle: 165 },
  };
}

export const AccentContext = createContext(accentFor(COLORS.lime));
export const useAccent = () => useContext(AccentContext);

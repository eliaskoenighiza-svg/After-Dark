import React from 'react';
import Svg, { Path } from 'react-native-svg';

// Night Ride v2 Duotone-Icons: runde Striche + gefüllte Fläche mit geringer Deckkraft.
// API wie bisher: name, size, color, strokeWidth (+ optional fillOpacity).

const ICONS = {
  coach: { d: 'M9 2h6M12 2v3M12 22a8.5 8.5 0 1 1 0-17 8.5 8.5 0 0 1 0 17zM12 13.5l3.5-3.5' },
  skills: { d: 'M9.5 2h5v5h-5zM2.5 17h5v5h-5zM16.5 17h5v5h-5zM12 7v5M5 17v-5h14v5' },
  battle: { d: 'M3 5l7 7-7 7M21 5l-7 7 7 7', open: true },
  parks: { d: 'M2 20h20M3 20V7c7 0 11 5 11 13zM16 20v-6h5v6' },
  more: { d: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z' },
  crew: { d: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c0-3.3 2.7-6 6-6s6 2.7 6 6zM15 14.1c.3 0 .7-.1 1-.1 3.3 0 6 2.7 6 6h-7' },
  chat: { d: 'M3 4h18v12H10l-5 4v-4H3z' },
  memories: { d: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6' },
  camera: { d: 'M3 7h4l2-3h6l2 3h4v13H3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  cloud: { d: 'M7 18h10a4 4 0 0 0 .6-8A6 6 0 0 0 6.2 9.6 4.2 4.2 0 0 0 7 18z' },
  user: { d: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4.4 3.6-8 8-8s8 3.6 8 8z' },
  bell: { d: 'M6 16v-5a6 6 0 1 1 12 0v5l2 2H4zM10 21h4' },
  plus: { d: 'M12 5v14M5 12h14', open: true },
  chevron: { d: 'M9 5l7 7-7 7', open: true },
  back: { d: 'M15 5l-7 7 7 7', open: true },
  down: { d: 'M5 9l7 7 7-7', open: true },
  sun: { d: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M1 12h2M21 12h2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4' },
  snow: { d: 'M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9 3.5l3 2 3-2M9 20.5l3-2 3 2', open: true },
  edit: { d: 'M4 20h4L20 8l-4-4L4 16zM14 6l4 4' },
  chip: { d: 'M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4' },
  play: { d: 'M7 4l13 8-13 8z' },
  dice: { d: 'M4 4h16v16H4zM8.5 8.5h.01M15.5 15.5h.01M12 12h.01M15.5 8.5h.01M8.5 15.5h.01' },
  timer: { d: 'M12 22a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM12 8v5h4M10 1h4' },
  flame: { d: 'M12 22c3.9 0 7-3 7-7 0-5-5-7-5-12-3 2-5 5-5 8-1-.7-2-2-2-4-2 2-2 5-2 8 0 4 3.1 7 7 7z' },
  target: { d: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  shield: { d: 'M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5z' },
  swap: { d: 'M4 8h14l-4-4M20 16H6l4 4', open: true },
  send: { d: 'M3 11l18-8-8 18-2-8z' },
  trophy: { d: 'M7 3h10v6a5 5 0 0 1-10 0zM7 5H3v2a4 4 0 0 0 4 4M17 5h4v2a4 4 0 0 1-4 4M12 14v4M8 21h8' },
  grid: { d: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' },
  coin: { d: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z' },
  shuffle: { d: 'M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4M18 4l3 3-3 3M18 14l3 3-3 3', open: true },
  reset: { d: 'M4 4v6h6M4.6 10A8 8 0 1 1 6 17.5', open: true },
  calendar: { d: 'M3 5h18v16H3zM3 10h18M8 2v5M16 2v5' },
  map: { d: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14' },
  list: { d: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01', open: true },
  roof: { d: 'M2 11l10-7 10 7M5 9v11h14V9' },
  flood: { d: 'M8 3h8l-1.5 6h-5zM12 9v12M8 21h8M4 4l2 1.5M20 4l-2 1.5' },
  pin: { d: 'M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z' },
  train: { d: 'M6 3h12v13H6zM6 10h12M8 19l-2 3M16 19l2 3' },
  bookmark: { d: 'M6 3h12v18l-6-5-6 5z' },
  key: { d: 'M8 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM11 11h10M17 11v4M20 11v3' },
  arrow: { d: 'M7 17L17 7M8 7h9v9', open: true },
  check: { d: 'M4 12l5 5L20 6', open: true },
  info: { d: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 11v6M12 7v.01' },
  crown: { d: 'M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z' },
  heart: { d: 'M12 20s-8-4.6-8-10.3A4.7 4.7 0 0 1 12 7a4.7 4.7 0 0 1 8 2.7C20 15.4 12 20 12 20z' },
  trash: { d: 'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14' },
  weather: { d: 'M8 2v2M2.5 6.5L4 8M2 12h2M8.4 14a4 4 0 1 1 4.3-6.2M10 21h9a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.6 1.4A2.8 2.8 0 0 0 10 21z' },
  phone: { d: 'M5 3h4l2 5-3 2a11 11 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z' },
  star: { d: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z' },
  save: { d: 'M5 3h11l3 3v15H5zM8 3v6h7V3M8 21v-7h8v7' },
};

export default function AppIcon({
  name,
  size = 24,
  color = '#F4F6FB',
  strokeWidth = 2,
  fillOpacity,
}) {
  const icon = ICONS[name] || ICONS.info;
  const fo = icon.open ? 0 : fillOpacity ?? 0.22;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={icon.d}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fo > 0 ? color : 'none'}
        fillOpacity={fo}
      />
    </Svg>
  );
}

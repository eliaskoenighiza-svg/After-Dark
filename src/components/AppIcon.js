import React from 'react';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

export default function AppIcon({
  name,
  size = 24,
  color = '#F7FAFF',
  strokeWidth = 1.9,
}) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
  };

  const stroke = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  if (name === 'coach') {
    return (
      <Svg {...common}>
        <Circle cx="12" cy="12" r="8.2" {...stroke} />
        <Circle cx="12" cy="12" r="3.1" {...stroke} />
        <Line x1="12" y1="2.2" x2="12" y2="6" {...stroke} />
        <Line x1="12" y1="18" x2="12" y2="21.8" {...stroke} />
        <Line x1="2.2" y1="12" x2="6" y2="12" {...stroke} />
        <Line x1="18" y1="12" x2="21.8" y2="12" {...stroke} />
      </Svg>
    );
  }

  if (name === 'skills') {
    return (
      <Svg {...common}>
        <Path d="M5 19V13" {...stroke} />
        <Path d="M12 19V8" {...stroke} />
        <Path d="M19 19V4" {...stroke} />
        <Path d="M4 20H20" {...stroke} />
        <Path d="M5 10L10 6L14 9L20 3" {...stroke} />
      </Svg>
    );
  }

  if (name === 'battle') {
    return (
      <Svg {...common}>
        <Path d="M5 4L19 18" {...stroke} />
        <Path d="M19 4L5 18" {...stroke} />
        <Path d="M4 3L8 4L5 7Z" {...stroke} />
        <Path d="M20 3L16 4L19 7Z" {...stroke} />
        <Path d="M4 21L7 18" {...stroke} />
        <Path d="M20 21L17 18" {...stroke} />
      </Svg>
    );
  }

  if (name === 'parks') {
    return (
      <Svg {...common}>
        <Path d="M12 21S18.5 14.8 18.5 9.6A6.5 6.5 0 1 0 5.5 9.6C5.5 14.8 12 21 12 21Z" {...stroke} />
        <Circle cx="12" cy="9.5" r="2.2" {...stroke} />
      </Svg>
    );
  }

  if (name === 'more') {
    return (
      <Svg {...common}>
        <Circle cx="5" cy="12" r="1.5" fill={color} />
        <Circle cx="12" cy="12" r="1.5" fill={color} />
        <Circle cx="19" cy="12" r="1.5" fill={color} />
      </Svg>
    );
  }

  if (name === 'crew') {
    return (
      <Svg {...common}>
        <Circle cx="9" cy="8" r="3" {...stroke} />
        <Circle cx="16.8" cy="9" r="2.4" {...stroke} />
        <Path d="M3.8 19C4.2 15.6 6 13.6 9 13.6C12 13.6 13.8 15.6 14.2 19" {...stroke} />
        <Path d="M14 14.5C17.2 13.8 19.6 15.4 20.2 18.3" {...stroke} />
      </Svg>
    );
  }

  if (name === 'chat') {
    return (
      <Svg {...common}>
        <Path d="M4 5.5H20V16H10L6 19.5V16H4Z" {...stroke} />
        <Circle cx="8.5" cy="10.8" r="1" fill={color} />
        <Circle cx="12" cy="10.8" r="1" fill={color} />
        <Circle cx="15.5" cy="10.8" r="1" fill={color} />
      </Svg>
    );
  }

  if (name === 'memories' || name === 'camera') {
    return (
      <Svg {...common}>
        <Rect x="3" y="6.5" width="18" height="13" rx="3" {...stroke} />
        <Path d="M8 6.5L9.3 4.5H14.7L16 6.5" {...stroke} />
        <Circle cx="12" cy="13" r="3.3" {...stroke} />
      </Svg>
    );
  }

  if (name === 'cloud') {
    return (
      <Svg {...common}>
        <Path d="M6.8 18H18A4 4 0 0 0 18.2 10A6.2 6.2 0 0 0 6.4 8.4A4.8 4.8 0 0 0 6.8 18Z" {...stroke} />
      </Svg>
    );
  }

  if (name === 'user') {
    return (
      <Svg {...common}>
        <Circle cx="12" cy="8" r="3.4" {...stroke} />
        <Path d="M5.5 20C6.1 15.9 8.3 13.6 12 13.6C15.7 13.6 17.9 15.9 18.5 20" {...stroke} />
      </Svg>
    );
  }

  if (name === 'chevron') {
    return (
      <Svg {...common}>
        <Polyline points="9,5 16,12 9,19" {...stroke} />
      </Svg>
    );
  }

  if (name === 'sun') {
    return (
      <Svg {...common}>
        <Circle cx="12" cy="12" r="3.7" {...stroke} />
        <Line x1="12" y1="2" x2="12" y2="5" {...stroke} />
        <Line x1="12" y1="19" x2="12" y2="22" {...stroke} />
        <Line x1="2" y1="12" x2="5" y2="12" {...stroke} />
        <Line x1="19" y1="12" x2="22" y2="12" {...stroke} />
        <Line x1="4.9" y1="4.9" x2="7" y2="7" {...stroke} />
        <Line x1="17" y1="17" x2="19.1" y2="19.1" {...stroke} />
        <Line x1="17" y1="7" x2="19.1" y2="4.9" {...stroke} />
        <Line x1="4.9" y1="19.1" x2="7" y2="17" {...stroke} />
      </Svg>
    );
  }

  if (name === 'snow') {
    return (
      <Svg {...common}>
        <Line x1="12" y1="2" x2="12" y2="22" {...stroke} />
        <Line x1="3.4" y1="7" x2="20.6" y2="17" {...stroke} />
        <Line x1="3.4" y1="17" x2="20.6" y2="7" {...stroke} />
        <Path d="M9 4.2L12 6L15 4.2" {...stroke} />
        <Path d="M9 19.8L12 18L15 19.8" {...stroke} />
      </Svg>
    );
  }

  if (name === 'edit') {
    return (
      <Svg {...common}>
        <Path d="M5 19L8.2 18.4L18.5 8.1L15.9 5.5L5.6 15.8Z" {...stroke} />
        <Path d="M14.8 6.6L17.4 9.2" {...stroke} />
      </Svg>
    );
  }

  return (
    <Svg {...common}>
      <Circle cx="12" cy="12" r="8" {...stroke} />
    </Svg>
  );
}

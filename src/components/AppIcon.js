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
        <Path d="M8.2 12.3C8.8 9.5 10.1 8 12 8C14.2 8 15.5 9.6 15.8 12.3" {...stroke} />
        <Path d="M8.2 15.3C9.3 13.9 10.6 13.2 12 13.2C13.4 13.2 14.8 13.9 15.8 15.3" {...stroke} />
        <Line x1="12" y1="3.8" x2="12" y2="6" {...stroke} />
        <Line x1="4.4" y1="8.3" x2="6.3" y2="9.4" {...stroke} />
        <Line x1="17.7" y1="9.4" x2="19.6" y2="8.3" {...stroke} />
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
        <Circle cx="5" cy="12" r="1.6" fill={color} />
        <Circle cx="12" cy="12" r="1.6" fill={color} />
        <Circle cx="19" cy="12" r="1.6" fill={color} />
      </Svg>
    );
  }

  if (name === 'crew') {
    return (
      <Svg {...common}>
        <Circle cx="8.5" cy="8" r="3" {...stroke} />
        <Circle cx="16.4" cy="9.1" r="2.4" {...stroke} />
        <Path d="M3.4 19C3.9 15.5 5.8 13.4 8.6 13.4C11.5 13.4 13.3 15.5 13.8 19" {...stroke} />
        <Path d="M13.8 14.5C16.7 13.8 19.2 15.3 20.1 18.4" {...stroke} />
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

  if (name === 'bell') {
    return (
      <Svg {...common}>
        <Path d="M7 10.5C7 7.4 8.8 5.3 12 5.3C15.2 5.3 17 7.4 17 10.5V14.4L19 17H5L7 14.4Z" {...stroke} />
        <Path d="M9.7 19C10.2 20.1 11 20.6 12 20.6C13 20.6 13.8 20.1 14.3 19" {...stroke} />
      </Svg>
    );
  }

  if (name === 'plus') {
    return (
      <Svg {...common}>
        <Circle cx="12" cy="12" r="9" {...stroke} />
        <Line x1="12" y1="7.5" x2="12" y2="16.5" {...stroke} />
        <Line x1="7.5" y1="12" x2="16.5" y2="12" {...stroke} />
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

  if (name === 'back') {
    return (
      <Svg {...common}>
        <Polyline points="14.5,5 7.5,12 14.5,19" {...stroke} />
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
      </Svg>
    );
  }

  if (name === 'snow') {
    return (
      <Svg {...common}>
        <Line x1="12" y1="2" x2="12" y2="22" {...stroke} />
        <Line x1="3.4" y1="7" x2="20.6" y2="17" {...stroke} />
        <Line x1="3.4" y1="17" x2="20.6" y2="7" {...stroke} />
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

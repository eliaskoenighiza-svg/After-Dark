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
        <Path d="M5 13.5C5 8.4 8 5 12.4 5C16.1 5 18.8 7.3 19.4 10.9" {...stroke} />
        <Path d="M5.2 13.6H14.1L17.8 11.1" {...stroke} />
        <Path d="M7 13.6V17.3C8.4 18.5 10.1 19.1 12 19.1C14.2 19.1 16.1 18.3 17.4 16.8" {...stroke} />
        <Path d="M6.2 9.3C8.3 8.5 10.9 8.2 14.6 8.8" {...stroke} />
      </Svg>
    );
  }

  if (name === 'skills') {
    return (
      <Svg {...common}>
        <Path d="M4 20H20" {...stroke} />
        <Path d="M6 18V13" {...stroke} />
        <Path d="M11 18V9" {...stroke} />
        <Path d="M16 18V5" {...stroke} />
        <Path d="M14 7L16 5L18 7" {...stroke} />
      </Svg>
    );
  }

  if (name === 'battle') {
    return (
      <Svg {...common}>
        <Path d="M5 4L14.7 13.7" {...stroke} />
        <Path d="M19 4L9.3 13.7" {...stroke} />
        <Path d="M4.2 3.2L7.4 4L5 6.4Z" {...stroke} />
        <Path d="M19.8 3.2L16.6 4L19 6.4Z" {...stroke} />
        <Path d="M7.8 12.2L4.3 18.7" {...stroke} />
        <Path d="M16.2 12.2L19.7 18.7" {...stroke} />
        <Path d="M3.4 19.6L6.1 18.1" {...stroke} />
        <Path d="M20.6 19.6L17.9 18.1" {...stroke} />
      </Svg>
    );
  }

  if (name === 'parks') {
    return (
      <Svg {...common}>
        <Path d="M12 21C12 21 18.2 15.7 18.2 9.7C18.2 6.2 15.5 3.8 12 3.8C8.5 3.8 5.8 6.2 5.8 9.7C5.8 15.7 12 21 12 21Z" {...stroke} />
        <Circle cx="12" cy="9.6" r="2.2" {...stroke} />
      </Svg>
    );
  }

  if (name === 'more') {
    return (
      <Svg {...common}>
        <Circle cx="5" cy="12" r="1.8" fill={color} />
        <Circle cx="12" cy="12" r="1.8" fill={color} />
        <Circle cx="19" cy="12" r="1.8" fill={color} />
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

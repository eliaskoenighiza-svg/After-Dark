import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

export default function SportIcon({ id, color = '#C8F531', size = 24 }) {
  const p = { stroke: color, strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const w = { stroke: '#EDEDF2', strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  return <Svg width={size} height={size} viewBox="0 0 24 24">
    {['scooter','tramp-scooter','snowscoot'].includes(id) && <><Circle cx="6" cy="19" r="2" {...w}/><Circle cx="18" cy="19" r="2" {...w}/><Line x1="6" y1="17" x2="16" y2="17" {...p}/><Line x1="16" y1="17" x2="18" y2="7" {...p}/><Line x1="15" y1="7" x2="21" y2="7" {...w}/></>}
    {['bmx','mtb','snowbike'].includes(id) && <><Circle cx="6" cy="17" r="4" {...w}/><Circle cx="18" cy="17" r="4" {...w}/><Path d="M6 17l4-7 4 7H6zm4-7h5l3 7m-8-7-2-2m7 2 2-2" {...p}/></>}
    {id === 'skate' && <><Path d="M4 14c2 2 14 2 16 0" {...p}/><Line x1="6" y1="14" x2="18" y2="14" {...w}/><Circle cx="7" cy="18" r="1.5" {...w}/><Circle cx="17" cy="18" r="1.5" {...w}/></>}
    {id === 'trampoline' && <><Rect x="3" y="8" width="18" height="8" rx="4" {...p}/><Line x1="6" y1="16" x2="5" y2="21" {...w}/><Line x1="18" y1="16" x2="19" y2="21" {...w}/><Path d="M9 11c2 2 4 2 6 0" {...w}/></>}
    {id === 'parkour' && <><Circle cx="13" cy="4" r="2" {...w}/><Path d="M12 6l-2 5 4 3 2 6m-6-9-5 3m9 0 5-4m-9 3-4 6" {...p}/></>}
    {id === 'diving' && <><Line x1="3" y1="18" x2="21" y2="18" {...w}/><Path d="M5 21c2-2 4 2 6 0s4 2 6 0" {...p}/><Path d="M13 4c3 1 4 3 5 6m-5-6-3 4m8 2-4 2" {...w}/></>}
    {['freeski','snowboard'].includes(id) && <><Path d="M4 18c5 2 11 2 16 0" {...p}/><Path d="M7 16l8-9m-3 2 5 3" {...w}/><Circle cx="15" cy="5" r="2" {...w}/></>}
    {id === 'fitness' && <><Line x1="4" y1="12" x2="20" y2="12" {...p}/><Rect x="2" y="8" width="3" height="8" rx="1" {...w}/><Rect x="19" y="8" width="3" height="8" rx="1" {...w}/><Rect x="6" y="10" width="2" height="4" {...w}/><Rect x="16" y="10" width="2" height="4" {...w}/></>}
  </Svg>;
}

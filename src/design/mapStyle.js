// Night Ride v2 – dunkler Google-Maps-Stil (nur Optik)
export const NIGHT_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#070D19' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7C889F' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#03050A' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#18223A' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#AEB8CA' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#0B1628' }] },
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0A1D24' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#111C31' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0A1322' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#18264A' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#0E182B' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0C2244' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4A6A9A' }] },
];

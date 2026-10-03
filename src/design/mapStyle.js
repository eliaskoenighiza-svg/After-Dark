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

// Schwarzwald – Nacht im Tannenwald (nur Optik)
export const FOREST_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#06120F' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7FA394' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#030807' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#14302A' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#B8D4C8' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#0A1F18' }] },
  { featureType: 'landscape.natural.terrain', elementType: 'geometry', stylers: [{ color: '#0D2A20' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#0A1D17' }] },
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0F3326' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#132820' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#08140F' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1C3A2E' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#0C1E18' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0A2A38' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4F8A9A' }] },
];

// grob: Schwarzwald-Gebiet
export function inBlackForest(region) {
  if (!region) return false;
  const { latitude: la, longitude: lo } = region;
  return la > 47.55 && la < 49.0 && lo > 7.5 && lo < 8.95;
}

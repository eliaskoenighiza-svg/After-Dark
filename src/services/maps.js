import { Linking } from 'react-native';

const enc = encodeURIComponent;

export function openGoogleMapsSearch(query) {
  return Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${enc(query)}`);
}

export function openGoogleImages(query) {
  return Linking.openURL(`https://www.google.com/search?tbm=isch&q=${enc(query)}`);
}

export function openTransitRoute(origin, destination) {
  return Linking.openURL(`https://www.google.com/maps/dir/?api=1&origin=${enc(origin)}&destination=${enc(destination)}&travelmode=transit`);
}

export function openEmergency(number) {
  return Linking.openURL(`tel:${number}`);
}

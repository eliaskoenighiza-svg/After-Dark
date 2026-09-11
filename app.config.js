const mapsKey = process.env.GOOGLE_MAPS_API_KEY;

module.exports = {
  expo: {
    name: 'After[Dark',
    slug: 'after-dark',
    version: '0.4.0',
    orientation: 'portrait',
    userInterfaceStyle: 'dark',
    android: {
      package: 'de.afterdark.freestyle',
      adaptiveIcon: { backgroundColor: '#101014' },
    },
    plugins: [
      [
        'expo-image-picker',
        {
          photosPermission: 'After[Dark nutzt ausgewählte Fotos für Coach, Memories und Crew-Spots.',
          cameraPermission: 'After[Dark darf die Kamera für Trick-Fotos verwenden.',
          microphonePermission: false,
        },
      ],
      ...(mapsKey ? [['react-native-maps', { androidGoogleMapsApiKey: mapsKey }]] : []),
    ],
  },
};

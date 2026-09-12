const mapsKey = process.env.GOOGLE_MAPS_API_KEY;

module.exports = {
  expo: {
    name: 'After[Dark]',
    slug: 'after-dark',
    version: '0.5.0',
    orientation: 'portrait',
    userInterfaceStyle: 'dark',
    splash: {
      image: './assets/afterdark-loading.png',
      resizeMode: 'cover',
      backgroundColor: '#050913',
    },
    android: {
      package: 'de.afterdark.freestyle',
      adaptiveIcon: { backgroundColor: '#050913' },
    },
    plugins: [
      [
        'expo-image-picker',
        {
          photosPermission: 'After[Dark] nutzt ausgewählte Fotos für Profil, Coach, Memories und Crew-Spots.',
          cameraPermission: 'After[Dark] darf die Kamera für Trick-Fotos verwenden.',
          microphonePermission: false,
        },
      ],
      ...(mapsKey ? [['react-native-maps', { androidGoogleMapsApiKey: mapsKey }]] : []),
    ],
  },
};

const mapsKey = process.env.GOOGLE_MAPS_API_KEY;

module.exports = {
  expo: {updates: {
  url: 'https://u.expo.dev/da3bea06-65be-4795-85b7-56551e4ddbda',
},
runtimeVersion: {
  policy: 'appVersion',
},
    name: 'After[Dark',
    slug: 'after-dark',
    version: '0.9.0',
    orientation: 'portrait',
    userInterfaceStyle: 'dark',
    extra: {
      eas: {
        projectId: 'da3bea06-65be-4795-85b7-56551e4ddbda',
      },
    },
    splash: {
      image: './assets/afterdark-loading.png',
      resizeMode: 'cover',
      backgroundColor: '#030812',
    },
    android: {
      package: 'de.afterdark.freestyle',
      adaptiveIcon: { backgroundColor: '#030812' },
    },
    plugins: [
      [
        'expo-image-picker',
        {
          photosPermission: 'After[Dark nutzt ausgewählte Fotos für Profil, Coach, Memories und Crew-Spots.',
          cameraPermission: 'After[Dark darf die Kamera für Trick-Fotos verwenden.',
          microphonePermission: false,
        },
      ],
      ...(mapsKey ? [['react-native-maps', { androidGoogleMapsApiKey: mapsKey }]] : []),
    ],
  },
};

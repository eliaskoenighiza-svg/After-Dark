// After[Dark – Night Ride v2
// Alte Keys bleiben erhalten (werden im ganzen Projekt genutzt), zeigen aber auf die neuen Werte.

export const COLORS = {
  // Bestehende Keys
  bg: '#03050A',
  bgSoft: '#0A111F',
  panel: '#0F182C',
  panel2: '#18223A',
  panel3: '#16203A',
  text: '#F4F6FB',
  muted: '#8793AA',
  line: '#18223A',
  lineSoft: '#111B30',
  volt: '#CFFF3A',
  pink: '#FF3D8B',
  ice: '#38E1F2',
  purple: '#8C7CFF',
  blue: '#6CB6FF',
  success: '#CFFF3A',
  danger: '#FF3D8B',
  warning: '#FFD479',

  // Night Ride v2
  ink: '#03050A',
  midnight: '#0A111F',
  cardTop: '#0F182C',
  stat: '#0B1221',
  tile: '#16203A',
  raised: '#18223A',
  well: '#070C17',
  nodeIdle: '#111B30',
  road: '#0C1426',
  text2: '#AEB8CA',
  text3: '#8793AA',
  placeholder: '#76829A',
  mutedNum: '#4A5672',
  onLime: '#060A10',
  lime: '#CFFF3A',
  cyan: '#38E1F2',
  violet: '#8C7CFF',
  limeSoft: 'rgba(207,255,58,0.12)',
  limeText: '#DDFF7A',
  cyanSoft: 'rgba(56,225,242,0.14)',
  cyanText: '#9AF0F8',
  pinkSoft: 'rgba(255,61,139,0.16)',
  pinkText: '#FF7DB0',
  violetSoft: 'rgba(140,124,255,0.14)',
  violetText: '#C3BAFF',
  iceText: '#9CCBFF',
  glass: 'rgba(255,255,255,0.08)',
};

export const GRADIENTS = {
  card: { colors: ['#0F182C', '#0A111F'], angle: 180 },
  coach: { colors: ['#0F4150', '#0B2233', '#0A111F'], locations: [0, 0.38, 0.78], angle: 160 },
  skills: { colors: ['#34460C', '#18230E', '#0A111F'], locations: [0, 0.36, 0.78], angle: 160 },
  battle: { colors: ['#4A0F2C', '#22102A', '#0A111F'], locations: [0, 0.36, 0.76], angle: 160 },
  crew: { colors: ['#5A48D8', '#2A1F6A', '#121634'], locations: [0, 0.45, 1], angle: 150 },
  cloud: { colors: ['#1B2A12', '#0F1A22', '#0A111F'], locations: [0, 0.4, 0.8], angle: 160 },
  trick: { colors: ['#13284A', '#0A111F'], angle: 160 },
  tileLime: { colors: ['#1E2A10', '#0F182C'], locations: [0, 0.7], angle: 165 },
  tilePink: { colors: ['#3A1030', '#0F182C'], locations: [0, 0.7], angle: 160 },
  tileIce: { colors: ['#10304E', '#0F182C'], locations: [0, 0.7], angle: 160 },
  lime: { colors: ['#DFFF6E', '#A6D418'], angle: 160 },
  pink: { colors: ['#FF6BA6', '#C21E62'], angle: 160 },
  avatarCyan: { colors: ['#7DF0FA', '#1B6F86'], angle: 145 },
  avatarViolet: { colors: ['#C3BAFF', '#5A48D8'], angle: 145 },
  avatarWhite: { colors: ['#F4F6FB', '#8A94AD'], angle: 145 },
  avatarLime: { colors: ['#E6FF86', '#8DB70C'], angle: 145 },
  filterOn: { colors: ['#1B6F86', '#0F2E44'], angle: 150 },
};

export const RADII = {
  full: 999,
  poster: 30,
  card: 28,
  cardSm: 26,
  tile: 22,
  stat: 20,
  badge: 18,
  letter: 12,
  sticker: 8,
};

export const SPACE = {
  s1: 4,
  s2: 8,
  s3: 10,
  s4: 12,
  s5: 14,
  screen: 18,
  card: 20,
  poster: 22,
  navClear: 120,
};

export const FONTS = {
  display: 'AD-Display',
  logo: 'AD-Logo',
  number: 'AD-Number',
  head: 'AD-Head',
  headX: 'AD-HeadX',
  body: 'AD-Body',
  medium: 'AD-Medium',
  semibold: 'AD-SemiBold',
  bold: 'AD-Bold',
};

export const FONT_FILES = {
  'AD-Display': require('../assets/fonts/Archivo-DisplayBlackItalic.ttf'),
  'AD-Logo': require('../assets/fonts/Archivo-LogoBlackItalic.ttf'),
  'AD-Number': require('../assets/fonts/Archivo-NumberBlack.ttf'),
  'AD-Head': require('../assets/fonts/Archivo-HeadBold.ttf'),
  'AD-HeadX': require('../assets/fonts/Archivo-HeadExtraBold.ttf'),
  'AD-Body': require('../assets/fonts/Geist-Regular.ttf'),
  'AD-Medium': require('../assets/fonts/Geist-Medium.ttf'),
  'AD-SemiBold': require('../assets/fonts/Geist-SemiBold.ttf'),
  'AD-Bold': require('../assets/fonts/Geist-Bold.ttf'),
};

export const TYPE = {
  display: {
    fontFamily: FONTS.display,
    color: COLORS.text,
    textTransform: 'uppercase',
    paddingRight: 6,
  },
  head: {
    fontFamily: FONTS.head,
    color: COLORS.text,
  },
  number: {
    fontFamily: FONTS.number,
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  body: {
    fontFamily: FONTS.body,
    fontSize: 14.5,
    lineHeight: 22,
    color: COLORS.text2,
  },
  strong: {
    fontFamily: FONTS.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
  },
  label: {
    fontFamily: FONTS.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.text3,
  },
  caption: {
    fontFamily: FONTS.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.text3,
  },
  tag: {
    fontFamily: FONTS.bold,
    fontSize: 11.5,
  },
  button: {
    fontFamily: FONTS.headX,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
};

export const SHADOWS = {
  card: {
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 48px -28px rgba(0,0,0,0.95)',
  },
  poster: (rgba) => ({
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.09), 0 30px 60px -30px ${rgba}`,
  }),
  cta: {
    boxShadow: '0 14px 34px -14px rgba(207,255,58,0.7)',
  },
  dock: {
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 24px 50px -12px rgba(0,0,0,0.95)',
  },
};

// Kompatibilität: wird in UI.js gespreizt
export const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.3,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 12 },
  elevation: 3,
};

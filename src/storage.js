import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_PREFIX = 'ad:local:';
const SHARED_PREFIX = 'ad:shared:';

async function get(prefix, key, fallback = null) {
  try {
    const raw = await AsyncStorage.getItem(prefix + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function set(prefix, key, value) {
  await AsyncStorage.setItem(prefix + key, JSON.stringify(value));
  return value;
}

export const localGet = (key, fallback = null) => get(LOCAL_PREFIX, key, fallback);
export const localSet = (key, value) => set(LOCAL_PREFIX, key, value);
export const sharedGet = (key, fallback = null) => get(SHARED_PREFIX, key, fallback);
export const sharedSet = (key, value) => set(SHARED_PREFIX, key, value);

export async function dumpAllData() {
  const keys = await AsyncStorage.getAllKeys();
  const own = keys.filter((k) => k.startsWith('ad:'));
  const pairs = await AsyncStorage.multiGet(own);
  return JSON.stringify(Object.fromEntries(pairs), null, 2);
}

export async function restoreAllData(text) {
  const obj = JSON.parse(text);
  const entries = Object.entries(obj).filter(([k, v]) => k.startsWith('ad:') && typeof v === 'string');
  await AsyncStorage.multiSet(entries);
  return entries.length;
}

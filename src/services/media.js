import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Directory, File, Paths } from 'expo-file-system';

export async function pickAndResizeImage({ base64 = false } = {}) {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.9,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  const maxSide = Math.max(asset.width || 0, asset.height || 0);
  const resize = maxSide > 1024
    ? [{ resize: (asset.width || 0) >= (asset.height || 0) ? { width: 1024 } : { height: 1024 } }]
    : [];
  return ImageManipulator.manipulateAsync(asset.uri, resize, {
    compress: 0.74,
    format: ImageManipulator.SaveFormat.JPEG,
    base64,
  });
}

export async function pickProofMedia() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images', 'videos'],
    quality: 0.8,
    videoMaxDuration: 30,
  });
  return result.canceled ? null : result.assets[0];
}

export async function persistImage(uri, prefix = 'memory') {
  const dir = new Directory(Paths.document, 'after-dark-media');
  if (!dir.exists) dir.create({ intermediates: true });
  const source = new File(uri);
  const target = new File(dir, `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`);
  await source.copy(target);
  return target.uri;
}

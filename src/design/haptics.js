// Kurzes Vibrieren für wichtige Momente. Fehlt das Modul, passiert einfach nichts.
let H = null;
try {
  H = require('expo-haptics');
} catch (e) {
  H = null;
}

const safe = (fn) => {
  try {
    const r = fn();
    if (r && typeof r.catch === 'function') r.catch(() => {});
  } catch (e) {
    // still
  }
};

export const haptic = {
  // Tab, Auswahl
  select: () => H && safe(() => H.selectionAsync()),
  // normaler Button
  tap: () => H && safe(() => H.impactAsync(H.ImpactFeedbackStyle.Light)),
  // Münzwurf, Würfel
  medium: () => H && safe(() => H.impactAsync(H.ImpactFeedbackStyle.Medium)),
  // Buchstabe kassiert
  heavy: () => H && safe(() => H.impactAsync(H.ImpactFeedbackStyle.Heavy)),
  // Trick geschafft, Level, Badge
  success: () => H && safe(() => H.notificationAsync(H.NotificationFeedbackType.Success)),
  warning: () => H && safe(() => H.notificationAsync(H.NotificationFeedbackType.Warning)),
};

import * as Haptics from 'expo-haptics';

export async function dispararHapticFavorito(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Fallback silencioso si el dispositivo o emulador no soporta vibración háptica
  }
}

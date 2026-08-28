import * as FileSystem from 'expo-file-system/legacy';

/**
 * TOKEN STORE — persists the session JWT to the app's document directory
 * so a restart keeps the user signed in. Kept intentionally tiny; the whole
 * app touches it only through `load` / `save` / `clear`.
 */

const FILE = `${FileSystem.documentDirectory}annpurna_token`;

export async function loadToken() {
  try {
    const text = await FileSystem.readAsStringAsync(FILE);
    return text || null;
  } catch {
    return null;
  }
}

export async function saveToken(token) {
  try {
    await FileSystem.writeAsStringAsync(FILE, token);
  } catch {
    // Storage unavailable — session just won't survive a restart
  }
}

export async function clearToken() {
  try {
    await FileSystem.deleteAsync(FILE, { idempotent: true });
  } catch {
    // Nothing to clear
  }
}
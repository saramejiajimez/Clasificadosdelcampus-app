import * as SecureStore from 'expo-secure-store';

const KEY_ACCESS_TOKEN = 'campus_access_token';
const KEY_REFRESH_TOKEN = 'campus_refresh_token';
const KEY_USER_JSON = 'campus_user_json';

export interface StoredUser {
  id: string;
  email: string;
  rol?: string | null;
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY_ACCESS_TOKEN);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY_REFRESH_TOKEN);
}

export async function saveTokensOnly(
  token: string,
  refreshToken: string
): Promise<void> {
  await SecureStore.setItemAsync(KEY_ACCESS_TOKEN, token);
  await SecureStore.setItemAsync(KEY_REFRESH_TOKEN, refreshToken);
}

export async function saveFullSession(
  token: string,
  refreshToken: string,
  usuario: StoredUser
): Promise<void> {
  await saveTokensOnly(token, refreshToken);
  await SecureStore.setItemAsync(KEY_USER_JSON, JSON.stringify(usuario));
}

export async function getStoredUser(): Promise<StoredUser | null> {
  const raw = await SecureStore.getItemAsync(KEY_USER_JSON);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export async function clearSessionStorage(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY_ACCESS_TOKEN);
  await SecureStore.deleteItemAsync(KEY_REFRESH_TOKEN);
  await SecureStore.deleteItemAsync(KEY_USER_JSON);
}

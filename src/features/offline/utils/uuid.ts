import * as Crypto from 'expo-crypto';

export async function generateUUID(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(16);
  const hexArray = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return [
    hexArray.substring(0, 8),
    hexArray.substring(8, 12),
    hexArray.substring(12, 16),
    hexArray.substring(16, 20),
    hexArray.substring(20, 32),
  ].join('-');
}

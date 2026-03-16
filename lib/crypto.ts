/**
 * Server-side only. AES-256-GCM symmetric encryption for storing Figma tokens.
 * Key is read from ENCRYPTION_KEY env var (32-character ASCII string = 32 bytes).
 * Never import this module in client components.
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error('ENCRYPTION_KEY environment variable is not set');
  const buf = Buffer.from(raw, 'utf8');
  if (buf.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must be exactly 32 characters. Got ${buf.length}.`
    );
  }
  return buf;
}

/**
 * Encrypts a plaintext string.
 * Returns a colon-delimited base64 string: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':');
}

/**
 * Decrypts a value produced by encrypt().
 * Returns the original plaintext, or an empty string if decryption fails.
 */
export function decrypt(encrypted: string): string {
  try {
    const key = getKey();
    const parts = encrypted.split(':');
    if (parts.length !== 3) return '';

    const [ivB64, authTagB64, ciphertextB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const ciphertext = Buffer.from(ciphertextB64, 'base64');

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    return decipher.update(ciphertext) + decipher.final('utf8');
  } catch {
    return '';
  }
}

/**
 * Returns true if the string looks like an encrypted value (iv:authTag:ciphertext).
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(':');
  if (parts.length !== 3) return false;
  return parts.every((p) => /^[A-Za-z0-9+/=]+$/.test(p));
}

/**
 * Git X Web Crypto Encryption Helper
 * Использует PBKDF2 для вывода AES-GCM ключа из мастер-пароля.
 */

// Кодирование/декодирование строк в байты
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Преобразует ArrayBuffer в строку Hex
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Преобразует строку Hex в ArrayBuffer
 */
function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes.buffer;
}

/**
 * Генерирует криптографически стойкую соль
 */
export function generateSalt(length = 16): string {
  const bytes = new Uint8Array(length);
  window.crypto.getRandomValues(bytes);
  return bufferToHex(bytes.buffer);
}

/**
 * Генерирует вектор инициализации (IV) для AES-GCM
 */
export function generateIV(length = 12): string {
  const bytes = new Uint8Array(length);
  window.crypto.getRandomValues(bytes);
  return bufferToHex(bytes.buffer);
}

/**
 * Создает ключ шифрования из пароля и соли
 */
async function deriveKey(password: string, saltHex: string): Promise<CryptoKey> {
  const passwordBytes = encoder.encode(password);
  const saltBytes = hexToBuffer(saltHex);

  // Импорт сырого пароля в качестве ключа
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Вывод AES-GCM 256-бит ключа
  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Шифрует текст с использованием мастер-пароля
 */
export async function encryptText(
  text: string,
  password: string,
  providedSalt?: string,
  providedIv?: string
): Promise<{ ciphertext: string; salt: string; iv: string }> {
  try {
    const salt = providedSalt || generateSalt();
    const iv = providedIv || generateIV();
    
    const key = await deriveKey(password, salt);
    const textBytes = encoder.encode(text);
    const ivBytes = hexToBuffer(iv);

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes
      },
      key,
      textBytes
    );

    return {
      ciphertext: bufferToHex(encryptedBuffer),
      salt,
      iv
    };
  } catch (error) {
    console.error('Ошибка шифрования:', error);
    throw new Error('Не удалось зашифровать данные. Проверьте параметры.');
  }
}

/**
 * Расшифровывает текст с использованием мастер-пароля
 */
export async function decryptText(
  ciphertextHex: string,
  password: string,
  saltHex: string,
  ivHex: string
): Promise<string> {
  try {
    const key = await deriveKey(password, saltHex);
    const ciphertextBytes = hexToBuffer(ciphertextHex);
    const ivBytes = hexToBuffer(ivHex);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes
      },
      key,
      ciphertextBytes
    );

    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Ошибка расшифрования:', error);
    throw new Error('Не удалось расшифровать данные. Возможно, введен неверный мастер-пароль.');
  }
}

const CryptoJS = require('crypto-js');
const crypto = require('crypto');

// Получаем ключ шифрования из переменных окружения
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// Проверяем наличие ключа шифрования
if (!ENCRYPTION_KEY) {
  console.error(
    '❌ КРИТИЧЕСКАЯ ОШИБКА: ENCRYPTION_KEY не установлен в переменных окружения!'
  );
  console.error(
    'Установите сильный ключ шифрования в переменной окружения ENCRYPTION_KEY'
  );
  process.exit(1);
}

// Проверяем длину ключа
if (ENCRYPTION_KEY.length < 32) {
  console.error(
    '❌ КРИТИЧЕСКАЯ ОШИБКА: ENCRYPTION_KEY должен содержать минимум 32 символа!'
  );
  process.exit(1);
}

/**
 * Шифрует строку с использованием AES-256-GCM
 * @param {string} text - Текст для шифрования
 * @returns {string} - Зашифрованная строка
 */
function encrypt(text) {
  if (!text) return null;

  try {
    // Генерируем случайный IV для каждого шифрования
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', ENCRYPTION_KEY);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Возвращаем IV + authTag + encrypted data
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Ошибка шифрования:', error);
    return null;
  }
}

/**
 * Расшифровывает строку
 * @param {string} encryptedText - Зашифрованная строка
 * @returns {string} - Расшифрованная строка
 */
function decrypt(encryptedText) {
  if (!encryptedText) return null;

  console.log('🔍 DEBUG: Начало расшифровки:', {
    encryptedText: encryptedText ? '***' + encryptedText.slice(-4) : 'NULL',
    length: encryptedText ? encryptedText.length : 0,
    hasColon: encryptedText ? encryptedText.includes(':') : false,
  });

  try {
    // Проверяем формат (старый формат CryptoJS или новый формат)
    if (encryptedText.includes(':')) {
      // Новый формат: IV:authTag:encrypted
      const parts = encryptedText.split(':');
      console.log('🔍 DEBUG: Новый формат, части:', {
        partsCount: parts.length,
        partLengths: parts.map((p) => p.length),
      });

      if (parts.length !== 3) {
        throw new Error('Неверный формат зашифрованных данных');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      console.log('🔍 DEBUG: Параметры расшифровки:', {
        ivLength: iv.length,
        authTagLength: authTag.length,
        encryptedLength: encrypted.length,
      });

      const decipher = crypto.createDecipher('aes-256-gcm', ENCRYPTION_KEY);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      console.log('🔍 DEBUG: Расшифровка успешна:', {
        decryptedLength: decrypted.length,
        decryptedValue: decrypted ? '***' + decrypted.slice(-4) : 'NULL',
      });

      return decrypted;
    } else {
      // Старый формат CryptoJS (для обратной совместимости)
      try {
        const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        if (!decrypted) {
          throw new Error('Не удалось расшифровать данные');
        }
        return decrypted;
      } catch (cryptoJSError) {
        console.error('Ошибка расшифровки CryptoJS:', cryptoJSError);
        // Если не удалось расшифровать как CryptoJS, возможно это уже расшифрованные данные
        return encryptedText;
      }
    }
  } catch (error) {
    console.error('Ошибка расшифровки:', error);
    return null;
  }
}

/**
 * Шифрует объект с токенами
 * @param {Object} user - Объект пользователя
 * @returns {Object} - Объект с зашифрованными токенами
 */
function encryptUserTokens(user) {
  const encrypted = { ...user };

  if (user.jiraApiToken) {
    encrypted.jiraApiToken = encrypt(user.jiraApiToken);
  }

  if (user.aiToken) {
    encrypted.aiToken = encrypt(user.aiToken);
  }

  return encrypted;
}

/**
 * Расшифровывает токены пользователя
 * @param {Object} user - Объект пользователя
 * @returns {Object} - Объект с расшифрованными токенами
 */
function decryptUserTokens(user) {
  const decrypted = { ...user };

  if (user.jiraApiToken) {
    decrypted.jiraApiToken = decrypt(user.jiraApiToken);
  }

  if (user.aiToken) {
    decrypted.aiToken = decrypt(user.aiToken);
  }

  return decrypted;
}

module.exports = {
  encrypt,
  decrypt,
  encryptUserTokens,
  decryptUserTokens,
};

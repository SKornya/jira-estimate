const CryptoJS = require('crypto-js');

// Получаем ключ шифрования из переменных окружения
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

/**
 * Шифрует строку
 * @param {string} text - Текст для шифрования
 * @returns {string} - Зашифрованная строка
 */
function encrypt(text) {
  if (!text) return null;

  try {
    const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
    return encrypted;
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

  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted;
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

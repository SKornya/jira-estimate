const CryptoJS = require('crypto-js');

/**
 * Проверяет, является ли строка хешированным паролем с клиента
 */
const isHashedPassword = (password) => {
  return password.includes(':') && password.split(':').length === 2;
};

/**
 * Извлекает хеш и соль из хешированного пароля
 */
const parseHashedPassword = (hashedPassword) => {
  const [hash, salt] = hashedPassword.split(':');
  return { hash, salt };
};

/**
 * Проверяет хешированный пароль с клиента
 * @param {string} clientHashedPassword - хешированный пароль с клиента в формате "hash:salt"
 * @param {string} storedPassword - хешированный пароль из базы данных (bcrypt)
 * @returns {Promise<boolean>} - результат проверки
 */
const verifyClientHashedPassword = async (
  clientHashedPassword,
  storedPassword
) => {
  try {
    // Если пароль не хеширован на клиенте, используем стандартную проверку bcrypt
    if (!isHashedPassword(clientHashedPassword)) {
      const bcrypt = require('bcryptjs');
      return await bcrypt.compare(clientHashedPassword, storedPassword);
    }

    // Если пароль в БД начинается с "CLIENT_HASH:", значит это клиентский хеш
    if (storedPassword.startsWith('CLIENT_HASH:')) {
      const storedClientHash = storedPassword.replace('CLIENT_HASH:', '');

      // Извлекаем соль из сохраненного хеша
      const { salt: storedSalt } = parseHashedPassword(storedClientHash);

      // Хешируем введенный пароль с той же солью
      const CryptoJS = require('crypto-js');
      const hashedInputPassword = CryptoJS.SHA256(
        clientHashedPassword + storedSalt
      ).toString();
      const newHashedPassword = `${hashedInputPassword}:${storedSalt}`;

      return storedClientHash === newHashedPassword;
    }

    // Если это не клиентский хеш, значит пароль не соответствует новой системе
    return false;
  } catch (error) {
    console.error('Ошибка проверки хешированного пароля:', error);
    return false;
  }
};

/**
 * Подготавливает пароль для сохранения в базу данных
 * @param {string} password - пароль (может быть хешированным с клиента или обычным)
 * @returns {Promise<string>} - подготовленный пароль для сохранения
 */
const preparePasswordForStorage = async (password) => {
  try {
    // Если пароль хеширован на клиенте, сохраняем его с префиксом
    if (isHashedPassword(password)) {
      return `CLIENT_HASH:${password}`;
    }

    // Если пароль обычный, хешируем его с помощью bcrypt
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    console.error('Ошибка подготовки пароля для сохранения:', error);
    throw error;
  }
};

module.exports = {
  isHashedPassword,
  parseHashedPassword,
  verifyClientHashedPassword,
  preparePasswordForStorage,
};

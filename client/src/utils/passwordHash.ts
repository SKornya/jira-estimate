import CryptoJS from 'crypto-js';

/**
 * Хеширует пароль на клиенте перед отправкой на сервер
 * Использует SHA-256 с солью для дополнительной безопасности
 */
export const hashPassword = (password: string): string => {
  // Создаем соль на основе текущего времени и случайных данных
  const timestamp = Date.now().toString();
  const randomSalt = CryptoJS.lib.WordArray.random(16).toString();
  const salt = CryptoJS.SHA256(timestamp + randomSalt).toString();
  
  // Хешируем пароль с солью
  const hashedPassword = CryptoJS.SHA256(password + salt).toString();
  
  // Возвращаем хеш с солью в формате: hash:salt
  return `${hashedPassword}:${salt}`;
};

/**
 * Проверяет, является ли строка хешированным паролем
 */
export const isHashedPassword = (password: string): boolean => {
  return password.includes(':') && password.split(':').length === 2;
};

/**
 * Извлекает хеш и соль из хешированного пароля
 */
export const parseHashedPassword = (hashedPassword: string): { hash: string; salt: string } => {
  const [hash, salt] = hashedPassword.split(':');
  return { hash, salt };
};

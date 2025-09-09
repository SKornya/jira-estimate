const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const {
  encrypt,
  decrypt,
  encryptUserTokens,
  decryptUserTokens,
} = require('../utils/encryption');
const {
  preparePasswordForStorage,
  verifyClientHashedPassword,
} = require('../utils/passwordHash');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [3, 50],
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 255],
      },
    },
    jiraUsername: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    jiraBaseUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    jiraEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    jiraApiToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    aiHost: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    aiToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastLogin: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'users',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await preparePasswordForStorage(user.password);
        }

        // Шифруем токены при создании
        if (user.jiraApiToken) {
          console.log('🔐 Шифрование jiraApiToken при создании');
          user.jiraApiToken = encrypt(user.jiraApiToken);
        }
        if (user.aiToken) {
          console.log('🔐 Шифрование aiToken при создании');
          user.aiToken = encrypt(user.aiToken);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await preparePasswordForStorage(user.password);
        }

        // Шифруем токены при обновлении
        if (user.changed('jiraApiToken') && user.jiraApiToken) {
          console.log('🔐 Шифрование jiraApiToken при обновлении:', {
            userId: user.id,
            originalLength: user.jiraApiToken.length,
            originalValue: user.jiraApiToken
              ? '***' + user.jiraApiToken.slice(-4)
              : 'NULL',
          });
          const originalToken = user.jiraApiToken;
          user.jiraApiToken = encrypt(user.jiraApiToken);
          console.log('🔐 Токен зашифрован:', {
            userId: user.id,
            originalLength: originalToken.length,
            encryptedLength: user.jiraApiToken ? user.jiraApiToken.length : 0,
            encryptedSuccess: !!user.jiraApiToken,
          });
        }
        if (user.changed('aiToken') && user.aiToken) {
          console.log('🔐 Шифрование aiToken при обновлении');
          user.aiToken = encrypt(user.aiToken);
        }
      },
      afterFind: async (users) => {
        // Расшифровываем токены после получения из БД
        if (Array.isArray(users)) {
          users.forEach((user) => {
            if (user.jiraApiToken) {
              user.jiraApiToken = decrypt(user.jiraApiToken);
            }
            if (user.aiToken) {
              user.aiToken = decrypt(user.aiToken);
            }
          });
        } else if (users) {
          console.log('🔍 DEBUG: Хук afterFind для пользователя:', {
            userId: users.id,
            username: users.username,
            jiraApiTokenBefore: users.jiraApiToken
              ? '***' + users.jiraApiToken.slice(-4)
              : 'NULL',
            jiraApiTokenLengthBefore: users.jiraApiToken
              ? users.jiraApiToken.length
              : 0,
          });

          if (users.jiraApiToken) {
            try {
              const originalToken = users.jiraApiToken;
              users.jiraApiToken = decrypt(users.jiraApiToken);
              console.log('🔍 DEBUG: Токен расшифрован:', {
                userId: users.id,
                originalLength: originalToken.length,
                decryptedLength: users.jiraApiToken
                  ? users.jiraApiToken.length
                  : 0,
                decryptedSuccess: !!users.jiraApiToken,
              });
            } catch (error) {
              console.error('Ошибка расшифровки jiraApiToken:', error);
              users.jiraApiToken = null;
            }
          }
          if (users.aiToken) {
            try {
              users.aiToken = decrypt(users.aiToken);
            } catch (error) {
              console.error('Ошибка расшифровки aiToken:', error);
              users.aiToken = null;
            }
          }
        }
      },
    },
  }
);

// Метод для проверки пароля
User.prototype.comparePassword = async function (candidatePassword) {
  return await verifyClientHashedPassword(candidatePassword, this.password);
};

module.exports = User;

const { DataTypes } = require('sequelize');
const crypto = require('crypto');
const { sequelize } = require('../config/database');

// Функция для шифрования токенов
const encryptToken = (text) => {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key-change-in-production', 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  cipher.setAAD(Buffer.from('additional-data'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
};

// Функция для расшифровки токенов
const decryptToken = (encryptedData) => {
  try {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key-change-in-production', 'salt', 32);
    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAAD(Buffer.from('additional-data'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Ошибка расшифровки токена:', error);
    return null;
  }
};

const Settings = sequelize.define(
  'Settings',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    // Jira настройки
    jiraHost: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    jiraUsername: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    jiraEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    jiraToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    jiraTokenIv: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    jiraTokenAuthTag: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // AI настройки
    aiHost: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    aiToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    aiTokenIv: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    aiTokenAuthTag: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Общие настройки
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: 'settings',
    hooks: {
      beforeCreate: async (settings) => {
        // Шифруем токены при создании
        if (settings.jiraToken) {
          const encryptedJira = encryptToken(settings.jiraToken);
          settings.jiraToken = encryptedJira.encrypted;
          settings.jiraTokenIv = encryptedJira.iv;
          settings.jiraTokenAuthTag = encryptedJira.authTag;
        }
        
        if (settings.aiToken) {
          const encryptedAi = encryptToken(settings.aiToken);
          settings.aiToken = encryptedAi.encrypted;
          settings.aiTokenIv = encryptedAi.iv;
          settings.aiTokenAuthTag = encryptedAi.authTag;
        }
      },
      beforeUpdate: async (settings) => {
        // Шифруем токены при обновлении, если они изменились
        if (settings.changed('jiraToken') && settings.jiraToken) {
          const encryptedJira = encryptToken(settings.jiraToken);
          settings.jiraToken = encryptedJira.encrypted;
          settings.jiraTokenIv = encryptedJira.iv;
          settings.jiraTokenAuthTag = encryptedJira.authTag;
        }
        
        if (settings.changed('aiToken') && settings.aiToken) {
          const encryptedAi = encryptToken(settings.aiToken);
          settings.aiToken = encryptedAi.encrypted;
          settings.aiTokenIv = encryptedAi.iv;
          settings.aiTokenAuthTag = encryptedAi.authTag;
        }
      },
      afterFind: (settings) => {
        // Расшифровываем токены при получении данных
        if (Array.isArray(settings)) {
          settings.forEach(setting => {
            if (setting.jiraToken && setting.jiraTokenIv && setting.jiraTokenAuthTag) {
              setting.jiraToken = decryptToken({
                encrypted: setting.jiraToken,
                iv: setting.jiraTokenIv,
                authTag: setting.jiraTokenAuthTag
              });
            }
            if (setting.aiToken && setting.aiTokenIv && setting.aiTokenAuthTag) {
              setting.aiToken = decryptToken({
                encrypted: setting.aiToken,
                iv: setting.aiTokenIv,
                authTag: setting.aiTokenAuthTag
              });
            }
          });
        } else if (settings) {
          if (settings.jiraToken && settings.jiraTokenIv && settings.jiraTokenAuthTag) {
            settings.jiraToken = decryptToken({
              encrypted: settings.jiraToken,
              iv: settings.jiraTokenIv,
              authTag: settings.jiraTokenAuthTag
            });
          }
          if (settings.aiToken && settings.aiTokenIv && settings.aiTokenAuthTag) {
            settings.aiToken = decryptToken({
              encrypted: settings.aiToken,
              iv: settings.aiTokenIv,
              authTag: settings.aiTokenAuthTag
            });
          }
        }
      },
    },
  }
);

// Метод для получения расшифрованных настроек
Settings.prototype.getDecryptedSettings = function() {
  const settings = this.toJSON();
  
  if (settings.jiraToken && settings.jiraTokenIv && settings.jiraTokenAuthTag) {
    settings.jiraToken = decryptToken({
      encrypted: settings.jiraToken,
      iv: settings.jiraTokenIv,
      authTag: settings.jiraTokenAuthTag
    });
  }
  
  if (settings.aiToken && settings.aiTokenIv && settings.aiTokenAuthTag) {
    settings.aiToken = decryptToken({
      encrypted: settings.aiToken,
      iv: settings.aiTokenIv,
      authTag: settings.aiTokenAuthTag
    });
  }
  
  return settings;
};

module.exports = Settings;

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const https = require('https');
const fs = require('fs');
require('dotenv').config();

const { testConnection, syncDatabase } = require('./config/database');

const authRoutes = require('./routes/auth');
const jiraRoutes = require('./routes/jira');
const estimationRoutes = require('./routes/estimation');
const taskRoutes = require('./routes/tasks');
const settingsRoutes = require('./routes/settings');

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Слишком много запросов с этого IP, попробуйте позже.',
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuration
const corsOptions = {
  origin:
    process.env.NODE_ENV === 'production'
      ? [process.env.FRONTEND_URL || 'http://localhost:3000']
      : true,
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(limiter);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Увеличиваем лимит до 10MB

// Database connection
const initializeDatabase = async () => {
  await testConnection();
  await syncDatabase();
};

initializeDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jira', jiraRoutes);
app.use('/api/estimation', estimationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Сервер работает' });
});

const PORT = process.env.PORT || 3001;

// Запуск HTTP сервера (для разработки)
app.listen(PORT, () => {
  console.log(`🚀 HTTP сервер запущен на порту ${PORT}`);
});

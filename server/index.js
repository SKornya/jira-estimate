const express = require('express');
const cors = require('cors');
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

// Middleware
app.use(cors());
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

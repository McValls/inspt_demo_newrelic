// Load environment variables first
require('dotenv').config();

// Load New Relic agent (must be loaded before any other modules)
require('newrelic');

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// PI endpoint - returns first 10 digits of PI
app.get('/pi', (req, res) => {
  const pi = Math.PI;
  const piFirst10Digits = pi.toFixed(9); // Gets 3.141592654 (10 digits total)
  
  res.json({
    pi: piFirst10Digits,
    digits: 10,
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Monitoring API with New Relic Integration',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      pi: '/pi'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: ['/health', '/pi', '/']
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Health check available at: http://localhost:${port}/health`);
  console.log(`PI endpoint available at: http://localhost:${port}/pi`);
});

module.exports = app;

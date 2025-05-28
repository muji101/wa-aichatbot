const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const whatsappRoutes = require('./routes/whatsapp');
const aiRoutes = require('./routes/ai');
const WhatsAppService = require('./services/whatsappService');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize WhatsApp service with WebSocket
const whatsappService = new WhatsAppService(io);

// Routes
app.use('/api/whatsapp', whatsappRoutes(whatsappService));
app.use('/api/ai', aiRoutes(whatsappService)); // Pass whatsappService to aiRoutes

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
  
  socket.on('start-whatsapp', () => {
    whatsappService.initialize();
  });
  
  socket.on('stop-whatsapp', () => {
    whatsappService.destroy();
  });
});

// Basic route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 WebSocket server ready`);
  console.log(`🌐 Dashboard: http://localhost:${PORT}`);
});

module.exports = { app, server, io };
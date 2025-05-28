const express = require('express');
const router = express.Router();

module.exports = (whatsappService) => {
  // Get WhatsApp status
  router.get('/status', (req, res) => {
    try {
      const status = whatsappService.getStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Start WhatsApp client
  router.post('/start', (req, res) => {
    try {
      whatsappService.initialize();
      res.json({ message: 'WhatsApp client starting...', success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stop WhatsApp client
  router.post('/stop', async (req, res) => {
    try {
      await whatsappService.destroy();
      res.json({ message: 'WhatsApp client stopped', success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Send message
  router.post('/send', async (req, res) => {
    try {
      const { to, message } = req.body;
      
      if (!to || !message) {
        return res.status(400).json({ error: 'Phone number and message are required' });
      }

      const result = await whatsappService.sendMessage(to, message);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get chats
  router.get('/chats', async (req, res) => {
    try {
      const chats = await whatsappService.getChats();
      res.json(chats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Clear WhatsApp session
  router.delete('/session', async (req, res) => {
    try {
      const result = await whatsappService.clearSession();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
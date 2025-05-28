const express = require('express');
const OpenAIService = require('../services/openaiService');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

module.exports = (whatsappService) => {
  const openaiService = new OpenAIService();

  // Get AI provider configuration
  router.get('/provider', (req, res) => {
    try {
      const config = {
        currentProvider: process.env.AI_PROVIDER || 'openai',
        availableProviders: ['openai', 'openrouter', 'gemini'],
        providerConfig: {
          openai: {
            hasApiKey: !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here'),
            model: 'gpt-4o-mini'
          },
          openrouter: {
            hasApiKey: !!(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'your-openrouter-api-key-here'),
            model: process.env.OPENROUTER_MODEL_NAME || 'openai/gpt-3.5-turbo'
          },
          gemini: {
            hasApiKey: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here'),
            model: 'gemini-2.0-flash'
          }
        }
      };
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update AI provider (with hot reload option)
  router.put('/provider', async (req, res) => {
    try {
      const { provider, hotReload = false } = req.body;
      const validProviders = ['openai', 'openrouter', 'gemini'];
      
      if (!provider || !validProviders.includes(provider)) {
        return res.status(400).json({ 
          error: 'Valid provider is required', 
          validProviders 
        });
      }

      // Update .env file
      const envPath = path.join(process.cwd(), '.env');
      
      try {
        // Read current .env file
        let envContent = await fs.readFile(envPath, 'utf8');
        
        // Update AI_PROVIDER line
        const providerRegex = /^AI_PROVIDER=.*$/m;
        const newProviderLine = `AI_PROVIDER=${provider}`;
        
        if (providerRegex.test(envContent)) {
          // Replace existing AI_PROVIDER line
          envContent = envContent.replace(providerRegex, newProviderLine);
        } else {
          // Add AI_PROVIDER line if it doesn't exist
          envContent += `\n${newProviderLine}\n`;
        }
        
        // Write back to .env file
        await fs.writeFile(envPath, envContent, 'utf8');
        
        // Update process.env for immediate effect
        process.env.AI_PROVIDER = provider;
        
        // Hot reload if whatsappService is available and hotReload is true
        let reloadSuccess = false;
        if (hotReload && whatsappService && whatsappService.reloadAIProvider) {
          try {
            reloadSuccess = whatsappService.reloadAIProvider();
          } catch (reloadError) {
            console.error('Hot reload failed:', reloadError);
          }
        }
        
        res.json({ 
          message: reloadSuccess 
            ? `AI provider updated to ${provider} and reloaded successfully! No restart required.`
            : `AI provider updated to ${provider}. Please restart the server to fully apply changes to WhatsApp service.`,
          success: true,
          requiresRestart: !reloadSuccess,
          provider,
          envUpdated: true,
          hotReloaded: reloadSuccess
        });
        
      } catch (fileError) {
        console.error('Error updating .env file:', fileError);
        res.status(500).json({ 
          error: 'Failed to update .env file: ' + fileError.message,
          success: false 
        });
      }
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // New route for hot reload only (without updating .env)
  router.post('/provider/reload', async (req, res) => {
    try {
      if (!whatsappService || !whatsappService.reloadAIProvider) {
        return res.status(500).json({
          error: 'WhatsApp service not available for hot reload',
          success: false
        });
      }

      const reloadSuccess = whatsappService.reloadAIProvider();
      
      if (reloadSuccess) {
        res.json({
          message: 'AI provider configuration reloaded successfully!',
          success: true,
          currentProvider: process.env.AI_PROVIDER || 'openai',
          timestamp: new Date()
        });
      } else {
        res.status(500).json({
          error: 'Failed to reload AI provider configuration',
          success: false
        });
      }
    } catch (error) {
      res.status(500).json({ 
        error: 'Error during hot reload: ' + error.message,
        success: false 
      });
    }
  });

  // Get system prompt
  router.get('/prompt', (req, res) => {
    try {
      const prompt = openaiService.getSystemPrompt();
      res.json({ prompt });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update system prompt
  router.put('/prompt', async (req, res) => {
    try {
      const { prompt, hotReload = false } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const success = await openaiService.updateSystemPrompt(prompt);
      
      if (success) {
        // Hot reload if whatsappService is available and hotReload is true
        let reloadSuccess = false;
        if (hotReload && whatsappService && whatsappService.reloadSystemPrompt) {
          try {
            reloadSuccess = whatsappService.reloadSystemPrompt();
          } catch (reloadError) {
            console.error('Hot reload failed:', reloadError);
          }
        }
        
        res.json({ 
          message: reloadSuccess 
            ? 'System prompt updated and reloaded successfully! No restart required.'
            : 'System prompt updated successfully',
          success: true,
          hotReloaded: reloadSuccess
        });
      } else {
        res.status(500).json({ error: 'Failed to update system prompt' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Hot reload system prompt only (without updating file)
  router.post('/prompt/reload', async (req, res) => {
    try {
      if (!whatsappService || !whatsappService.reloadSystemPrompt) {
        return res.status(500).json({
          error: 'WhatsApp service not available for hot reload',
          success: false
        });
      }

      const reloadSuccess = whatsappService.reloadSystemPrompt();
      
      if (reloadSuccess) {
        res.json({
          message: 'System prompt reloaded successfully from file!',
          success: true,
          timestamp: new Date()
        });
      } else {
        res.status(500).json({
          error: 'Failed to reload system prompt',
          success: false
        });
      }
    } catch (error) {
      res.status(500).json({ 
        error: 'Error during prompt reload: ' + error.message,
        success: false 
      });
    }
  });

  // Get blacklist words
  router.get('/blacklist', (req, res) => {
    try {
      const blacklistWords = openaiService.getBlacklistWords();
      const stats = openaiService.getBlacklistStats();
      res.json({ 
        blacklistWords,
        ...stats
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update blacklist words
  router.put('/blacklist', async (req, res) => {
    try {
      const { blacklistWords } = req.body;
      
      if (blacklistWords === undefined) {
        return res.status(400).json({ error: 'Blacklist words are required' });
      }

      const success = await openaiService.updateBlacklistWords(blacklistWords);
      
      if (success) {
        res.json({ message: 'Blacklist words updated successfully', success: true });
      } else {
        res.status(500).json({ error: 'Failed to update blacklist words' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Test blacklist check
  router.post('/blacklist/test', (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const result = openaiService.isMessageBlacklisted(message);
      res.json({ 
        message,
        isBlocked: result.blocked,
        reason: result.reason || null,
        blockedWord: result.word || null
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Generate AI response (for testing)
  router.post('/generate', async (req, res) => {
    try {
      const { message, userId = 'test-user' } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const response = await openaiService.generateResponse(message, userId);
      
      if (response === null) {
        res.json({ 
          blocked: true, 
          message: 'Message contains blacklisted words and was blocked',
          success: true 
        });
      } else {
        res.json({ response, blocked: false, success: true });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Clear conversation history for a user
  router.delete('/conversation/:userId', (req, res) => {
    try {
      const { userId } = req.params;
      const success = openaiService.clearConversationHistory(userId);
      
      if (success) {
        res.json({ message: 'Conversation history cleared', success: true });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get conversation statistics
  router.get('/stats', (req, res) => {
    try {
      const stats = openaiService.getConversationStats();
      const conversations = openaiService.getAllConversations();
      const blacklistStats = openaiService.getBlacklistStats();
      
      res.json({
        stats,
        conversations,
        blacklist: blacklistStats
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
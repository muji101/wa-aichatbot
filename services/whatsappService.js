const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs').promises;
const path = require('path');
const OpenAIService = require('./openaiService');
const { OpenAI } = require('openai'); // Added for OpenRouter
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Added for Gemini

class WhatsAppService {
  constructor(io) {
    this.io = io;
    this.sock = null;
    this.isReady = false;
    this.openaiService = new OpenAIService();
    this.sessionPath = process.env.SESSION_FILE_PATH || './session/baileys-auth';

    // Initialize AI providers
    this.initializeAIProviders();
  }

  initializeAIProviders() {
    // AI Provider Configuration
    this.aiProvider = (process.env.AI_PROVIDER || 'openai').toLowerCase();
    
    // Reset all clients
    this.openRouterClient = null;
    this.geminiClient = null;
    
    // OpenRouter Configuration
    if (this.aiProvider === 'openrouter') {
      this.openRouterApiKey = process.env.OPENROUTER_API_KEY;
      this.openRouterModel = process.env.OPENROUTER_MODEL_NAME || 'openai/gpt-3.5-turbo';
      if (this.openRouterApiKey) {
        this.openRouterClient = new OpenAI({
          apiKey: this.openRouterApiKey,
          baseURL: 'https://openrouter.ai/api/v1',
        });
        console.log('🔄 OpenRouter Service configured.');
      } else {
        console.warn('⚠️ OpenRouter API key not provided. OpenRouter will not be available.');
      }
    }

    // Gemini Configuration
    if (this.aiProvider === 'gemini') {
      this.geminiApiKey = process.env.GEMINI_API_KEY;
      if (this.geminiApiKey) {
        this.geminiClient = new GoogleGenerativeAI(this.geminiApiKey).getGenerativeModel({ model: "gemini-pro" });
        console.log('🔄 Gemini Service configured.');
      } else {
        console.warn('⚠️ Gemini API key not provided. Gemini will not be available.');
      }
    }
    console.log(`🤖 Current AI Provider: ${this.aiProvider}`);
  }

  // New method to reload AI provider configuration
  reloadAIProvider() {
    console.log('🔄 Reloading AI Provider configuration...');
    
    // Re-read environment variables
    require('dotenv').config();
    
    // Reinitialize AI providers with new config
    this.initializeAIProviders();
    
    // Emit update to connected clients
    this.io.emit('ai-provider-reloaded', {
      newProvider: this.aiProvider,
      timestamp: new Date(),
      message: `AI Provider switched to ${this.aiProvider}`
    });
    
    console.log(`✅ AI Provider reloaded successfully: ${this.aiProvider}`);
    return true;
  }

  // New method to reload system prompt
  reloadSystemPrompt() {
    console.log('🔄 Reloading System Prompt configuration...');
    
    try {
      // Reload system prompt in openaiService
      this.openaiService.reloadSystemPrompt();
      
      // Emit update to connected clients
      this.io.emit('system-prompt-reloaded', {
        timestamp: new Date(),
        message: 'System prompt reloaded successfully'
      });
      
      console.log('✅ System Prompt reloaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to reload system prompt:', error);
      return false;
    }
  }

  async initialize() {
    console.log('🔄 Initializing WhatsApp client with Baileys...');
    
    try {
      // Create session directory if it doesn't exist
      await fs.mkdir(this.sessionPath, { recursive: true });
      
      // Use multi-file auth state
      const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);
      
      // Create a proper logger object with child method
      const logger = {
        level: 'silent',
        child: () => logger,
        trace: () => {},
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
        fatal: () => {}
      };
      
      // Create socket connection
      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // We'll handle QR display ourselves
        logger: logger
      });

      // Setup event handlers
      this.setupEventHandlers(saveCreds);
      
    } catch (error) {
      console.error('❌ Error initializing WhatsApp client:', error);
      this.io.emit('error', { message: 'Failed to initialize WhatsApp client', error: error.message });
    }
  }

  setupEventHandlers(saveCreds) {
    // Connection update event
    this.sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        console.log('📱 QR Code received, scan with your phone:');
        qrcode.generate(qr, { small: true });
        this.io.emit('qr-code', qr);
      }
      
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('📱 Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
        
        this.isReady = false;
        this.io.emit('whatsapp-disconnected', { 
          reason: lastDisconnect?.error?.output?.statusCode,
          shouldReconnect 
        });
        
        // Reconnect if not logged out
        if (shouldReconnect) {
          setTimeout(() => {
            this.initialize();
          }, 3000);
        }
      } else if (connection === 'open') {
        console.log('✅ WhatsApp client is ready!');
        this.isReady = true;
        this.io.emit('whatsapp-ready', { status: 'ready' });
      }
    });

    // Credentials update event
    this.sock.ev.on('creds.update', saveCreds);

    // Messages event
    this.sock.ev.on('messages.upsert', async (m) => {
      const message = m.messages[0];
      if (!message.message || message.key.fromMe) return;
      
      await this.handleMessage(message);
    });
  }

  async handleMessage(message) {
    try {
      const messageText = this.extractMessageText(message);
      const senderId = message.key.remoteJid;
      const isGroup = senderId.includes('@g.us');
      const senderNumber = message.key.participant || senderId;
      
      // Emit received message to web clients
      this.io.emit('message-received', {
        from: senderId,
        body: messageText,
        timestamp: new Date(),
        isGroup: isGroup
      });

      // Skip if message is from status broadcast
      if (senderId === 'status@broadcast') {
        return;
      }

      console.log(`📨 Message from ${senderNumber}: ${messageText}`);

      // Process with AI if message is not empty
      if (messageText && messageText.trim()) {
        await this.processWithAI(message, messageText, senderNumber, senderId);
      }

    } catch (error) {
      console.error('❌ Error handling message:', error);
      this.io.emit('error', { message: 'Error handling message', error: error.message });
    }
  }

  extractMessageText(message) {
    const messageContent = message.message;
    
    if (messageContent.conversation) {
      return messageContent.conversation;
    } else if (messageContent.extendedTextMessage) {
      return messageContent.extendedTextMessage.text;
    } else if (messageContent.imageMessage && messageContent.imageMessage.caption) {
      return messageContent.imageMessage.caption;
    } else if (messageContent.videoMessage && messageContent.videoMessage.caption) {
      return messageContent.videoMessage.caption;
    }
    
    return '';
  }

  async processWithAI(message, messageText, senderNumber, chatId) {
    try {
      // Show typing indicator
      await this.sock.sendPresenceUpdate('composing', chatId);

      let aiResponse;
      const senderName = senderNumber.replace('@s.whatsapp.net', '');

      // Use the configured AI provider
      switch (this.aiProvider) {
        case 'openrouter':
          if (!this.openRouterClient) {
            throw new Error('OpenRouter client not initialized. Check API key.');
          }
          aiResponse = await this.generateOpenRouterResponse(messageText, senderName);
          break;
        case 'gemini':
          if (!this.geminiClient) {
            throw new Error('Gemini client not initialized. Check API key.');
          }
          aiResponse = await this.generateGeminiResponse(messageText, senderName);
          break;
        case 'openai':
        default:
          aiResponse = await this.openaiService.generateResponse(messageText, senderName);
          break;
      }

      // If response is null, it means message was blacklisted - don't send any response
      if (aiResponse === null) {
        this.io.emit('message-blocked', {
          from: chatId,
          message: messageText,
          contact: senderName,
          timestamp: new Date()
        });
        
        console.log(`🚫 Message blocked from ${senderName} by ${this.aiProvider} - no response sent`);
        return;
      }

      // Additional WhatsApp-specific formatting
      const whatsappOptimizedResponse = this.optimizeForWhatsApp(aiResponse);

      // Send response
      await this.sock.sendMessage(chatId, { text: whatsappOptimizedResponse });

      // Clear typing indicator
      await this.sock.sendPresenceUpdate('available', chatId);

      // Emit AI response to web clients
      this.io.emit('ai-response', {
        to: chatId,
        originalMessage: messageText,
        response: whatsappOptimizedResponse,
        provider: this.aiProvider,
        timestamp: new Date()
      });

      console.log(`🤖 ${this.aiProvider} Response sent to ${senderName}`);

    } catch (error) {
      console.error(`❌ Error processing with ${this.aiProvider} AI:`, error);
      await this.sock.sendMessage(chatId, { 
        text: 'Maaf, terjadi kesalahan saat memproses pesan Anda dengan AI. Silakan coba lagi nanti.' 
      });
    }
  }

  async generateOpenRouterResponse(text, senderName) {
    // Reuse blacklist check from openaiService
    const blacklistCheck = this.openaiService.isMessageBlacklisted(text);
    if (blacklistCheck.blocked) {
      console.log(`🚫 Message from ${senderName} blacklisted by OpenRouter service: ${blacklistCheck.word}`);
      return null;
    }

    try {
      const systemMessageContent = this.openaiService.getSystemPrompt() || "You are a helpful assistant.";
      
      const messages = [
        { role: "system", content: systemMessageContent },
        { role: "user", content: `Message from ${senderName}: ${text}` }
      ];
      
      console.log(`🔄 Sending to OpenRouter (${this.openRouterModel}): ${text}`);
      const completion = await this.openRouterClient.chat.completions.create({
        model: this.openRouterModel,
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      });
      
      const responseText = completion.choices[0]?.message?.content?.trim();
      if (!responseText) {
        console.warn('⚠️ OpenRouter returned an empty response.');
        return 'Maaf, saya tidak bisa memberikan respons saat ini.';
      }
      console.log(`💬 OpenRouter Response: ${responseText}`);
      return responseText;
    } catch (error) {
      console.error('❌ Error with OpenRouter API:', error.response ? error.response.data : error.message);
      
      if (error.status === 401) {
        return 'Maaf, OpenRouter API key tidak valid. Silakan periksa konfigurasi.';
      } else if (error.status === 429) {
        return 'Maaf, terlalu banyak permintaan ke OpenRouter. Silakan coba lagi nanti.';
      } else {
        return 'Maaf, terjadi masalah saat menghubungi layanan OpenRouter.';
      }
    }
  }

  async generateGeminiResponse(text, senderName) {
    // Reuse blacklist check from openaiService
    const blacklistCheck = this.openaiService.isMessageBlacklisted(text);
    if (blacklistCheck.blocked) {
      console.log(`🚫 Message from ${senderName} blacklisted by Gemini service: ${blacklistCheck.word}`);
      return null;
    }

    try {
      const systemInstruction = this.openaiService.getSystemPrompt() || "You are a helpful assistant.";
      
      // Create a more appropriate prompt for Gemini
      const fullPrompt = `${systemInstruction}\n\nUser (${senderName}): ${text}\n\nAssistant:`;
      
      console.log(`🔄 Sending to Gemini: ${text}`);
      
      const result = await this.geminiClient.generateContent(fullPrompt);
      const response = await result.response;
      const responseText = response.text()?.trim();

      if (!responseText) {
        console.warn('⚠️ Gemini returned an empty response.');
        return 'Maaf, saya tidak bisa memberikan respons saat ini.';
      }
      console.log(`💬 Gemini Response: ${responseText}`);
      return responseText;
    } catch (error) {
      console.error('❌ Error with Gemini API:', error);
      
      if (error.message?.includes('API_KEY_INVALID')) {
        return 'Maaf, Gemini API key tidak valid. Silakan periksa konfigurasi.';
      } else if (error.message?.includes('QUOTA_EXCEEDED')) {
        return 'Maaf, kuota Gemini API sudah habis. Silakan periksa billing account.';
      } else if (error.message?.includes('SAFETY')) {
        return 'Maaf, pesan Anda tidak dapat diproses karena alasan keamanan.';
      } else {
        return 'Maaf, terjadi masalah saat menghubungi layanan Gemini.';
      }
    }
  }

  // Optimize message format specifically for WhatsApp
  optimizeForWhatsApp(text) {
    if (!text) return text;

    let optimized = text;

    // Split long messages to prevent truncation (WhatsApp limit ~4096 chars)
    if (optimized.length > 4000) {
      // Find a good breaking point (preferably at sentence end)
      let breakPoint = optimized.lastIndexOf('.', 4000);
      if (breakPoint === -1) {
        breakPoint = optimized.lastIndexOf(' ', 4000);
      }
      if (breakPoint === -1) {
        breakPoint = 4000;
      }
      
      const firstPart = optimized.substring(0, breakPoint + 1).trim();
      const secondPart = optimized.substring(breakPoint + 1).trim();
      
      optimized = firstPart + '\n\n*[Lanjutan...]*\n\n' + secondPart;
    }

    // JANGAN manipulasi text formatting - biarkan asli untuk preservasi emoji dan bold text
    // Hanya trim whitespace di awal dan akhir
    return optimized.trim();
  }

  async sendMessage(to, message) {
    if (!this.isReady) {
      throw new Error('WhatsApp client is not ready');
    }

    try {
      const chatId = to.includes('@') ? to : `${to}@s.whatsapp.net`;
      
      // Apply WhatsApp formatting to outgoing messages too
      const formattedMessage = this.optimizeForWhatsApp(message);
      
      await this.sock.sendMessage(chatId, { text: formattedMessage });
      
      this.io.emit('message-sent', {
        to: chatId,
        body: formattedMessage,
        timestamp: new Date()
      });

      return { success: true, message: 'Message sent successfully' };
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  }

  async getChats() {
    if (!this.isReady) {
      throw new Error('WhatsApp client is not ready');
    }

    try {
      // Note: Baileys doesn't have a direct getChats method like whatsapp-web.js
      // You'll need to implement chat storage if needed
      console.log('ℹ️ Baileys doesn\'t provide chat list directly. Implement if needed.');
      return [];
    } catch (error) {
      console.error('❌ Error getting chats:', error);
      throw error;
    }
  }

  getStatus() {
    return {
      isReady: this.isReady,
      hasClient: !!this.sock
    };
  }

  async destroy() {
    if (this.sock) {
      console.log('🔄 Destroying WhatsApp client...');
      this.sock.end();
      this.sock = null;
      this.isReady = false;
      this.io.emit('whatsapp-destroyed');
      console.log('✅ WhatsApp client destroyed');
    }
  }

  async clearSession() {
    try {
      console.log('🔄 Clearing WhatsApp session...');
      
      // First destroy the client if it exists
      if (this.sock) {
        console.log('🔄 Destroying existing client...');
        await this.destroy();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Remove session directory
      console.log(`🔍 Checking session directory: ${this.sessionPath}`);
      
      if (await this.directoryExists(this.sessionPath)) {
        console.log('📂 Session directory found, removing...');
        await this.removeDirectory(this.sessionPath);
        console.log('✅ Session directory cleared successfully');
        
        this.io.emit('session-cleared', { 
          success: true, 
          message: 'Session cleared successfully' 
        });
        
        return { success: true, message: 'Session cleared successfully' };
      } else {
        console.log('ℹ️ No session directory found');
        this.io.emit('session-cleared', { 
          success: true, 
          message: 'No session found to clear' 
        });
        
        return { success: true, message: 'No session found to clear' };
      }
      
    } catch (error) {
      console.error('❌ Error clearing session:', error);
      this.io.emit('session-clear-error', { 
        error: error.message 
      });
      return { success: false, message: error.message };
    }
  }

  async directoryExists(dirPath) {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  }

  async removeDirectory(dirPath) {
    try {
      console.log(`🗑️ Removing directory: ${dirPath}`);
      
      // Use recursive option with fs.rm (newer Node.js method)
      if (fs.rm) {
        await fs.rm(dirPath, { recursive: true, force: true });
      } else {
        // Fallback for older Node.js versions
        await this.removeDirectoryRecursive(dirPath);
      }
      
      console.log(`✅ Directory removed: ${dirPath}`);
    } catch (error) {
      console.error(`❌ Error removing directory ${dirPath}:`, error);
      
      // Try alternative method if first method fails
      if (error.code === 'EBUSY' || error.code === 'ENOTEMPTY') {
        console.log('🔄 Retrying with alternative method...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
          await this.removeDirectoryRecursive(dirPath);
          console.log(`✅ Directory removed with alternative method: ${dirPath}`);
        } catch (retryError) {
          console.error(`❌ Alternative method also failed:`, retryError);
          throw retryError;
        }
      } else {
        throw error;
      }
    }
  }

  async removeDirectoryRecursive(dirPath) {
    try {
      const files = await fs.readdir(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        
        try {
          const stats = await fs.stat(filePath);
          
          if (stats.isDirectory()) {
            await this.removeDirectoryRecursive(filePath);
          } else {
            await fs.unlink(filePath);
          }
        } catch (fileError) {
          console.warn(`⚠️ Warning: Could not remove ${filePath}:`, fileError.message);
          // Continue with other files even if one fails
        }
      }
      
      // Remove the directory itself
      await fs.rmdir(dirPath);
    } catch (error) {
      console.error(`❌ Error in removeDirectoryRecursive for ${dirPath}:`, error);
      throw error;
    }
  }
}

module.exports = WhatsAppService;
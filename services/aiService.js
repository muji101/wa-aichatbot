const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

class AIService {
  constructor() {
    this.currentProvider = process.env.AI_PROVIDER || 'openai'; // openai, openrouter, gemini
    this.conversationHistory = new Map();
    this.systemPromptPath = path.join(__dirname, '../config/system-prompt.txt');
    this.blacklistPath = path.join(__dirname, '../config/blacklist-words.txt');
    this.blacklistWords = [];
    
    this.initializeProviders();
    this.loadSystemPrompt();
    this.loadBlacklistWords();
  }

  initializeProviders() {
    // OpenAI Client
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }

    // OpenRouter Client (uses OpenAI-compatible API)
    if (process.env.OPENROUTER_API_KEY) {
      this.openrouter = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: process.env.OPENROUTER_API_KEY,
        defaultHeaders: {
          'HTTP-Referer': process.env.OPENROUTER_REFERER || 'http://localhost:3000',
          'X-Title': process.env.OPENROUTER_TITLE || 'WhatsApp AI Bot'
        }
      });
    }

    // Gemini Client
    if (process.env.GEMINI_API_KEY) {
      this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.geminiModel = this.gemini.getGenerativeModel({ 
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' 
      });
    }

    console.log(`🤖 AI Service initialized with provider: ${this.currentProvider}`);
  }

  async loadSystemPrompt() {
    try {
      if (await fs.pathExists(this.systemPromptPath)) {
        this.systemPrompt = await fs.readFile(this.systemPromptPath, 'utf8');
        console.log('📝 System prompt loaded from file');
      } else {
        this.systemPrompt = process.env.SYSTEM_PROMPT || 
          'Kamu adalah asisten AI WhatsApp yang ramah dan membantu. Jawab pertanyaan dengan bahasa Indonesia yang santai dan informatif.';
        
        await this.saveSystemPrompt(this.systemPrompt);
        console.log('📝 System prompt loaded from environment and saved to file');
      }
    } catch (error) {
      console.error('❌ Error loading system prompt:', error);
      this.systemPrompt = 'Kamu adalah asisten AI WhatsApp yang ramah dan membantu.';
    }
  }

  async saveSystemPrompt(prompt) {
    try {
      await fs.ensureDir(path.dirname(this.systemPromptPath));
      await fs.writeFile(this.systemPromptPath, prompt, 'utf8');
      this.systemPrompt = prompt;
      console.log('✅ System prompt saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Error saving system prompt:', error);
      return false;
    }
  }

  async updateSystemPrompt(newPrompt) {
    return await this.saveSystemPrompt(newPrompt);
  }

  getSystemPrompt() {
    return this.systemPrompt;
  }

  async loadBlacklistWords() {
    try {
      if (await fs.pathExists(this.blacklistPath)) {
        const content = await fs.readFile(this.blacklistPath, 'utf8');
        this.blacklistWords = content.toLowerCase()
          .split(',')
          .map(word => word.trim())
          .filter(word => word.length > 0);
        console.log(`🚫 Loaded ${this.blacklistWords.length} blacklist words`);
      } else {
        const envBlacklist = process.env.BLACKLIST_WORDS || '';
        this.blacklistWords = envBlacklist.toLowerCase()
          .split(',')
          .map(word => word.trim())
          .filter(word => word.length > 0);
        
        if (this.blacklistWords.length > 0) {
          await this.saveBlacklistWords(this.blacklistWords.join(','));
        }
        console.log(`🚫 Blacklist loaded from environment: ${this.blacklistWords.length} words`);
      }
    } catch (error) {
      console.error('❌ Error loading blacklist words:', error);
      this.blacklistWords = [];
    }
  }

  async saveBlacklistWords(wordsString) {
    try {
      await fs.ensureDir(path.dirname(this.blacklistPath));
      const words = wordsString.toLowerCase()
        .split(',')
        .map(word => word.trim())
        .filter(word => word.length > 0);
      
      await fs.writeFile(this.blacklistPath, words.join(','), 'utf8');
      this.blacklistWords = words;
      console.log(`✅ Blacklist updated: ${words.length} words`);
      return true;
    } catch (error) {
      console.error('❌ Error saving blacklist words:', error);
      return false;
    }
  }

  async updateBlacklistWords(wordsString) {
    return await this.saveBlacklistWords(wordsString);
  }

  getBlacklistWords() {
    return this.blacklistWords.join(',');
  }

  isMessageBlacklisted(message) {
    if (!message || this.blacklistWords.length === 0) {
      return false;
    }

    const messageWords = message.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);

    for (const blackWord of this.blacklistWords) {
      if (messageWords.includes(blackWord)) {
        console.log(`🚫 Message blocked: contains blacklisted word "${blackWord}"`);
        return { blocked: true, word: blackWord, reason: 'exact_match' };
      }
    }

    const messageText = message.toLowerCase();
    for (const blackWord of this.blacklistWords) {
      if (messageText.includes(blackWord)) {
        console.log(`🚫 Message blocked: contains blacklisted term "${blackWord}"`);
        return { blocked: true, word: blackWord, reason: 'partial_match' };
      }
    }

    return { blocked: false };
  }

  convertToWhatsAppFormat(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '*$1*')
      .replace(/__(.*?)__/g, '_$1_')
      .replace(/~~(.*?)~~/g, '~$1~')
      .replace(/`([^`]+)`/g, '```$1```')
      .replace(/^### (.*$)/gm, '*$1*')
      .replace(/^## (.*$)/gm, '*$1*')
      .replace(/^# (.*$)/gm, '*$1*')
      .replace(/^\* (.*$)/gm, '• $1')
      .replace(/^- (.*$)/gm, '• $1')
      .replace(/^\d+\. (.*$)/gm, '$&');
  }

  async generateResponse(message, phoneNumber, options = {}) {
    try {
      const blacklistCheck = this.isMessageBlacklisted(message);
      if (blacklistCheck.blocked) {
        return {
          success: false,
          error: 'Message contains prohibited content',
          blocked: true,
          blockedWord: blacklistCheck.word
        };
      }

      // Get conversation history
      let conversation = this.conversationHistory.get(phoneNumber) || [];
      
      // Add user message to conversation
      conversation.push({ role: 'user', content: message });

      let response;
      switch (this.currentProvider) {
        case 'openai':
          response = await this.generateOpenAIResponse(conversation, options);
          break;
        case 'openrouter':
          response = await this.generateOpenRouterResponse(conversation, options);
          break;
        case 'gemini':
          response = await this.generateGeminiResponse(conversation, options);
          break;
        default:
          throw new Error(`Unsupported AI provider: ${this.currentProvider}`);
      }

      // Add assistant response to conversation
      conversation.push({ role: 'assistant', content: response });

      // Keep only last 10 messages to manage memory
      if (conversation.length > 20) {
        conversation = conversation.slice(-20);
      }

      // Update conversation history
      this.conversationHistory.set(phoneNumber, conversation);

      return {
        success: true,
        response: this.convertToWhatsAppFormat(response),
        provider: this.currentProvider
      };

    } catch (error) {
      console.error(`❌ Error generating AI response with ${this.currentProvider}:`, error);
      return {
        success: false,
        error: error.message,
        provider: this.currentProvider
      };
    }
  }

  async generateOpenAIResponse(conversation, options = {}) {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Please check OPENAI_API_KEY.');
    }

    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...conversation
    ];

    const response = await this.openai.chat.completions.create({
      model: options.model || process.env.OPENAI_MODEL || 'gpt-4o-mini-2024-07-18',
      messages: messages,
      max_tokens: options.maxTokens || parseInt(process.env.MAX_TOKENS) || 1000,
      temperature: options.temperature || parseFloat(process.env.TEMPERATURE) || 0.7,
    });

    return response.choices[0].message.content;
  }

  async generateOpenRouterResponse(conversation, options = {}) {
    if (!this.openrouter) {
      throw new Error('OpenRouter client not initialized. Please check OPENROUTER_API_KEY.');
    }

    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...conversation
    ];

    const response = await this.openrouter.chat.completions.create({
      model: options.model || process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini-2024-07-18',
      messages: messages,
      max_tokens: options.maxTokens || parseInt(process.env.MAX_TOKENS) || 1000,
      temperature: options.temperature || parseFloat(process.env.TEMPERATURE) || 0.7,
    });

    return response.choices[0].message.content;
  }

  async generateGeminiResponse(conversation, options = {}) {
    if (!this.gemini || !this.geminiModel) {
      throw new Error('Gemini client not initialized. Please check GEMINI_API_KEY.');
    }

    // Convert conversation to Gemini format
    const chatHistory = conversation.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const currentMessage = conversation[conversation.length - 1].content;

    // Start chat with history
    const chat = this.geminiModel.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: options.maxTokens || parseInt(process.env.MAX_TOKENS) || 1000,
        temperature: options.temperature || parseFloat(process.env.TEMPERATURE) || 0.7,
      },
    });

    // Add system prompt context to the first message if no history
    const prompt = chatHistory.length === 0 
      ? `${this.systemPrompt}\n\nUser: ${currentMessage}`
      : currentMessage;

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    return response.text();
  }

  setProvider(provider) {
    const validProviders = ['openai', 'openrouter', 'gemini'];
    if (!validProviders.includes(provider)) {
      throw new Error(`Invalid provider. Must be one of: ${validProviders.join(', ')}`);
    }
    
    this.currentProvider = provider;
    console.log(`🔄 AI provider switched to: ${provider}`);
  }

  getCurrentProvider() {
    return this.currentProvider;
  }

  getAvailableProviders() {
    const providers = [];
    if (this.openai) providers.push('openai');
    if (this.openrouter) providers.push('openrouter');
    if (this.gemini) providers.push('gemini');
    return providers;
  }

  clearConversationHistory(phoneNumber) {
    if (phoneNumber) {
      this.conversationHistory.delete(phoneNumber);
      console.log(`🗑️ Conversation history cleared for ${phoneNumber}`);
    } else {
      this.conversationHistory.clear();
      console.log('🗑️ All conversation history cleared');
    }
  }

  getConversationHistory(phoneNumber) {
    return this.conversationHistory.get(phoneNumber) || [];
  }

  // Get provider status and configuration
  getProviderStatus() {
    return {
      current: this.currentProvider,
      available: this.getAvailableProviders(),
      configs: {
        openai: {
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini-2024-07-18',
          configured: !!this.openai
        },
        openrouter: {
          model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini-2024-07-18',
          configured: !!this.openrouter
        },
        gemini: {
          model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
          configured: !!this.gemini
        }
      }
    };
  }
}

module.exports = AIService;
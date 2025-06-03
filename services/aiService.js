const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const ProductService = require('./productService');

// Constants for better maintainability
const DEFAULT_SYSTEM_PROMPT = 'Kamu adalah asisten AI WhatsApp yang ramah dan membantu. Jawab pertanyaan dengan bahasa Indonesia yang santai dan informatif.';
const MAX_CONVERSATION_LENGTH = 20;
const DEFAULT_CONFIG = {
  maxTokens: 1000,
  temperature: 0.7,
  models: {
    openai: 'gpt-4o-mini-2024-07-18',
    openrouter: 'openai/gpt-4o-mini-2024-07-18',
    gemini: 'gemini-2.0-flash'
  }
};

class AIService {
  constructor() {
    this.currentProvider = process.env.AI_PROVIDER || 'openai';
    this.conversationHistory = new Map();
    this.systemPromptPath = path.join(__dirname, '../config/system-prompt.txt');
    this.blacklistPath = path.join(__dirname, '../config/blacklist-words.txt');
    this.blacklistWords = [];
    this.productService = new ProductService();
    
    this._initializeService();
  }

  async _initializeService() {
    try {
      this.initializeProviders();
      await this.loadSystemPrompt();
      await this.loadBlacklistWords();
      console.log(`🤖 AI Service initialized with provider: ${this.currentProvider}`);
    } catch (error) {
      console.error('❌ Error initializing AI Service:', error);
      throw error;
    }
  }

  initializeProviders() {
    const providers = {
      openai: () => this._initializeOpenAI(),
      openrouter: () => this._initializeOpenRouter(),
      gemini: () => this._initializeGemini()
    };

    Object.entries(providers).forEach(([provider, initializer]) => {
      try {
        initializer();
      } catch (error) {
        console.warn(`⚠️ Failed to initialize ${provider}:`, error.message);
      }
    });
  }

  _initializeOpenAI() {
    if (!process.env.OPENAI_API_KEY) return;
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  _initializeOpenRouter() {
    if (!process.env.OPENROUTER_API_KEY) return;
    
    this.openrouter = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.OPENROUTER_REFERER || 'http://localhost:3000',
        'X-Title': process.env.OPENROUTER_TITLE || 'WhatsApp AI Bot'
      }
    });
  }

  _initializeGemini() {
    if (!process.env.GEMINI_API_KEY) return;
    
    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.geminiModel = this.gemini.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || DEFAULT_CONFIG.models.gemini 
    });
  }

  async loadSystemPrompt() {
    try {
      if (await fs.pathExists(this.systemPromptPath)) {
        this.systemPrompt = await fs.readFile(this.systemPromptPath, 'utf8');
        console.log('📝 System prompt loaded from file');
      } else {
        this.systemPrompt = process.env.SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT;
        
        await this.saveSystemPrompt(this.systemPrompt);
        console.log('📝 System prompt loaded from environment and saved to file');
      }
    } catch (error) {
      console.error('❌ Error loading system prompt:', error);
      this.systemPrompt = DEFAULT_SYSTEM_PROMPT;
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

  // Helper methods for cleaner code organization
  _parseWordsFromString(wordsString) {
    return wordsString.toLowerCase()
      .split(',')
      .map(word => word.trim())
      .filter(word => word.length > 0);
  }

  _checkExactWordMatch(messageWords, blacklistWords) {
    for (const blackWord of blacklistWords) {
      if (messageWords.includes(blackWord)) {
        return { blocked: true, word: blackWord, reason: 'exact_match' };
      }
    }
    return null;
  }

  _checkPartialWordMatch(message, blacklistWords) {
    const messageText = message.toLowerCase();
    for (const blackWord of blacklistWords) {
      if (messageText.includes(blackWord)) {
        return { blocked: true, word: blackWord, reason: 'partial_match' };
      }
    }
    return null;
  }

  _normalizeMessageForBlacklist(message) {
    return message.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  isMessageBlacklisted(message) {
    if (!message || this.blacklistWords.length === 0) {
      return { blocked: false };
    }

    const messageWords = this._normalizeMessageForBlacklist(message);
    
    // Check exact word matches first
    const exactMatch = this._checkExactWordMatch(messageWords, this.blacklistWords);
    if (exactMatch) {
      console.log(`🚫 Message blocked: contains blacklisted word "${exactMatch.word}"`);
      return exactMatch;
    }

    // Check partial matches
    const partialMatch = this._checkPartialWordMatch(message, this.blacklistWords);
    if (partialMatch) {
      console.log(`🚫 Message blocked: contains blacklisted term "${partialMatch.word}"`);
      return partialMatch;
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
      if (conversation.length > MAX_CONVERSATION_LENGTH) {
        conversation = conversation.slice(-MAX_CONVERSATION_LENGTH);
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

    // Get the latest user message for product context
    const latestMessage = conversation[conversation.length - 1]?.content || '';
    const productContext = this.getEnhancedProductContext(latestMessage);
    
    // Enhance system prompt with product information if relevant
    let enhancedSystemPrompt = this.systemPrompt;
    if (productContext) {
      enhancedSystemPrompt += productContext;
      enhancedSystemPrompt += '\n\nGunakan informasi produk di atas untuk menjawab pertanyaan user secara natural dan informatif. Jangan terdengar seperti robot - berikan respons yang ramah dan membantu.';
    }

    const messages = [
      { role: 'system', content: enhancedSystemPrompt },
      ...conversation
    ];

    const response = await this.openai.chat.completions.create({
      model: options.model || process.env.OPENAI_MODEL || DEFAULT_CONFIG.models.openai,
      messages: messages,
      max_tokens: options.maxTokens || parseInt(process.env.MAX_TOKENS) || DEFAULT_CONFIG.maxTokens,
      temperature: options.temperature || parseFloat(process.env.TEMPERATURE) || DEFAULT_CONFIG.temperature,
    });

    return response.choices[0].message.content;
  }

  async generateOpenRouterResponse(conversation, options = {}) {
    if (!this.openrouter) {
      throw new Error('OpenRouter client not initialized. Please check OPENROUTER_API_KEY.');
    }

    // Get the latest user message for product context
    const latestMessage = conversation[conversation.length - 1]?.content || '';
    const productContext = this.productService.getProductContext(latestMessage);
    
    // Enhance system prompt with product information if relevant
    let enhancedSystemPrompt = this.systemPrompt;
    if (productContext) {
      enhancedSystemPrompt += productContext;
      enhancedSystemPrompt += '\n\nGunakan informasi produk di atas untuk menjawab pertanyaan user secara natural dan informatif. Jangan terdengar seperti robot - berikan respons yang ramah dan membantu.';
    }

    const messages = [
      { role: 'system', content: enhancedSystemPrompt },
      ...conversation
    ];

    const response = await this.openrouter.chat.completions.create({
      model: options.model || process.env.OPENROUTER_MODEL || DEFAULT_CONFIG.models.openrouter,
      messages: messages,
      max_tokens: options.maxTokens || parseInt(process.env.MAX_TOKENS) || DEFAULT_CONFIG.maxTokens,
      temperature: options.temperature || parseFloat(process.env.TEMPERATURE) || DEFAULT_CONFIG.temperature,
    });

    return response.choices[0].message.content;
  }

  async generateGeminiResponse(conversation, options = {}) {
    if (!this.gemini || !this.geminiModel) {
      throw new Error('Gemini client not initialized. Please check GEMINI_API_KEY.');
    }

    // Get the latest user message for product context
    const latestMessage = conversation[conversation.length - 1]?.content || '';
    const productContext = this.productService.getProductContext(latestMessage);
    
    // Enhance system prompt with product information if relevant
    let enhancedSystemPrompt = this.systemPrompt;
    if (productContext) {
      enhancedSystemPrompt += productContext;
      enhancedSystemPrompt += '\n\nGunakan informasi produk di atas untuk menjawab pertanyaan user secara natural dan informatif. Jangan terdengar seperti robot - berikan respons yang ramah dan membantu.';
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
        maxOutputTokens: options.maxTokens || parseInt(process.env.MAX_TOKENS) || DEFAULT_CONFIG.maxTokens,
        temperature: options.temperature || parseFloat(process.env.TEMPERATURE) || DEFAULT_CONFIG.temperature,
      },
    });

    // Add system prompt context to the first message if no history
    const prompt = chatHistory.length === 0 
      ? `${enhancedSystemPrompt}\n\nUser: ${currentMessage}`
      : currentMessage;

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    return response.text();
  }

  // Enhanced product context for AI
  getEnhancedProductContext(message) {
    if (!message || typeof message !== 'string') return '';
    
    const messageLower = message.toLowerCase();
    
    // Check for specific requests
    const wantsAllProducts = messageLower.includes('semua') || 
                            messageLower.includes('all') || 
                            messageLower.includes('daftar lengkap') || 
                            messageLower.includes('list lengkap') || 
                            messageLower.includes('katalog lengkap') ||
                            messageLower.includes('complete catalog');
    
    const wantsByCategory = messageLower.match(/(?:produk|kategori|jenis)\s*(product|service|digital|course|other)/);
    
    if (wantsAllProducts) {
      return this.productService.getAllProductsForAI();
    }
    
    if (wantsByCategory) {
      const category = wantsByCategory[1];
      return this.productService.getProductsByCategoryForAI(category);
    }
    
    // Check if searching for specific products
    const searchTerms = messageLower.match(/(?:cari|search|find)\s+([a-zA-Z\s]+)/);
    if (searchTerms) {
      const query = searchTerms[1].trim();
      return this.productService.searchProductsForAI(query);
    }
    
    // Default to enhanced context from ProductService
    return this.productService.getProductContext(message);
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
          model: process.env.OPENAI_MODEL || DEFAULT_CONFIG.models.openai,
          configured: !!this.openai
        },
        openrouter: {
          model: process.env.OPENROUTER_MODEL || DEFAULT_CONFIG.models.openrouter,
          configured: !!this.openrouter
        },
        gemini: {
          model: process.env.GEMINI_MODEL || DEFAULT_CONFIG.models.gemini,
          configured: !!this.gemini
        }
      }
    };
  }
}

module.exports = AIService;
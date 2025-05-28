const OpenAI = require('openai');
const fs = require('fs-extra');
const path = require('path');

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.conversationHistory = new Map();
    this.systemPromptPath = path.join(__dirname, '../config/system-prompt.txt');
    this.blacklistPath = path.join(__dirname, '../config/blacklist-words.txt');
    this.blacklistWords = [];
    this.loadSystemPrompt();
    this.loadBlacklistWords();
  }

  async loadSystemPrompt() {
    try {
      // Try to load from file first
      if (await fs.pathExists(this.systemPromptPath)) {
        this.systemPrompt = await fs.readFile(this.systemPromptPath, 'utf8');
        console.log('📝 System prompt loaded from file');
      } else {
        // Fallback to environment variable
        this.systemPrompt = process.env.SYSTEM_PROMPT || 
          'Kamu adalah asisten AI WhatsApp yang ramah dan membantu. Jawab pertanyaan dengan bahasa Indonesia yang santai dan informatif.';
        
        // Save to file for future editing
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

  // New method to reload system prompt from file
  async reloadSystemPrompt() {
    try {
      console.log('🔄 Reloading system prompt from file...');
      await this.loadSystemPrompt();
      console.log('✅ System prompt reloaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Error reloading system prompt:', error);
      return false;
    }
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
        // Fallback to environment variable
        const envBlacklist = process.env.BLACKLIST_WORDS || '';
        this.blacklistWords = envBlacklist.toLowerCase()
          .split(',')
          .map(word => word.trim())
          .filter(word => word.length > 0);
        
        // Save to file for future editing
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

    // Check for exact word matches
    for (const blackWord of this.blacklistWords) {
      if (messageWords.includes(blackWord)) {
        console.log(`🚫 Message blocked: contains blacklisted word "${blackWord}"`);
        return { blocked: true, word: blackWord, reason: 'exact_match' };
      }
    }

    // Check for partial matches (words containing blacklisted terms)
    const messageText = message.toLowerCase();
    for (const blackWord of this.blacklistWords) {
      if (messageText.includes(blackWord)) {
        console.log(`🚫 Message blocked: contains blacklisted term "${blackWord}"`);
        return { blocked: true, word: blackWord, reason: 'partial_match' };
      }
    }

    return { blocked: false };
  }

  // Convert text to WhatsApp-friendly format (gentle formatting)
  convertToWhatsAppFormat(text) {
    // Very minimal formatting - let the AI's natural response through
    let formatted = text.trim();
    
    // Only clean up excessive whitespace
    formatted = formatted.replace(/[ \t]+/g, ' '); // Multiple spaces/tabs to single space
    formatted = formatted.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines
    
    // Only truncate if message is extremely long (over 4000 chars)
    if (formatted.length > 4000) {
        // Find a good breaking point (end of sentence)
        const breakPoint = formatted.lastIndexOf('.', 3800);
        if (breakPoint > 3000) {
            formatted = formatted.substring(0, breakPoint + 1) + '\n\n_(Pesan dipotong karena terlalu panjang)_';
        } else {
            formatted = formatted.substring(0, 3800) + '...';
        }
    }
    
    return formatted;
  }

  // Helper method for time-based greetings
  getTimeBasedGreeting(date = new Date()) {
    const hour = date.getHours();
    
    if (hour >= 5 && hour < 11) {
      return '🌅'; // Morning
    } else if (hour >= 11 && hour < 15) {
      return '☀️'; // Noon
    } else if (hour >= 15 && hour < 18) {
      return '🌤️'; // Afternoon
    } else if (hour >= 18 && hour < 21) {
      return '🌆'; // Evening
    } else {
      return '🌙'; // Night
    }
  }

  async generateResponse(userMessage, userId) {
    try {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        return 'Maaf, OpenAI API key belum dikonfigurasi. Silakan tambahkan API key di file .env';
      }

      // Check if message contains blacklisted words
      const blacklistCheck = this.isMessageBlacklisted(userMessage);
      if (blacklistCheck.blocked) {
        // Log the blocked message for monitoring
        console.log(`🚫 Blocked message from ${userId}: "${userMessage}" (reason: ${blacklistCheck.word})`);
        
        // Return null to indicate no response should be sent
        return null;
      }

      // Get or create conversation history for this user
      if (!this.conversationHistory.has(userId)) {
        this.conversationHistory.set(userId, []);
      }

      const history = this.conversationHistory.get(userId);

      // Limit conversation history to last 10 messages to prevent token overflow
      if (history.length > 10) {
        history.splice(0, history.length - 10);
      }

      // Prepare messages for OpenAI
      const messages = [
        {
          role: 'system',
          content: this.systemPrompt
        },
        ...history,
        {
          role: 'user',
          content: userMessage
        }
      ];

      // Generate response
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      });

      const aiResponse = completion.choices[0].message.content;

      // Convert response to WhatsApp format
      const whatsappFormattedResponse = this.convertToWhatsAppFormat(aiResponse);

      // Update conversation history with original response (not formatted)
      history.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: aiResponse }
      );

      return whatsappFormattedResponse;

    } catch (error) {
      console.error('❌ OpenAI API Error:', error);
      
      if (error.code === 'insufficient_quota') {
        return 'Maaf, kuota OpenAI API sudah habis. Silakan periksa billing account Anda.';
      } else if (error.code === 'invalid_api_key') {
        return 'Maaf, OpenAI API key tidak valid. Silakan periksa konfigurasi API key.';
      } else {
        return 'Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi nanti.';
      }
    }
  }

  clearConversationHistory(userId) {
    if (this.conversationHistory.has(userId)) {
      this.conversationHistory.delete(userId);
      return true;
    }
    return false;
  }

  getAllConversations() {
    const conversations = {};
    for (const [userId, history] of this.conversationHistory.entries()) {
      conversations[userId] = {
        messageCount: history.length,
        lastMessage: history[history.length - 1]?.content || null
      };
    }
    return conversations;
  }

  getConversationStats() {
    return {
      totalUsers: this.conversationHistory.size,
      totalMessages: Array.from(this.conversationHistory.values())
        .reduce((total, history) => total + history.length, 0)
    };
  }

  getBlacklistStats() {
    return {
      totalBlacklistWords: this.blacklistWords.length,
      blacklistWords: this.blacklistWords
    };
  }
}

module.exports = OpenAIService;
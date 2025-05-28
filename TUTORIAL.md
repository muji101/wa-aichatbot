# 📚 Tutorial Lengkap WhatsApp AI Chatbot

Tutorial step-by-step untuk setup dan kustomisasi WhatsApp AI Chatbot dari awal sampai jalan.

## 📋 Daftar Isi

- [🏁 Getting Started](#-getting-started)
- [⚙️ Konfigurasi Detail](#️-konfigurasi-detail)
- [🎯 Kustomisasi System Prompt](#-kustomisasi-system-prompt)
- [🚫 Setup Blacklist](#-setup-blacklist)
- [📱 Mengelola Session WhatsApp](#-mengelola-session-whatsapp)
- [🔧 API Usage Examples](#-api-usage-examples)
- [🛠️ Advanced Configuration](#️-advanced-configuration)
- [📊 Monitoring & Analytics](#-monitoring--analytics)
- [🚀 Deploy to Production](#-deploy-to-production)

---

## 🏁 Getting Started

### Langkah 1: Persiapan Environment

```bash
# 1. Pastikan Node.js v16+ terinstall
node --version  # Should be v16 or higher

# 2. Install PNPM package manager
npm install -g pnpm

# 3. Verify PNPM installation
pnpm --version
```

### Langkah 2: Clone dan Setup Project

```bash
# 1. Clone repository
git clone <your-repo-url>
cd wa-aichatbot

# 2. Install dependencies
pnpm install

# 3. Copy environment template
cp .env.example .env
```

### Langkah 3: Konfigurasi API Keys

Edit file `.env` dengan API key yang valid:

```env
# Pilih provider AI (openai/openrouter/gemini)
AI_PROVIDER=openai

# Masukkan API key sesuai provider
OPENAI_API_KEY=sk-proj-your-actual-openai-key-here
```

> 💡 **Tips**: Mulai dengan OpenAI dulu karena paling mudah di-setup

### Langkah 4: First Run

```bash
# Jalankan server development
pnpm dev

# Output yang diharapkan:
# ✅ Server running on port 3002
# ✅ Socket.IO initialized
# 🔄 AI Service initialized with provider: openai
```

### Langkah 5: Akses Dashboard

1. 🌐 Buka browser ke `http://localhost:3002`
2. ✅ Pastikan dashboard terbuka dengan baik
3. 🖱️ Klik tombol **"🚀 Start Bot"**
4. 📱 QR Code akan muncul - scan dengan WhatsApp

---

## ⚙️ Konfigurasi Detail

### 🔑 Setup API Keys untuk Setiap Provider

#### OpenAI Configuration
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-1234567890abcdef...

# Optional: Specify model (default: gpt-3.5-turbo)
OPENAI_MODEL=gpt-4
```

**Cara dapat API Key:**
1. 🌐 Kunjungi [OpenAI Platform](https://platform.openai.com/api-keys)
2. ➕ Klik "Create new secret key"
3. 📝 Copy key yang dimulai dengan `sk-proj-...`
4. 💳 Pastikan billing aktif

#### OpenRouter Configuration
```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-1234567890abcdef...
OPENROUTER_MODEL_NAME=anthropic/claude-3-haiku

# Model populer lainnya:
# anthropic/claude-3-sonnet
# meta-llama/llama-2-70b-chat
# mistralai/mixtral-8x7b-instruct
```

**Cara dapat API Key:**
1. 🌐 Kunjungi [OpenRouter](https://openrouter.ai/)
2. 📝 Sign up dengan email
3. 🔑 Go to "API Keys" di dashboard
4. ➕ Generate new key

#### Google Gemini Configuration
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSyABC123...

# Optional: Specify model (default: gemini-pro)
GEMINI_MODEL=gemini-pro-vision
```

**Cara dapat API Key:**
1. 🌐 Kunjungi [Google AI Studio](https://aistudio.google.com/)
2. 🔑 Klik "Get API Key"
3. ➕ Create new project (jika belum ada)
4. 📝 Copy API key

### 🌐 Network Configuration

```env
# Server settings
PORT=3002                    # Port server (default: 3002)
HOST=0.0.0.0                # Bind to all interfaces (untuk remote access)

# WhatsApp settings
SESSION_FILE_PATH=./session  # Path untuk menyimpan session WhatsApp
```

### 🚫 Advanced Blacklist Setup

```env
# Simple blacklist (dipisah koma)
BLACKLIST_WORDS=spam,iklan,judi,togel,casino

# Untuk blacklist yang kompleks, edit file:
# config/blacklist-words.txt
```

---

## 🎯 Kustomisasi System Prompt

### Method 1: Via Dashboard Web (Recommended) ✅

1. 🌐 Buka dashboard di `http://localhost:3002`
2. 🔽 Scroll ke bagian **"🧠 AI Configuration"**
3. ✏️ Edit prompt di textarea:

```
Kamu adalah asisten teknologi WhatsApp yang ahli.

Tugasmu:
- Membantu troubleshooting smartphone dan laptop
- Memberikan solusi teknis yang jelas dan step-by-step
- Menggunakan bahasa Indonesia yang ramah dan mudah dipahami
- Tidak membahas topik di luar teknologi

Selalu jawab dengan format:
1. Sapaan ramah
2. Solusi teknis yang spesifik
3. Tips tambahan jika ada
```

4. 💾 Klik **"Update Prompt"**
5. ✅ Prompt akan tersimpan otomatis ke `config/system-prompt.txt`

### Method 2: Edit File Langsung

```bash
# Edit file system prompt
nano config/system-prompt.txt

# Atau di Windows
notepad config/system-prompt.txt
```

### Method 3: Via Environment Variable

```env
# Di file .env (untuk prompt sederhana)
SYSTEM_PROMPT=Kamu adalah asisten AI yang membantu dengan ramah dalam bahasa Indonesia.
```

### 🎨 Template Prompt Siap Pakai

#### 💼 Business Assistant
```
Kamu adalah asisten bisnis profesional WhatsApp.

Keahlianmu:
- Strategi marketing digital
- Analisis bisnis
- Tips produktivitas
- Manajemen waktu

Gaya komunikasi: Profesional namun tetap approachable
Bahasa: Indonesia formal tapi tidak kaku
Format jawaban: Ringkas, actionable, dengan bullet points
```

#### 🎓 Education Tutor
```
Kamu adalah tutor pendidikan yang sabar dan membantu.

Mata pelajaran: Matematika, Fisika, Kimia, Bahasa Indonesia
Tingkat: SD, SMP, SMA

Caramu mengajar:
1. Jelaskan konsep dengan sederhana
2. Berikan contoh yang mudah dipahami
3. Ajukan pertanyaan untuk memastikan pemahaman
4. Berikan latihan soal jika diperlukan

Selalu gunakan bahasa yang sesuai dengan usia siswa.
```

#### 🏥 Health Assistant
```
Kamu adalah asisten kesehatan yang memberikan informasi umum.

PENTING: 
- Kamu TIDAK menggantikan dokter
- Selalu sarankan konsultasi ke tenaga medis untuk masalah serius
- Berikan info kesehatan umum dan tips hidup sehat

Topik yang bisa dibahas:
- Tips hidup sehat
- Informasi gizi
- Olahraga ringan
- Pertolongan pertama dasar

Jangan: Diagnosis penyakit, resep obat, medical advice
```

---

## 🚫 Setup Blacklist

### Automatic Blacklist Setup

File `config/blacklist-words.txt` akan dibuat otomatis dari environment variable:

```env
# Di .env file
BLACKLIST_WORDS=spam,promosi,iklan,judi,togel,casino,porno,bokep,sex,drugs,scam,penipuan,hoax,virus,hack,crack,piracy,bajakan,ilegal
```

### Manual Blacklist Configuration

Edit file `config/blacklist-words.txt`:

```txt
# Kata-kata yang akan difilter (satu baris = satu kata/phrase)
spam
promosi murah
iklan gratis
judi online
togel hari ini
casino
penipuan berhadiah
virus hp
hack whatsapp
bajakan software

# Support regex pattern (advanced)
\b(judi|togel|casino)\b
\b\d{4}-\d{4}-\d{4}-\d{4}\b  # Block credit card patterns
```

### Blacklist Response Customization

Edit di `services/aiService.js` untuk custom response saat blacklist triggered:

```javascript
// Custom blacklist response
const blacklistResponse = "Maaf, saya tidak bisa membahas topik tersebut. Ada yang bisa saya bantu lainnya?";
```

---

## 📱 Mengelola Session WhatsApp

### Understanding WhatsApp Session

Session WhatsApp berisi data autentikasi yang memungkinkan bot tetap login tanpa scan QR berulang.

**File-file penting dalam `session/`:**
```
session/
├── creds.json              # Kredensial utama
├── app-state-sync-*.json   # Sinkronisasi state
├── pre-key-*.json         # Keys untuk enkripsi
└── session-*.json         # Session data per device
```

### Session Management Commands

#### Reset Session (Logout)
```bash
# Hapus semua session data
rm -rf session/*           # Linux/Mac
rmdir /s session           # Windows
mkdir session              # Recreate empty folder

# Restart server
pnpm dev
```

#### Backup Session
```bash
# Backup session sebelum update
cp -r session session_backup_$(date +%Y%m%d)

# Restore jika ada masalah
cp -r session_backup_20240528 session
```

#### Multiple Bot Management
```bash
# Untuk menjalankan multiple bot dengan session terpisah
# Bot 1
SESSION_FILE_PATH=./session_bot1

# Bot 2
SESSION_FILE_PATH=./session_bot2
```

### 🔧 Session Troubleshooting

#### Masalah: Bot Sering Disconnect
```bash
# 1. Clear session dan login ulang
rm -rf session/*

# 2. Pastikan koneksi internet stabil
# 3. Jangan login WhatsApp Web di browser lain simultaneously
```

#### Masalah: QR Code Tidak Muncul
```bash
# 1. Restart server
# 2. Clear browser cache
# 3. Check if port is blocked by firewall
```

---

## 🔧 API Usage Examples

### WhatsApp API Examples

#### Send Message via API
```bash
# Send text message
curl -X POST http://localhost:3002/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "number": "6281234567890",
    "message": "Hello from API!"
  }'
```

#### Get Bot Status
```bash
# Check if bot is connected
curl http://localhost:3002/api/whatsapp/status

# Response:
{
  "status": "connected",
  "user": {
    "id": "6281234567890",
    "name": "Bot Name"
  }
}
```

#### Get Active Chats
```bash
curl http://localhost:3002/api/whatsapp/chats

# Response:
{
  "chats": [
    {
      "id": "6281234567890@s.whatsapp.net",
      "name": "John Doe",
      "lastMessage": "Hello bot",
      "timestamp": 1640995200
    }
  ]
}
```

### AI API Examples

#### Update System Prompt
```bash
curl -X PUT http://localhost:3002/api/ai/prompt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Kamu adalah asisten teknologi yang ramah dan membantu."
  }'
```

#### Get Current Prompt
```bash
curl http://localhost:3002/api/ai/prompt

# Response:
{
  "prompt": "Kamu adalah asisten teknologi yang ramah dan membantu.",
  "lastUpdated": "2024-05-28T10:30:00Z"
}
```

#### Clear User Conversation
```bash
# Clear conversation history for specific user
curl -X DELETE http://localhost:3002/api/ai/conversation/6281234567890
```

#### Generate AI Response (Testing)
```bash
curl -X POST http://localhost:3002/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Halo, siapa kamu?",
    "userId": "test-user"
  }'
```

### JavaScript/Node.js Examples

#### Using in Your Own App
```javascript
const axios = require('axios');

class WhatsAppBotClient {
  constructor(baseURL = 'http://localhost:3002') {
    this.baseURL = baseURL;
  }

  async sendMessage(number, message) {
    try {
      const response = await axios.post(`${this.baseURL}/api/whatsapp/send`, {
        number: number,
        message: message
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getBotStatus() {
    try {
      const response = await axios.get(`${this.baseURL}/api/whatsapp/status`);
      return response.data;
    } catch (error) {
      console.error('Error getting status:', error);
      throw error;
    }
  }

  async updateSystemPrompt(newPrompt) {
    try {
      const response = await axios.put(`${this.baseURL}/api/ai/prompt`, {
        prompt: newPrompt
      });
      return response.data;
    } catch (error) {
      console.error('Error updating prompt:', error);
      throw error;
    }
  }
}

// Usage example
const bot = new WhatsAppBotClient();

async function example() {
  // Check bot status
  const status = await bot.getBotStatus();
  console.log('Bot status:', status);

  // Send message
  await bot.sendMessage('6281234567890', 'Hello from my app!');

  // Update system prompt
  await bot.updateSystemPrompt('Kamu adalah asisten yang sangat ramah.');
}

example();
```

---

## 🛠️ Advanced Configuration

### Environment Variables Lengkap

```env
# ===========================================
# SERVER CONFIGURATION
# ===========================================
PORT=3002
HOST=0.0.0.0
NODE_ENV=production

# ===========================================
# AI PROVIDER CONFIGURATION
# ===========================================
AI_PROVIDER=openai

# OpenAI
OPENAI_API_KEY=sk-proj-your-key-here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7

# OpenRouter
OPENROUTER_API_KEY=sk-or-your-key-here
OPENROUTER_MODEL_NAME=anthropic/claude-3-haiku
OPENROUTER_SITE_URL=https://yoursite.com
OPENROUTER_APP_NAME=WhatsApp AI Bot

# Google Gemini
GEMINI_API_KEY=your-gemini-key-here
GEMINI_MODEL=gemini-pro

# ===========================================
# WHATSAPP CONFIGURATION
# ===========================================
SESSION_FILE_PATH=./session
WHATSAPP_AUTO_RECONNECT=true
WHATSAPP_MARK_ONLINE=false
WHATSAPP_IGNORE_GROUPS=true

# ===========================================
# AI BEHAVIOR CONFIGURATION
# ===========================================
SYSTEM_PROMPT=Your default system prompt here
MAX_CONVERSATION_HISTORY=20
AI_RESPONSE_DELAY=1000
ENABLE_TYPING_INDICATOR=true

# ===========================================
# BLACKLIST & FILTERING
# ===========================================
BLACKLIST_WORDS=spam,iklan,judi,togel
ENABLE_BLACKLIST=true
BLACKLIST_RESPONSE=Maaf, saya tidak bisa membahas topik tersebut.

# ===========================================
# LOGGING & DEBUG
# ===========================================
LOG_LEVEL=info
LOG_TO_FILE=false
LOG_FILE_PATH=./logs/app.log
DEBUG_MODE=false

# ===========================================
# RATE LIMITING
# ===========================================
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=30
RATE_LIMIT_PER_USER=5

# ===========================================
# SECURITY
# ===========================================
ALLOWED_ORIGINS=http://localhost:3002
API_SECRET_KEY=your-secret-key-for-api-auth
ENABLE_API_AUTH=false
```

### Custom AI Response Processing

Edit `services/aiService.js` untuk custom behavior:

```javascript
// Custom pre-processing
processIncomingMessage(message, userId) {
  // Convert voice note to text
  if (message.type === 'voice') {
    message.text = this.speechToText(message.audioBuffer);
  }
  
  // Detect language
  const language = this.detectLanguage(message.text);
  
  // Custom logic based on user type
  const userType = this.getUserType(userId);
  if (userType === 'premium') {
    // Enable advanced features
  }
  
  return message;
}

// Custom post-processing
processAIResponse(response, userId) {
  // Add custom formatting
  response = this.formatResponse(response);
  
  // Add user-specific signatures
  const signature = this.getUserSignature(userId);
  response += `\n\n${signature}`;
  
  // Log for analytics
  this.logResponse(userId, response);
  
  return response;
}
```

### Database Integration

Untuk production use, integrate dengan database:

```javascript
// services/databaseService.js
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  userId: String,
  messages: [{
    role: String,
    content: String,
    timestamp: Date
  }],
  lastActive: Date
});

class DatabaseService {
  async saveConversation(userId, messages) {
    // Save to MongoDB
  }
  
  async getConversation(userId) {
    // Retrieve from MongoDB
  }
  
  async logMessage(userId, message, response) {
    // Log for analytics
  }
}
```

---

## 📊 Monitoring & Analytics

### Real-time Monitoring via Dashboard

Dashboard menyediakan:
- 📈 **Message volume**: Grafik pesan masuk/keluar per jam
- 👥 **Active users**: Jumlah user aktif
- 🤖 **AI performance**: Response time dan success rate
- ❌ **Error tracking**: Log error dan troubleshooting

### Custom Logging Setup

Edit `server.js` untuk custom logging:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Usage
logger.info('Bot started successfully');
logger.error('API key invalid', { provider: 'openai', userId: '123' });
```

### Analytics Integration

```javascript
// services/analyticsService.js
class AnalyticsService {
  constructor() {
    this.metrics = {
      totalMessages: 0,
      activeUsers: new Set(),
      responseTime: [],
      errorCount: 0
    };
  }
  
  trackMessage(userId, messageType) {
    this.metrics.totalMessages++;
    this.metrics.activeUsers.add(userId);
    
    // Send to external analytics (Google Analytics, Mixpanel, dll)
    this.sendToExternalAnalytics({
      event: 'message_received',
      userId: userId,
      messageType: messageType,
      timestamp: new Date()
    });
  }
  
  trackResponseTime(time) {
    this.metrics.responseTime.push(time);
    
    // Keep only last 100 measurements
    if (this.metrics.responseTime.length > 100) {
      this.metrics.responseTime.shift();
    }
  }
  
  getMetrics() {
    return {
      totalMessages: this.metrics.totalMessages,
      activeUsers: this.metrics.activeUsers.size,
      avgResponseTime: this.calculateAverage(this.metrics.responseTime),
      errorRate: this.metrics.errorCount / this.metrics.totalMessages
    };
  }
}
```

---

## 🚀 Deploy to Production

### Production Environment Setup

#### 1. Server Requirements
```bash
# Minimum requirements:
- CPU: 1 vCPU
- RAM: 512MB (1GB recommended)
- Storage: 5GB
- Network: Stable internet connection
- OS: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
```

#### 2. Install Production Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2 pnpm

# Install additional tools
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

#### 3. Clone dan Setup Project

```bash
# Clone ke production directory
cd /opt
sudo git clone <your-repo-url> whatsapp-bot
sudo chown -R $USER:$USER whatsapp-bot
cd whatsapp-bot

# Install dependencies
pnpm install --production

# Setup environment
cp .env.example .env
nano .env  # Edit dengan production values
```

#### 4. Production Environment Variables

```env
# Production .env
NODE_ENV=production
PORT=3002
HOST=0.0.0.0

# Use production AI keys with higher limits
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-production-key-here

# Production database (if using)
DATABASE_URL=mongodb://localhost:27017/whatsapp-bot

# Security
API_SECRET_KEY=your-super-secret-key-here
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Logging
LOG_LEVEL=warn
LOG_TO_FILE=true
LOG_FILE_PATH=/var/log/whatsapp-bot/app.log
```

### PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'whatsapp-bot',
    script: 'server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    error_file: '/var/log/whatsapp-bot/err.log',
    out_file: '/var/log/whatsapp-bot/out.log',
    log_file: '/var/log/whatsapp-bot/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

#### Start with PM2

```bash
# Create log directory
sudo mkdir -p /var/log/whatsapp-bot
sudo chown -R $USER:$USER /var/log/whatsapp-bot

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup auto-start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER
```

### Nginx Reverse Proxy

Create `/etc/nginx/sites-available/whatsapp-bot`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (will be added by Certbot)
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # WebSocket support
        proxy_set_header Connection "upgrade";
        proxy_set_header Upgrade $http_upgrade;
    }

    # Static files
    location /static/ {
        alias /opt/whatsapp-bot/public/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

#### Enable Site and SSL

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/whatsapp-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test SSL renewal
sudo certbot renew --dry-run
```

### Production Monitoring

#### Setup System Monitoring

```bash
# Install monitoring tools
sudo apt-get install -y htop iotop nethogs

# Monitor PM2 processes
pm2 monit

# Check logs
pm2 logs whatsapp-bot --lines 50

# Monitor system resources
pm2 show whatsapp-bot
```

#### Automated Backups

Create backup script `/opt/whatsapp-bot/scripts/backup.sh`:

```bash
#!/bin/bash

# Backup configuration
BACKUP_DIR="/backup/whatsapp-bot"
DATE=$(date +%Y%m%d_%H%M%S)
PROJECT_DIR="/opt/whatsapp-bot"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup session data (important!)
tar -czf $BACKUP_DIR/session_$DATE.tar.gz -C $PROJECT_DIR session/

# Backup configuration
cp $PROJECT_DIR/.env $BACKUP_DIR/env_$DATE

# Backup logs
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz /var/log/whatsapp-bot/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "env_*" -mtime +7 -delete

echo "Backup completed: $DATE"
```

#### Setup Cron Job

```bash
# Make script executable
chmod +x /opt/whatsapp-bot/scripts/backup.sh

# Add to crontab (backup every 6 hours)
crontab -e

# Add this line:
0 */6 * * * /opt/whatsapp-bot/scripts/backup.sh >> /var/log/whatsapp-bot/backup.log 2>&1
```

### Production Security Checklist

#### ✅ Security Measures

```bash
# 1. Firewall configuration
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 3002  # Block direct access to app port

# 2. Secure file permissions
sudo chown -R www-data:www-data /opt/whatsapp-bot
sudo chmod -R 755 /opt/whatsapp-bot
sudo chmod 600 /opt/whatsapp-bot/.env  # Secure env file

# 3. Secure session directory
sudo chmod 700 /opt/whatsapp-bot/session/

# 4. Regular security updates
sudo apt-get update && sudo apt-get upgrade -y

# 5. Install fail2ban
sudo apt-get install fail2ban
```

#### Environment Security

```env
# Production security settings
ENABLE_API_AUTH=true
API_SECRET_KEY=your-super-secure-random-key-here
ALLOWED_ORIGINS=https://yourdomain.com
RATE_LIMIT_MAX_REQUESTS=10  # Lower for production
RATE_LIMIT_PER_USER=3       # Prevent abuse
```

### Health Checks & Alerts

Create health check script `/opt/whatsapp-bot/scripts/health-check.sh`:

```bash
#!/bin/bash

# Health check script
HEALTH_URL="http://localhost:3002/api/whatsapp/status"
LOG_FILE="/var/log/whatsapp-bot/health.log"

# Check if service is responding
response=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $response != "200" ]; then
    echo "$(date): Service unhealthy (HTTP $response)" >> $LOG_FILE
    
    # Restart PM2 process
    pm2 restart whatsapp-bot
    
    # Send alert (replace with your notification method)
    # curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage" \
    #      -d "chat_id=<YOUR_CHAT_ID>&text=WhatsApp Bot is down and restarted"
    
    echo "$(date): Service restarted" >> $LOG_FILE
else
    echo "$(date): Service healthy" >> $LOG_FILE
fi
```

#### Setup Health Check Cron

```bash
# Add to crontab (check every 5 minutes)
*/5 * * * * /opt/whatsapp-bot/scripts/health-check.sh
```

---

## 📞 Support & Troubleshooting

### Common Production Issues

#### Issue: High Memory Usage
```bash
# Check memory usage
pm2 show whatsapp-bot

# Solution: Add memory limit
pm2 restart whatsapp-bot --max-memory-restart 1G
```

#### Issue: WhatsApp Session Expired
```bash
# Backup current session
cp -r session session_backup_$(date +%Y%m%d)

# Clear session and restart
rm -rf session/*
pm2 restart whatsapp-bot

# Monitor logs for QR code
pm2 logs whatsapp-bot --lines 50
```

#### Issue: SSL Certificate Renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Force renewal if needed
sudo certbot renew --force-renewal

# Restart nginx
sudo systemctl reload nginx
```

### Getting Help

- 📖 **Documentation**: Check this tutorial dan README.md
- 🐛 **Bug Reports**: Open issue di GitHub repository
- 💡 **Feature Requests**: Open discussion di GitHub
- 📧 **Email Support**: [your-email@domain.com]

### Contributing to Documentation

Found error atau ingin improve tutorial ini?

1. 🍴 Fork repository
2. ✏️ Edit file `TUTORIAL.md`
3. 📤 Submit pull request
4. 🙏 Help others learn!

---

**🎉 Selamat! Anda telah berhasil setup WhatsApp AI Chatbot yang lengkap!**

> 💡 **Pro Tip**: Bookmark tutorial ini dan gunakan sebagai referensi untuk troubleshooting dan advanced configuration.

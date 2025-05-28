# 🤖 WhatsApp AI Chatbot

Bot WhatsApp pintar dengan integrasi AI menggunakan **Baileys** (WhatsApp Web API), **Express.js**, dan **Socket.IO** untuk komunikasi real-time.

## ✨ Fitur Utama

- 🔄 **Multi AI Provider** - Support OpenAI, OpenRouter, dan Google Gemini
- 📱 **WhatsApp Integration** - Menggunakan @whiskeysockets/baileys (tanpa Puppeteer)
- 🌐 **Real-time Dashboard** - WebSocket dengan Socket.IO untuk monitoring live
- 🛡️ **Smart Blacklist System** - Filter kata terlarang dengan file konfigurasi
- 💬 **Conversation Memory** - Menyimpan context percakapan per user
- ⚙️ **Dynamic System Prompt** - Edit prompt AI secara real-time
- 📊 **Live Message Monitoring** - Lihat semua pesan masuk/keluar
- 🔒 **Session Management** - Auto-save session WhatsApp
- 🎨 **Beautiful UI** - Dashboard web yang modern dan responsive
- 📁 **Modular Architecture** - Code terorganisir dengan baik

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js
- **WhatsApp API**: @whiskeysockets/baileys v6.7.17
- **AI Providers**: 
  - OpenAI API (GPT-3.5/GPT-4)
  - OpenRouter (Claude, Llama, dll)
  - Google Gemini
- **Real-time Communication**: Socket.IO v4.7.4
- **Package Manager**: PNPM
- **Frontend**: Vanilla HTML/CSS/JS
- **Security**: DOMPurify untuk XSS protection

## 📋 Prerequisites

## 📋 Prerequisites

- **Node.js** v16+ (Recommended: v18 atau v20)
- **PNPM** (Package manager yang digunakan)
- **API Key** dari salah satu provider:
  - OpenAI API Key
  - OpenRouter API Key
  - Google Gemini API Key
- **WhatsApp** di smartphone untuk scan QR code

## 🚀 Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd wa-aichatbot
```

### 2. Install Dependencies

```bash
# Install PNPM jika belum ada
npm install -g pnpm

# Install dependencies
pnpm install
```

### 3. Konfigurasi Environment

Copy file `.env.example` ke `.env`:

```bash
cp .env.example .env
```

Edit file `.env` dengan konfigurasi Anda:

```env
# Server Configuration
PORT=3002

# AI Provider Selection (openai/openrouter/gemini)
AI_PROVIDER=openai

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-actual-openai-api-key-here

# OpenRouter Configuration  
OPENROUTER_API_KEY=sk-or-your-actual-openrouter-api-key
OPENROUTER_MODEL_NAME=anthropic/claude-3-haiku

# Google Gemini Configuration
GEMINI_API_KEY=your-actual-gemini-api-key-here

# System Prompt (akan dibuat otomatis di config/system-prompt.txt)
SYSTEM_PROMPT=Kamu adalah asisten AI WhatsApp yang ramah dan membantu.

# WhatsApp Session Path
SESSION_FILE_PATH=./session

# Blacklist Words (akan dibuat otomatis di config/blacklist-words.txt)
BLACKLIST_WORDS=spam,promosi,iklan,judi,togel,casino
```

> ⚠️ **PENTING**: Jangan pernah commit file `.env` ke Git! File `.gitignore` sudah dikonfigurasi untuk melindungi data sensitif.

### 4. Jalankan Server

```bash
# Development mode (dengan auto-restart menggunakan nodemon)
pnpm dev

# Production mode
pnpm start
```

Server akan berjalan di `http://localhost:3002` (atau sesuai PORT di `.env`)

## 📱 Cara Penggunaan

### 1. Akses Dashboard Web

Buka browser dan kunjungi:
```
http://localhost:3002
```

### 2. Menghubungkan WhatsApp

1. ✅ Klik tombol **"🚀 Start Bot"** di dashboard
2. 📱 QR code akan muncul di dashboard web 
3. 📲 Scan QR code dengan WhatsApp di HP Anda:
   - Buka WhatsApp → Menu (⋮) → **Linked Devices** → **Link a Device**
4. ✅ Bot akan aktif setelah berhasil terhubung

### 3. Konfigurasi AI System Prompt

Di dashboard web:
1. 🔽 Scroll ke bagian **"🧠 AI Configuration"**
2. ✏️ Edit system prompt sesuai kebutuhan (atau gunakan default)
3. 💾 Klik **"Update Prompt"** untuk menyimpan

### 4. Monitoring Real-time

- 💬 Bagian **"Live Messages"** menampilkan pesan masuk/keluar secara real-time
- 📊 Lihat statistik percakapan dan status bot
- 🔄 Restart bot jika diperlukan tanpa refresh page

## 🔧 API Endpoints

### 📱 WhatsApp API Routes (`/api/whatsapp`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/whatsapp/status` | Cek status bot WhatsApp |
| `POST` | `/api/whatsapp/start` | Start WhatsApp client |
| `POST` | `/api/whatsapp/stop` | Stop WhatsApp client |
| `POST` | `/api/whatsapp/send` | Kirim pesan manual |
| `GET` | `/api/whatsapp/chats` | Ambil daftar chat aktif |

### 🤖 AI API Routes (`/api/ai`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/ai/prompt` | Ambil system prompt saat ini |
| `PUT` | `/api/ai/prompt` | Update system prompt |
| `POST` | `/api/ai/generate` | Generate AI response (testing) |
| `DELETE` | `/api/ai/conversation/:userId` | Hapus riwayat percakapan user |
| `GET` | `/api/ai/stats` | Statistik percakapan |

### 🌐 WebSocket Events (Socket.IO)

#### Client → Server Events
```javascript
socket.emit('start-whatsapp');  // Start WhatsApp client
socket.emit('stop-whatsapp');   // Stop WhatsApp client
```

#### Server → Client Events
```javascript
socket.on('qr-code', (qr) => {});                    // QR code untuk scan
socket.on('whatsapp-ready', () => {});               // Bot siap
socket.on('whatsapp-authenticated', () => {});       // Autentikasi berhasil  
socket.on('whatsapp-disconnected', () => {});        // Bot terputus
socket.on('message-received', (message) => {});      // Pesan masuk
socket.on('ai-response', (response) => {});          // Respon AI terkirim
socket.on('error', (error) => {});                   // Error event
```

## 📁 Project Structure

```
wa-aichatbot/
├── 📄 server.js                    # Main server dengan Socket.IO
├── 📋 package.json                 # Dependencies dan scripts
├── 🔧 pnpm-lock.yaml               # PNPM lock file
├── 🔧 pnpm-workspace.yaml          # PNPM workspace config
├── 🔒 .env                         # Environment variables (PRIVATE)
├── 📖 README.md                    # Dokumentasi utama
├── 🔒 README_SECURITY.md           # Panduan keamanan
├── 🛡️ .gitignore                   # Git ignore file
│
├── 📁 config/
│   ├── 🤖 system-prompt.txt        # System prompt AI (auto-generated)
│   └── 🚫 blacklist-words.txt      # Kata-kata blacklist (auto-generated)
│
├── 📁 services/
│   ├── 🤖 aiService.js             # Service utama AI (multi-provider)
│   ├── 🔄 openaiService.js         # Service khusus OpenAI (legacy)
│   └── 📱 whatsappService.js       # Service WhatsApp dengan Baileys
│
├── 📁 routes/
│   ├── 📱 whatsapp.js              # API routes WhatsApp
│   └── 🤖 ai.js                    # API routes AI
│
├── 📁 public/
│   ├── 🌐 index.html               # Dashboard web interface
│   ├── 🎨 style.css                # Styling dashboard
│   ├── 📁 js/
│   │   └── ⚡ main.js               # JavaScript dashboard
│   └── 🗂️ index_backup.html        # Backup file
│
└── 📁 session/                     # WhatsApp session data (PRIVATE)
    ├── 🔑 creds.json               # Kredensial WhatsApp
    ├── 🔐 app-state-sync-*.json    # State sync keys
    ├── 🔐 pre-key-*.json           # Pre-keys encryption
    └── 📱 session-*.json           # Session data per device
```

> ⚠️ **Folder `session/` dan file `.env` berisi data sensitif** dan tidak akan di-upload ke Git (dilindungi oleh `.gitignore`)

## ⚙️ Konfigurasi AI Providers

### 🔑 Mendapatkan API Keys

#### Option A: OpenAI (Recommended)
1. 🌐 Kunjungi [OpenAI Platform](https://platform.openai.com/api-keys)
2. ➕ Buat API key baru
3. 📝 Set `AI_PROVIDER=openai` dan `OPENAI_API_KEY=sk-proj-...`
4. 💰 Pastikan akun memiliki credit/billing

#### Option B: OpenRouter (Multi-Model)
1. 🌐 Kunjungi [OpenRouter](https://openrouter.ai/)
2. 📝 Daftar dan dapatkan API key
3. 📝 Set `AI_PROVIDER=openrouter` dan `OPENROUTER_API_KEY=sk-or-...`
4. 🤖 Pilih model di `OPENROUTER_MODEL_NAME` (contoh: `anthropic/claude-3-haiku`)

#### Option C: Google Gemini
1. 🌐 Kunjungi [Google AI Studio](https://aistudio.google.com/)
2. 🔑 Dapatkan API key untuk Gemini
3. 📝 Set `AI_PROVIDER=gemini` dan `GEMINI_API_KEY=...`

### 🎯 Kustomisasi System Prompt

#### Via Dashboard Web (Recommended) ✅
1. 🌐 Buka `http://localhost:3002`
2. 🔽 Scroll ke bagian **"🧠 AI Configuration"**
3. ✏️ Edit textarea dan klik **"💾 Update Prompt"**

#### Via File 📁
Edit file `config/system-prompt.txt` dan restart server

#### Via Environment Variable 🔧
Set `SYSTEM_PROMPT` di file `.env`

### 🚫 Konfigurasi Blacklist

#### Via File (Automatic) 📁
- File `config/blacklist-words.txt` dibuat otomatis dari `BLACKLIST_WORDS` di `.env`
- Format: kata dipisah koma (spam,iklan,judi,dll)

#### Via Environment Variable 🔧
Edit `BLACKLIST_WORDS` di file `.env`

## 🔧 Troubleshooting

### ❌ QR Code Tidak Muncul
```bash
# Cek apakah server berjalan di port yang benar
lsof -i :3002  # Linux/Mac
netstat -ano | findstr :3002  # Windows

# Solusi:
1. ✅ Pastikan server berjalan di port yang benar
2. 🌐 Cek console browser untuk error
3. 🔄 Restart server dan coba lagi
4. 🔒 Pastikan firewall tidak memblokir port
```

### ❌ Bot Tidak Merespon Pesan
```bash
# Debug steps:
1. ✅ Pastikan API key valid dan memiliki credit
2. 📋 Cek logs di terminal untuk error
3. 🤖 Periksa system prompt sudah dikonfigurasi
4. 🚫 Cek apakah pesan terkena blacklist filter
5. 📱 Pastikan WhatsApp masih terkoneksi
```

### ❌ Error "Cannot find module"
```bash
# Install ulang dependencies
rm -rf node_modules pnpm-lock.yaml  # Linux/Mac
rmdir /s node_modules & del pnpm-lock.yaml  # Windows

pnpm install
```

### ❌ Error Permission Denied (Termux/Linux)
```bash
# Pastikan Node.js dan PNPM terinstall dengan benar
pkg update && pkg upgrade  # Termux
pkg install nodejs-lts     # Termux

# Install PNPM global
npm install -g pnpm
```

### ❌ Baileys Connection Error
```bash
# Jika mengalami masalah koneksi WhatsApp:
1. 🗑️ Hapus folder session/
2. 🔄 Restart server
3. 📱 Scan QR code ulang
4. ⏳ Tunggu beberapa menit sebelum retry
```

### ❌ Socket.IO Connection Failed
```bash
# Jika dashboard tidak real-time:
1. 🌐 Refresh browser
2. 🔍 Cek browser console untuk error
3. 🚫 Disable ad-blocker jika ada
4. 🔄 Restart server
```

## 📊 Features Detail

### 🤖 AI Multi-Provider Support
- **OpenAI**: GPT-3.5-turbo, GPT-4, GPT-4-turbo
- **OpenRouter**: Claude, Llama, Mixtral, dll (50+ models)
- **Google Gemini**: Gemini Pro, Gemini Pro Vision
- **Auto-fallback**: Jika satu provider error, bisa switch otomatis

### 📱 WhatsApp Integration 
- **Baileys v6.7.17**: No Puppeteer, lebih stabil
- **Multi-device**: Support WhatsApp Web multi-device
- **Session persistent**: Auto-save login session
- **QR Code**: Tampil di dashboard web dan terminal

### 🛡️ Security & Filtering
- **Blacklist system**: Filter kata-kata terlarang
- **Rate limiting**: Prevent spam
- **XSS Protection**: DOMPurify untuk input sanitization
- **Environment protection**: `.env` dan `session/` tidak ter-upload ke Git

### 💬 Conversation Management
- **Memory per user**: Context tersimpan per nomor WhatsApp
- **History management**: Clear conversation via API
- **Message logging**: All messages logged for debugging

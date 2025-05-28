# Security Policy

## 🔒 Data Sensitif yang Dilindungi

Repository ini melindungi data sensitif berikut dari upload ke GitHub:

### 1. Environment Variables (`.env`)
- **API Keys**: OpenAI, OpenRouter, Google Gemini
- **Konfigurasi sensitif lainnya**
- **Solusi**: Gunakan `.env.example` sebagai template

### 2. WhatsApp Session Data (`/session/`)
- **File autentikasi WhatsApp**
- **Pre-keys dan state sync**
- **Credentials dan session tokens**
- **Solusi**: Folder `session/` di-exclude dari git

### 3. File Backup dan Temporary
- **File backup dengan ekstensi `.backup`, `.bak`**
- **File temporary**
- **Cache files**

## 🛡️ Langkah Keamanan

### Setup Environment yang Aman

1. **Copy template environment**:
   ```bash
   cp .env.example .env
   ```

2. **Isi dengan API key asli**:
   - Dapatkan API key dari provider yang dipilih
   - Ganti placeholder dengan key asli
   - JANGAN share atau commit file `.env`

3. **Verifikasi .gitignore**:
   - Pastikan `.env` dan `session/` ter-exclude
   - Check dengan: `git status`

### API Key Management

- **OpenAI**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **OpenRouter**: [openrouter.ai](https://openrouter.ai/)
- **Google Gemini**: [aistudio.google.com](https://aistudio.google.com/)

### Best Practices

1. **Jangan hardcode API keys di source code**
2. **Gunakan environment variables**
3. **Regenerate API keys jika terexpose**
4. **Monitor usage API untuk aktivitas mencurigakan**
5. **Backup session data secara terpisah dan aman**

## 🚨 Jika API Key Terexpose

1. **Segera revoke/regenerate API key**
2. **Update `.env` dengan key baru**
3. **Monitor billing/usage untuk aktivitas tidak normal**
4. **Restart aplikasi dengan key baru**

## 📞 Melaporkan Masalah Keamanan

Jika menemukan vulnerability atau masalah keamanan:

1. **JANGAN** buat issue public
2. **Hubungi maintainer secara private**
3. **Berikan detail lengkap masalah**
4. **Tunggu response sebelum disclosure**

# WA-aichatbot

## Deskripsi

Wa-aichatbot adalah aplikasi bot WhatsApp yang terintegrasi dengan kecerdasan buatan (AI) seperti OpenAI, Gemini, dan OpenRouter. Bot ini dapat melakukan auto-reply berbasis AI, mengelola katalog produk, serta menyediakan dashboard web sederhana untuk monitoring dan pengelolaan.

## Fitur Utama
- Auto-reply WhatsApp berbasis AI (OpenAI, Gemini, OpenRouter)
- Dashboard web untuk monitoring dan pengelolaan bot
- Katalog produk yang mudah diatur
- Konfigurasi mudah melalui file di folder `config/`
- API endpoint untuk integrasi eksternal

## Instalasi
1. Pastikan sudah menginstall [Node.js](https://nodejs.org/) dan [pnpm](https://pnpm.io/)
2. Clone repository ini:
   ```bash
   git clone git@github.com:paijoe29/wa-aichatbot.git
   cd wa-aichatbot
   ```
3. Install dependencies dengan pnpm:
   ```bash
   pnpm install
   ```
4. Salin file `.env.example`  menjadi `.env` lalu atur variabel environment (API key, dsb)

## Menjalankan Aplikasi
- Untuk menjalankan aplikasi:
  ```bash
  pnpm start
  ```

- Setelah server berjalan, buka dashboard di [http://localhost:3002](http://localhost:3002)

## Struktur Folder Penting
- `config/` : Konfigurasi bot, produk, blacklist, dsb
- `public/` : Dashboard web dan katalog produk
- `routes/` : API endpoint (whatsapp, ai, produk)
- `services/` : Logika utama bot dan integrasi AI



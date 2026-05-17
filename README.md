# Aura CRM - Production Ready Intelligence

Welcome to your new CRM. This system is designed for high-performance lead management, visual sales pipelines, and automated cloud backups.

## 🚀 Getting Started

### 1. Prerequisite
- You have Node.js installed.

### 2. Configuration (Google Drive Backup)
To enable Google Drive backups:
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Enable **Google Drive API**.
3. Create **OAuth 2.0 Credentials**.
4. In `backend/.env`, set:
   ```
   GOOGLE_CLIENT_ID=your_id
   GOOGLE_CLIENT_SECRET=your_secret
   GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/callback
   ```

### 3. Run the Application
Double-click `run-crm.bat` in the root directory.

OR manually:
- **Backend**: `cd backend && node index.js`
- **Frontend**: `cd frontend && npm run dev`

## 💎 Features
- **Intelligent Dashboard**: Real-time revenue analytics and lead distribution charts.
- **Lead Management**: Advanced prospect tracking with source analysis.
- **Sales Pipeline**: Kanban drag-style visualization of your active deals.
- **Cloud Security**: One-click encrypted backup to your own Google Drive.
- **Premium UI**: Modern dark theme with glassmorphism and smooth animations.

## 📁 Tech Stack
- **Frontend**: React, TypeScript, Vite, Framer Motion, Lucide-React.
- **Backend**: Node.js, Express, Better-SQLite3 (Fast & Local).
- **Styling**: Modern CSS3 (Variables, Backdrop filters, Gradients).

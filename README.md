# OfficeCompanion ⚡ AI-Native Work Management System

OfficeCompanion is an intelligent workplace productivity platform designed to synthesize daily planning, meeting intelligence, task prioritization, and follow-ups on an AI-native canvas.

---

## ✨ Features

- **Autonomous Meeting Intelligence**: Summarize action items, commitments, blockers, and transcript analysis with one-click conversion to actionable tasks.
- **Context-Aware Daily Planner**: Plan your workday with smart time-blocking, AI urgency ranking, and deep work focus sessions.
- **Google Cloud Console OAuth & Identity Services**: Secure single sign-on with Google Identity Services, customized role & department onboarding, and live OAuth integration.
- **Smart Follow-Ups**: Intelligent follow-up tracking with reminder notifications and status lifecycles.
- **Productivity Insights & Activity Feed**: Real-time analytics, completed velocity charts, and activity audit logs.
- **Secure Multi-User Architecture**: Isolated user workspaces backed by MongoDB and JWT authentication.

---

## 🛠 Tech Stack

### Frontend
- **React 19 + TypeScript** with **Vite**
- **Tailwind CSS**
- **Lucide Icons** & **Recharts**
- **Google Identity Services (GSI)**

### Backend
- **Node.js** & **Express.js**
- **MongoDB** with **Mongoose** (with automated fallback memory server)
- **JWT (JSON Web Tokens)** & **Bcrypt**
- **Google OAuth Token Verification**

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Mathanprasath-T/officeCompanion.git
cd officeCompanion
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` folder based on `.env.example`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/officecompanion
JWT_SECRET=your-secure-jwt-secret
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
```
Run backend dev server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```
Create a `.env` file in the `frontend` folder based on `.env.example`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```
Run frontend dev server:
```bash
npm run dev
```

---

## 🔑 Google Cloud Console Configuration

1. Visit [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** (Type: *Web Application*).
3. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173`
   - `http://localhost:5000`
4. Under **Authorized redirect URIs**, add:
   - `http://localhost:5173`
   - `http://localhost:5000/api/auth/google/callback`
5. Copy your **Client ID** into `backend/.env` and `frontend/.env`.

---

## 📄 License
ISC

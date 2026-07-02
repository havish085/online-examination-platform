# Online Examination & Assessment Platform

A secure, production-ready, feature-rich web application built with **React 18, TypeScript, Vite, Tailwind CSS, Recharts, Headless UI, Firebase, and Vertex AI Gemini**.

This application solves the limitations of traditional paper-based and legacy online testing platforms by introducing real-time answer auto-saving, a cheating-resistant synchronized timer, detailed candidate analytics, and automated MCQ generation using Gemini AI.

---

## 🚀 Tech Stack

### Frontend
- **React 18 & TypeScript** (scaffolded with Vite)
- **Tailwind CSS v3** (premium themes, dark-mode styling, transitions)
- **React Router v6** (role-based routes and route guards)
- **React Hook Form** (performant form state and validation)
- **Recharts** (interactive analytics charts)
- **Headless UI** (accessible visual components)
- **jspdf** (client-side PDF scorecard downloads)

### Backend & Cloud Services
- **Firebase Authentication** (Google OAuth + Email/Password sign-ins)
- **Cloud Firestore** (structured collections, compound indexes, secure rules)
- **Firebase Cloud Functions** (v2 HTTP callable TS modules for AI generation & secure evaluations)
- **Firebase Hosting** (global CDN distribution)
- **Gemini AI** (Vertex AI Gemini 1.5 Flash via Firebase Functions SDK)

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- **Node.js** (v18 or v20 recommended)
- **Firebase CLI** installed globally:
  ```bash
  npm install -g firebase-tools
  ```

### 2. Installation
Clone or navigate to the project directory and install the packages:
```bash
# Install frontend dependencies
npm install --legacy-peer-deps

# Install Cloud Functions dependencies
cd functions
npm install
cd ..
```

### 3. Running Locally
Run the React Vite dev server:
```bash
npm run dev
```
The application will start running at `http://localhost:5173`.

---

## ☁️ Deployment Guide

Since this project uses Firebase Hosting, Firestore Rules, and Cloud Functions, you can deploy the complete stack using the Firebase CLI.

### Step 1: Login to Firebase
Authenticate the Firebase CLI with your Google/Firebase account:
```bash
firebase login
```

### Step 2: Build the Application
Compile both Cloud Functions and the React Vite frontend:
```bash
# Build functions
cd functions && npm run build && cd ..

# Build frontend
npm run build
```

### Step 3: Deploy to Cloud
Deploy Hosting, Firestore Rules, and Cloud Functions with a single command:
```bash
firebase deploy
```
Once deployment completes, the CLI will output your public **Firebase Hosting URL**.

---

## 📝 Folder Structure

```
online-examination-platform/
├── firebase.json            # Firebase services config
├── firestore.rules          # Security rules
├── firestore.indexes.json   # Composite indexes
├── tsconfig.json            # TypeScript base configurations
├── functions/               # Cloud Functions (TypeScript)
│   ├── src/
│   │   ├── index.ts         # Secure attempt submission & evaluator
│   │   └── gemini.ts        # Vertex AI Gemini generator
│   └── package.json
└── src/                     # React Frontend (TypeScript)
    ├── firebase.ts          # Firebase SDK initialization
    ├── App.tsx              # Router & layout shell
    ├── context/
    │   └── AuthContext.tsx  # Google Login, signup, roles state
    ├── components/
    │   ├── Navbar.tsx       # Profile menu, dark-mode toggle
    │   ├── Sidebar.tsx      # Collapsible role-based side nav
    │   └── ProtectedRoute.tsx # Auth & role router guard
    ├── pages/
    │   ├── Login.tsx
    │   ├── Register.tsx     # Role choices (Student / Faculty)
    │   ├── Dashboard.tsx    # Role dispatcher dashboard
    │   ├── student/         # Student workspace (Attempts, timers, PDF)
    │   ├── faculty/         # Faculty console (CRUD, AI MCQ, Analytics)
    │   └── admin/           # Platform controller (Auditing, Users)
    └── utils/
        └── pdfGenerator.ts  # jsPDF scorecard compiler
```

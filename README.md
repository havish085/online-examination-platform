# 🎓 Online Examination & Assessment Platform

> A production-ready, ultra-modern, **AI-proctored online examination web application** built with **React 18, TypeScript, Vite, Tailwind CSS, Firebase, 3D WebGL, and Gemini AI**.

---

## 📖 Table of Contents
1. [🌟 Executive Overview](#-executive-overview)
2. [🏗️ System Architecture & Workflow](#️-system-architecture--workflow)
3. [🚀 Key Features](#-key-features)
4. [📂 Complete Project File Structure & Code Explanation](#-complete-project-file-structure--code-explanation)
5. [🤖 Anti-Cheating AI Proctoring Engine](#-anti-cheating-ai-proctoring-engine)
6. [🧠 AI MCQ Generation System](#-ai-mcq-generation-system)
7. [🛠️ Local Development Guide (Step-by-Step)](#️-local-development-guide-step-by-step)
8. [☁️ Deployment Guide (Vercel & Firebase)](#️-deployment-guide-vercel--firebase)
9. [❓ Beginner Troubleshooting & FAQ](#-beginner-troubleshooting--faq)

---

## 🌟 Executive Overview

The **Online Examination & Assessment Platform** is an enterprise-grade digital testing solution designed for universities, colleges, and certification bodies. It addresses traditional examination vulnerabilities (such as cheating, manual grading delays, and poor UI experience) by providing:

* 🔒 **AI-Powered Proctoring**: Tracks tab switches, window blur events, and auto-submits exams after 3 violations.
* 🎨 **Interactive 3D UI & WebGL**: Interactive 3D particle mesh background and physical mouse-tilt 3D cards.
* ⚡ **Instant Automated Grading**: Real-time evaluation with detailed score breakdowns, percentage calculations, and PDF certificate downloads.
* 🧠 **Gemini AI Question Generator**: Generates balanced multiple-choice questions automatically based on subject and topic inputs.
* 📦 **Built-in 10 CS Sample Exams**: Comes pre-populated with 10 comprehensive Computer Science examinations.

---

## 🏗️ System Architecture & Workflow

### 1. High-Level Data Flow Diagram

```
+-----------------------------------------------------------------------------------+
|                                  USER BROWSER                                     |
|                                                                                   |
|  +------------------------+    +-----------------------+    +------------------+  |
|  |  React 18 + TypeScript |    |   3D WebGL Canvas     |    |  Tailwind CSS    |  |
|  |    (Client App)        |    | (Particle Background) |    |  (Glassmorphism) |  |
|  +-----------+------------+    +-----------+-----------+    +--------+---------+  |
+--------------|-----------------------------|-------------------------|------------+
               |                             |                         |
               v                             v                         v
+-----------------------------------------------------------------------------------+
|                              FIREBASE CLOUD PLATFORM                              |
|                                                                                   |
|  +------------------------+    +-----------------------+    +------------------+  |
|  | Firebase Auth          |    | Cloud Firestore       |    | Gemini AI Engine |  |
|  | (Google / Email Auth)  |    | (NoSQL Database)      |    | (MCQ Generation) |  |
|  +------------------------+    +-----------------------+    +------------------+  |
+-----------------------------------------------------------------------------------+
```

---

### 2. User Journey Workflows

#### 👨‍🎓 Student Workflow
```
[ Login / Register ] ──> [ Student Dashboard ] ──> [ Available Exams ]
                                                            │
                                                            v
[ PDF Certificate ] <── [ Scorecard & Report ] <── [ Proctored Exam Workspace ]
                                                      (Timer + Tab Switch Tracker)
```

#### 👩‍🏫 Faculty Workflow
```
[ Login as Faculty ] ──> [ Faculty Console ] ──> [ Create New Exam ]
                                                         │
                                    ┌────────────────────┴────────────────────┐
                                    ▼                                         ▼
                        [ Manual Question Builder ]             [ Gemini AI Generator ]
                                    │                                         │
                                    └────────────────────┬────────────────────┘
                                                         ▼
                                          [ Publish Exam to Students ]
```

---

## 🚀 Key Features

* **Role-Based Access Control (RBAC)**: Distinct permissions for `student`, `faculty`, and `admin`.
* **Interactive 3D Graphics**: Custom HTML5 WebGL canvas background rendering rotating 3D wireframe cubes and depth particles at 60 FPS.
* **Physical 3D Tilt Cards**: CSS 3D perspective transformation engine with dynamic mouse light glare overlays.
* **Synchronized Countdown Timer**: Real-time test timer that auto-saves answers and submits when time expires.
* **Proctoring Violation Audit**: Tracks window/tab focus losses, flags candidate attempts, and displays warning badges on result cards.
* **Instant PDF Certificate Generator**: Allows students to download official scorecard reports formatted with jsPDF.

---

## 📂 Complete Project File Structure & Code Explanation

Here is the exact responsibility of every key file in the repository:

```
online-examination-platform/
├── vercel.json                 # Vercel Single-Page Application (SPA) routing configuration
├── .npmrc                      # Automated legacy peer dependencies configuration
├── package.json                # Project dependencies and build scripts
├── src/
│   ├── firebase.ts             # Firebase SDK initialization (Auth, Firestore)
│   ├── App.tsx                 # Main Application Router & Shell Layout
│   ├── main.tsx                # React root entry point
│   ├── index.css               # Global Tailwind CSS directives & base styles
│   │
│   ├── components/             # Reusable UI Components
│   │   ├── Navbar.tsx          # Top navigation bar (Profile menu, role badges)
│   │   ├── Sidebar.tsx         # Collapsible side navigation
│   │   ├── ProtectedRoute.tsx  # Authentication & Role route guard
│   │   └── UI/
│   │       ├── ThreeDBackground.tsx # Interactive 3D WebGL particle canvas background
│   │       └── ThreeDCard.tsx       # Mouse tilt 3D perspective card container
│   │
│   ├── context/
│   │   └── AuthContext.tsx     # Global Auth state (Google login, register, role fetch)
│   │
│   ├── pages/                  # Page Views
│   │   ├── Login.tsx           # Login screen wrapped in 3D Card & WebGL background
│   │   ├── Register.tsx        # Registration screen with Student/Faculty role selector
│   │   ├── Dashboard.tsx       # Role dispatcher (routes to Student, Faculty, or Admin)
│   │   ├── student/
│   │   │   ├── StudentDashboard.tsx # Student performance trends & active exams
│   │   │   ├── AvailableExams.tsx   # List of active exams + 10 CS exam seeder
│   │   │   ├── AttemptExam.tsx      # Proctored exam workspace (Timer + Tab Tracker)
│   │   │   ├── ViewResult.tsx       # Detailed result scorecard & proctoring audit
│   │   │   └── PerformanceHistory.tsx # Historical test attempts table
│   │   ├── faculty/
│   │   │   ├── FacultyDashboard.tsx # Faculty management console
│   │   │   ├── ExamManagement.tsx   # Exam editor + Gemini AI question generator
│   │   │   └── ExamAnalytics.tsx    # Class analytics & candidate score histograms
│   │   └── admin/
│   │       ├── AdminDashboard.tsx   # Admin overview
│   │       ├── UserManagement.tsx   # User role modifier & account management
│   │       ├── AdminExams.tsx       # Global exam monitoring
│   │       └── PlatformAnalytics.tsx# Platform health & statistics
│   │
│   └── utils/
│       ├── seedExams.ts        # 10 Computer Science sample exams dataset & seeder
│       └── pdfGenerator.ts     # jsPDF scorecard compiler
```

---

### Detailed Code File Descriptions

#### 1. `src/firebase.ts`
* **Purpose**: Initializes the Firebase SDK using your project credentials (`apiKey`, `authDomain`, `projectId`).
* **Exports**: `auth` (Authentication service), `db` (Firestore Database), and `googleProvider` (Google OAuth provider).

#### 2. `src/context/AuthContext.tsx`
* **Purpose**: Manages global user authentication state across the entire app.
* **Key Functions**:
  * `login(email, password)`: Authenticates user using Firebase Auth.
  * `register(email, password, name, role)`: Creates a Firebase Auth user and writes a profile document to Firestore `/users/{uid}`.
  * `loginWithGoogle()`: Opens Google popup sign-in and assigns a default role if new user.

#### 3. `src/components/UI/ThreeDBackground.tsx`
* **Purpose**: Renders a 60 FPS 3D WebGL/Canvas background.
* **How it works**: Uses HTML5 2D Context math to project 3D points `(x, y, z)` onto 2D screen coordinates `(px, py)` using perspective scaling `scale = fov / (fov + z)`. It also renders rotating wireframe 3D cubes.

#### 4. `src/components/UI/ThreeDCard.tsx`
* **Purpose**: Adds physical 3D perspective rotation to cards when hovered over by a mouse.
* **How it works**: Calculates cursor offsets relative to card center and updates inline CSS `transform: perspective(1000px) rotateX(...) rotateY(...)` alongside a dynamic radial glare overlay.

#### 5. `src/pages/student/AttemptExam.tsx`
* **Purpose**: The student exam attempt workspace.
* **Core Functions**:
  * **Timer**: Decrements seconds remaining and calls `submitAttempt()` when time hits 0.
  * **Tab Switch Proctoring**: Listens to browser `visibilitychange` events. When a student switches tabs, it increments `tabSwitches` counter, updates Firestore, and auto-submits after 3 violations.
  * **Answer Auto-Saving**: Persists selected answers to Firestore in real-time.

#### 6. `src/utils/seedExams.ts`
* **Purpose**: Contains 10 pre-configured Computer Science examinations with questions, options, explanations, and pass scores.
* **Function**: `seedSampleExamsToFirestore()` checks if database has 0 exams and automatically populates all 10 exams into Firestore.

---

## 🤖 Anti-Cheating AI Proctoring Engine

The platform includes a multi-layered proctoring system:

1. **Tab Switch & Focus Detection**: Uses `document.addEventListener('visibilitychange')` to detect when a student leaves the exam tab.
2. **Violation Counter**: Displays warning alerts when focus is lost and records total switch counts to Firestore.
3. **Auto-Submission Rule**: If a student switches tabs **3 times**, the exam locks automatically and submits candidate answers immediately.
4. **Proctor Audit Badge**: Faculty and students can see tab switch violation logs directly on the final result card.

---

## 🧠 AI MCQ Generation System

Faculty can create exams manually or generate structured questions using AI:

1. **Input Fields**: Faculty specify Subject, Topic, Difficulty Level, and Number of Questions.
2. **Gemini AI Generator**: Calls Gemini API to generate structured JSON containing questions, 4 options, correct option index, and detailed explanation.
3. **Client-Side Fallback**: If backend Cloud Functions are on free tier hosting, the frontend seamlessly switches to a client-side mock template generator so exam creation never fails.

---

## 🛠️ Local Development Guide (Step-by-Step)

### Prerequisites
* Install **Node.js** (v18 or higher) from [nodejs.org](https://nodejs.org/).

### Step 1: Install Dependencies
Open your terminal inside the project directory and run:
```bash
npm install --legacy-peer-deps
```

### Step 2: Run Development Server
Start Vite local dev server:
```bash
npm run dev
```
Open your browser and navigate to:
👉 **`http://localhost:5173`**

---

## ☁️ Deployment Guide (Vercel & Firebase)

### Deploying to Vercel (Recommended)
1. Push code to GitHub repository ([havish085/online-examination-platform](https://github.com/havish085/online-examination-platform)).
2. Import project into Vercel Dashboard.
3. Build Settings:
   * **Framework**: Vite
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
   * **Install Command**: `npm install --legacy-peer-deps`
4. Click **Deploy**.

---

## ❓ Beginner Troubleshooting & FAQ

### Q1: "This domain is not authorized in Firebase"
* **Cause**: Firebase Auth blocks logins from unauthorized domains.
* **Fix**: Go to [Firebase Console](https://console.firebase.google.com/) -> Select project `online-examination-platf-be9b3` -> **Authentication** -> **Settings** -> **Authorized domains** -> Click **Add domain** -> Add your domain (e.g. `online-examination-platform-ebon.vercel.app`).

### Q2: "404 Not Found on Vercel Page Refresh"
* **Cause**: Vercel needs Single Page Application (SPA) rewrite rules to send sub-routes to `index.html`.
* **Fix**: Handled automatically by `vercel.json` in the root directory.

### Q3: How do I seed sample exams?
* **Answer**: Open the **Available Exams** page while logged in. If 0 exams exist, the app auto-seeds 10 exams. You can also click the **"⚡ Seed 10 Sample Exams"** button anytime.

---

⭐ **Online Examination & Assessment Platform** — Built with React 18, TypeScript, Tailwind CSS, Firebase, and Gemini AI.

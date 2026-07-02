# Technical Documentation: Online Examination & Assessment Platform

## 1. Project Abstract
The **Online Examination & Assessment Platform** is a secure, web-based assessment application designed to streamline educational testing. Built using React, TypeScript, Tailwind CSS, Firestore, and Firebase Cloud Functions, it automates exam creation, scheduling, candidate evaluation, and analytics reporting. Leveraging Gemini AI (Gemini 1.5 Flash), the platform empowers faculty members to generate high-quality Multiple Choice Questions (MCQs) programmatically based on specific subject areas and difficulty settings. Candidates benefit from a cheating-resistant workspace featuring synchronized timer counters, auto-saving progress, and immediate scorecard feedback with PDF download support.

---

## 2. Problem Statement
Traditional paper-based academic testing suffers from significant administrative overhead, high paper and logistic costs, long grading delays, and increased vulnerability to evaluation errors. Existing online solutions often lack:
1. Robust mechanisms to handle student device failures or page refreshes (causing timer manipulation or progress loss).
2. Advanced security to hide answer keys and explanations until the exam has officially ended.
3. Automated question generation, requiring faculty to manually write every item, which is highly time-consuming.
4. Clean, responsive interfaces with visual analytics dashboards to monitor candidate performance or check question difficulty factors.

---

## 3. Objectives
- **Automated Grading & Analytics**: Implement automated evaluation on submission with rank calculations and score histograms (using Recharts).
- **Secure Candidate Workspace**: Build an exam workspace enforcing a single attempt, synchronized countdown timers, and background auto-saving of answers.
- **AI-Powered Question Generation**: Integrate Gemini AI via Firebase Cloud Functions to create structured MCQs (questions, options, correct answers, explanations) that faculty can review and edit.
- **Role-Based Control & Security**: Provide specialized interfaces for Students, Faculty, and Administrators, backed by robust database rules hiding explanations until the exam deadline passes.
- **Document Generation**: Support generating and downloading client-side scorecards in PDF format.

---

## 4. Architecture
The platform is designed around a Serverless, decoupled architecture.

### ASCII Diagram
```
                     +---------------------------------------+
                     |         React 18 SPA Frontend         |
                     |  (Router, Hook Form, Recharts, jsPDF) |
                     +-------------------+-------------------+
                                         |
                       Firebase Auth /   |  Callable https calls
                       Firestore queries |  (secure evaluation & AI)
                                         v
     +-----------------------------------+-------------------+
     |                     Firebase Cloud Services           |
     |                                                       |
     |  +--------------------+  +-------------------------+  |
     |  |   Firebase Auth    |  |     Cloud Functions     |  |
     |  | (Google / Email)   |  | (evaluator, stats, AI)  |  |
     |  +---------+----------+  +------------+------------+  |
     |            |                          |               |
     |            v                          v               |
     |  +---------+----------+  +------------+------------+  |
     |  |     Firestore      |  |     Gemini 1.5 Flash    |  |
     |  |  (Database Rules)  |  | (callable question gen) |  |
     |  +--------------------+  +-------------------------+  |
     +-------------------------------------------------------+
```

---

## 5. Database Design (Firestore Collections)

### 5.1 `users`
- **Path**: `users/{userId}`
- **Fields**:
  - `uid`: `string`
  - `email`: `string`
  - `displayName`: `string`
  - `role`: `'student' | 'faculty' | 'admin'`
  - `createdAt`: `timestamp`
  - `status`: `'active' | 'blocked'`

### 5.2 `exams`
- **Path**: `exams/{examId}`
- **Fields**:
  - `id`: `string`
  - `title`: `string`
  - `description`: `string`
  - `subject`: `string`
  - `topic`: `string`
  - `duration`: `number` (minutes)
  - `startTime`: `timestamp`
  - `endTime`: `timestamp`
  - `createdBy`: `string` (Faculty UID)
  - `isPublished`: `boolean`
  - `totalQuestions`: `number`
  - `totalMarks`: `number`
  - `passPercentage`: `number`

### 5.3 `questions`
- **Path**: `exams/{examId}/questions/{questionId}`
- **Fields**:
  - `id`: `string`
  - `questionText`: `string`
  - `options`: `{ A: string, B: string, C: string, D: string }`
  - `difficulty`: `'easy' | 'medium' | 'hard'`
  - `marks`: `number`

### 5.4 `answers` (Secure Answer Key Storage)
- **Path**: `exams/{examId}/answers/{questionId}`
- **Fields**:
  - `correctAnswer`: `'A' | 'B' | 'C' | 'D'`
  - `explanation`: `string`

### 5.5 `attempts`
- **Path**: `attempts/{attemptId}` (where `attemptId` is `${userId}_${examId}`)
- **Fields**:
  - `id`: `string`
  - `examId`: `string`
  - `userId`: `string`
  - `answers`: `map { [questionId]: optionLetter }`
  - `startTime`: `timestamp`
  - `submittedAt`: `timestamp`
  - `isSubmitted`: `boolean`
  - `timeTaken`: `number` (seconds)

### 5.6 `results`
- **Path**: `results/{attemptId}`
- **Fields**:
  - `id`: `string` (matches attemptId)
  - `examId`: `string`
  - `userId`: `string`
  - `score`: `number`
  - `percentage`: `number`
  - `correctCount`: `number`
  - `wrongCount`: `number`
  - `rank`: `number`
  - `submittedAt`: `timestamp`
  - `timeTaken`: `number` (seconds)

### 5.7 `analytics`
- **Path**: `analytics/{examId}`
- **Fields**:
  - `examId`: `string`
  - `averageScore`: `number`
  - `highestScore`: `number`
  - `lowestScore`: `number`
  - `passPercentage`: `number`
  - `distribution`: `map { "0-20": number, "21-40": number, "41-60": number, ... }`
  - `totalAttempts`: `number`
  - `updatedAt`: `timestamp`

---

## 6. Authentication & Authorization Flow
1. **Sign-In**: Users sign in via Google Provider or Email/Password credentials.
2. **Profile Creation**: If a new login occurs, `AuthContext` writes a profile record in Firestore `users/{uid}` defaulting to role `'student'`.
3. **Role Checks**: Protected routes check the `role` field on the user document in Firestore to prevent unauthorized access (e.g. students accessing `/admin` or `/faculty` routes).

---

## 7. Security Design
1. **Hiding Solutions**: Student questions contain only the prompt and option bodies. Answer keys and explanations are stored in the `/answers` subcollection, which is protected in Firestore Security Rules. Reading is restricted to admins/faculty OR to authenticated students *only* after the parent exam's `endTime` timestamp has passed.
2. **Evaluation Isolation**: Calculation of exam scores occurs inside the `submitExamAttempt` Cloud Function running with server-side admin privileges, making it impossible for students to write arbitrary scores or read answer keys during an active exam.

---

## 8. Cloud Functions
- **`generateAIQuestions`**: Receives prompt criteria (subject, topic, count, difficulty), requests Gemini, and returns a verified JSON array of MCQs.
- **`submitExamAttempt`**: Locks the student's attempt, counts correct/wrong options using `/answers`, writes the `results` document, computes current rank, and triggers recalculation of exam average scores.

---

## 9. AI Integration
We utilize Vertex AI Gemini 1.5 Flash. The prompt specifies structural formatting parameters to ensure Gemini outputs a standardized, parseable JSON array. The Cloud Function cleans markdown delimiters (like ` ```json ` wrappers) before executing `JSON.parse` to ensure structural integrity and prevent parsing errors.

---

## 10. Deployment
1. Frontend compiled via Vite and deployed to Firebase Hosting:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```
2. Security Rules deployed to Firestore:
   ```bash
   firebase deploy --only firestore
   ```
3. Cloud Functions transpiled via TypeScript and deployed:
   ```bash
   firebase deploy --only functions
   ```

---

## 11. Future Scope
1. **AI Proctoring**: Implement web-camera tracking, tab-switching alerts, and window-focus listeners to block cheating behavior.
2. **Audio/Video Questions**: Support rich media attachments in questions.
3. **Subjective Evaluator**: Leverage Gemini to review short-text paragraph answers by comparing key criteria.

---

## 12. Testing
- Verified login and signup routes.
- Simulated device refresh during exam attempts—the countdown timer loaded the server's `startTime` and resumed accurately.
- Verified that students cannot read answers before `endTime` using standard client SDK queries.

---

## 13. Limitations
- **Cold Starts**: Firebase Cloud Functions (v2) may experience a minor latency delay (cold start) during initial requests.
- **Offline Mode**: A stable network connection is required to autosave responses.

---

## 14. Conclusion
The Online Examination Portal offers a highly secure, modern, and robust testing stack. By combining secure server-side evaluations, Gemini-powered question generators, and real-time auto-saving workspaces, it provides an outstanding solution for academic institutions.

---

## 15. 25 Viva Questions & Answers

#### Q1. How do you implement role-based routing in React?
**A**: We wrap specific `<Route>` blocks inside a `<ProtectedRoute>` component which checks the user profile's `role` value fetched from Firestore, redirecting to `/dashboard` if unauthorized.

#### Q2. Why did you use Cloud Functions instead of client-side logic to evaluate exam scores?
**A**: Client-side score calculation would require fetching the answer key from Firestore. This exposes the answers to tech-savvy students who can inspect network traffic. Moving it to Cloud Functions keeps the answer keys secure on the server.

#### Q3. How do you prevent cheating via page refreshes during an exam?
**A**: When a student starts an exam, we write a `startTime` stamp to Firestore. If they refresh, the application re-fetches this timestamp, compares it with the current server time, and resumes the timer without resetting it.

#### Q4. What is the benefit of using `JSON` output generation configuration in Gemini?
**A**: It guarantees that Gemini will format its response as a structured JSON object/array matching our parameters, eliminating the risk of receiving conversational conversational text that would fail JSON parsing.

#### Q5. How does your platform handle auto-saving answers?
**A**: We bind an `onChange` listener to the question option buttons. When clicked, it updates the local state and writes to the `/attempts` Firestore document in the background.

#### Q6. What is the role of Firestore Security Rules in this project?
**A**: They enforce database-level access checks, ensuring students can only read/write their own attempts, and blocking access to correct answers/explanations until the exam's `endTime` has passed.

#### Q7. Why did you choose Vite over Create React App (CRA)?
**A**: Vite uses native ES modules and is extremely fast during development, providing near-instant hot module reloading (HMR) and highly optimized production builds using Rollup.

#### Q8. How is the candidate's rank calculated?
**A**: When an attempt is submitted, a Cloud Function queries the `results` collection for that exam, counts how many students scored higher than the current student, and assigns `rank = count + 1`.

#### Q9. How do you download the result card as a PDF?
**A**: We use the `jspdf` library in the client. We extract result stats and draw text elements, grids, and pass/fail badges onto a jsPDF canvas, downloading it directly.

#### Q10. What is a "callable" Cloud Function in Firebase?
**A**: A callable function is an HTTPS endpoint that uses the Firebase Functions protocol. It handles serializing data, passing authorization headers, and CORS requests automatically, allowing direct calls from React.

#### Q11. How do you support Dark Mode in your design?
**A**: We use Tailwind's `class` dark-mode selector. When toggled, we add or remove the `dark` class from the `document.documentElement` and persist the setting in `localStorage`.

#### Q12. What does `skipLibCheck` do in `tsconfig.json`?
**A**: It skips type checking of declaration files (`.d.ts`), which speeds up compiling and avoids build errors caused by mismatched node/browser types in third-party libraries.

#### Q13. How does the AI Question Generator handle formatting errors from Gemini?
**A**: We clean standard markdown text markers (like ` ```json ` and ` ``` `) from the response text using regex, and wrap the parsing in a try-catch block to handle syntax errors.

#### Q14. What are compound indexes in Firestore?
**A**: They are indexes that map multiple fields in a collection, required for queries that filter by one field (e.g. `isPublished`) and sort by another (e.g. `startTime`).

#### Q15. How do you prevent a student from submitting an exam attempt twice?
**A**: In Firestore, the attempt document ID is mapped as `${userId}_${examId}`. When a student attempts to load the workspace, the system checks if the document has `isSubmitted == true`. If so, it blocks access and redirects them.

#### Q16. What is the difference between a Firebase Cloud Function and a standard REST API?
**A**: Firebase Cloud Functions are serverless, event-driven triggers that run in isolated containers. They scale automatically, cost money only when called, and integrate natively with Firebase SDKs.

#### Q17. How does Recharts render visualizations?
**A**: Recharts uses SVG elements rendered dynamically inside React components, making the charts responsive, interactive, and lightweight.

#### Q18. What is the purpose of `.firebaserc`?
**A**: It maps local projects to their corresponding Firebase console project IDs, making it easy to switch environments (like development, staging, and production).

#### Q19. How do you handle input validation in forms?
**A**: We use `react-hook-form` to register inputs, define validation patterns (like email regex or password min length), and display visual error messages inline.

#### Q20. What does `@apply` do in Tailwind CSS?
**A**: It allows injecting utility classes into custom CSS rules in `index.css`, keeping stylesheets clean and centralized.

#### Q21. How do you check if a student submitted after the exam deadline?
**A**: The `submitExamAttempt` Cloud Function compares the current server timestamp with the exam's `endTime`. If the current time exceeds the deadline, the submission is rejected.

#### Q22. How do you handle empty states in dashboards?
**A**: We check the arrays length. If zero, we display a visually pleasing placeholder card with a friendly icon and a call-to-action button.

#### Q23. Why do we need `useAuth` hook?
**A**: It acts as a shortcut to contextually access user data (role, auth state) and login/logout methods from any React component without prop drilling.

#### Q24. Can Firestore trigger functions on document write?
**A**: Yes, Firestore triggers (like `onDocumentCreated` or `onDocumentUpdated`) can run server-side logic automatically in the background when documents are modified.

#### Q25. What is the purpose of `writeBatch` in Firestore?
**A**: A batch write combines multiple write, set, or delete operations and commits them as a single atomic transaction. Either all operations succeed, or none do.

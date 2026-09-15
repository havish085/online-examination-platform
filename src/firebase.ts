import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyAJRSxrEsUSiTwk2IySSIUifPAzJeCwLAg",
  authDomain: "online-examination-platf-be9b3.firebaseapp.com",
  projectId: "online-examination-platf-be9b3",
  storageBucket: "online-examination-platf-be9b3.firebasestorage.app",
  messagingSenderId: "2501014297",
  appId: "1:2501014297:web:f872230ad54dfdcda6cb88",
  measurementId: "G-V4CXYF5NQ2"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "us-central1");
export const googleProvider = new GoogleAuthProvider();

export { httpsCallable };
export default app;

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyB3_1lREx_u8uZ-8cP5HZGAiPh5x5MdDeI",
  authDomain: "online-examination-platf-1a2b6.firebaseapp.com",
  projectId: "online-examination-platf-1a2b6",
  storageBucket: "online-examination-platf-1a2b6.firebasestorage.app",
  messagingSenderId: "862955269904",
  appId: "1:862955269904:web:bfb58e5eab7c2df0ae7f95",
  measurementId: "G-RC04BMG2MM"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "us-central1");
export const googleProvider = new GoogleAuthProvider();

export { httpsCallable };
export default app;

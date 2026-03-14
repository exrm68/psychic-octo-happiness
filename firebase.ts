import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyACSM3yj_7oj_nm1FTa-EH9-RyeF0k3VyU",
  authDomain: "cineflix-universe.firebaseapp.com",
  projectId: "cineflix-universe",
  storageBucket: "cineflix-universe.firebasestorage.app",
  messagingSenderId: "387496004176",
  appId: "1:387496004176:web:73a9bfa510c6d4db07df55"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
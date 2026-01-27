import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAEWdCMq0CDFt65rqhL3USzCfdzH2sM-vU",
  authDomain: "gestion-clients-9104b.firebaseapp.com",
  projectId: "gestion-clients-9104b",
  storageBucket: "gestion-clients-9104b.appspot.com",
  messagingSenderId: "862838385245",
  appId: "1:862838385245:web:32942be0abdb0bfdaebbb4",
  measurementId: "G-Y7YR3E7T1J"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

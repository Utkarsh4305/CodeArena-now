import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; 
const firebaseConfig = {
    apiKey: "AIzaSyA9vmetxkR1Tp7xvJabTqBb77Bk2mrh0GA",
    authDomain: "web-code-192e3.firebaseapp.com",
    projectId: "web-code-192e3",
    storageBucket: "web-code-192e3.firebasestorage.app",
    messagingSenderId: "248234928730",
    appId: "1:248234928730:web:c6f31e969026ed78a34663",
    measurementId: "G-5SSEK3TC1T"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
export { app, auth, db, storage };
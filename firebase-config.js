// Importation des SDK Firebase nécessaires depuis le CDN officiel (Version 10+)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Vos identifiants exacts récupérés depuis Capture d'écran 2026-06-12 042300.jpg
const firebaseConfig = {
    apiKey: "AIzaSyCPKbw-M_fbEUtoelAw5L3GI8mKXJILfyA",
    authDomain: "techshop-kamina.firebaseapp.com",
    projectId: "techshop-kamina",
    storageBucket: "techshop-kamina.firebasestorage.app",
    messagingSenderId: "400768708816",
    appId: "1:400768708816:web:38e99cb2a9cd81c9ff2ed5"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// Exportation des modules pour tes autres fichiers JS
export const auth = getAuth(app);
export const db = getFirestore(app);
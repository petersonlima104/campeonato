import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAuoq9Vk7QyqyKpKH5P-OD7S3vvAGlHJ9M",
  authDomain: "campeonatomv-app.firebaseapp.com",
  projectId: "campeonatomv-app",
  storageBucket: "campeonatomv-app.firebasestorage.app",
  messagingSenderId: "859575572138",
  appId: "1:859575572138:web:e3ce4dcb7ee9706b9362d3",
  measurementId: "G-X3VPJ251DZ",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

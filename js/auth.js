import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { app } from "./firebase.js";

const auth = getAuth(app);

// LOGIN
window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    bootstrap.Modal.getInstance(document.getElementById("loginModal")).hide();
  } catch (err) {
    alert("Erro no login");
    console.error(err);
  }
};

// CONTROLE ADMIN
onAuthStateChanged(auth, (user) => {
  const adminEls = document.querySelectorAll(".admin-only");

  adminEls.forEach((el) => {
    el.style.display = user ? "inline-block" : "none";
  });
});

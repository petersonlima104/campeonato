import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

// CONTROLE DE VISIBILIDADE ADMIN
onAuthStateChanged(auth, (user) => {
  document.querySelectorAll(".admin-only").forEach((el) => {
    el.style.display = user ? "inline-block" : "none";
  });
});

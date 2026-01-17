import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 👇 EXPLICITAMENTE GLOBAL
window.login = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      location.reload();
    })
    .catch((err) => {
      alert("Email ou senha inválidos");
      console.error(err);
    });
};

// CONTROLE DE ESTADO
onAuthStateChanged(auth, (user) => {
  document.body.classList.toggle("admin", !!user);
});

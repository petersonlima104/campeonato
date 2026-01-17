import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

window.login = () => {
  signInWithEmailAndPassword(auth, email.value, password.value)
    .then(() => location.reload())
    .catch(() => alert("Login inválido"));
};

onAuthStateChanged(auth, (user) => {
  document.body.classList.toggle("admin", !!user);
});

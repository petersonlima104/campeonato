import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

console.log("auth.js carregado");

window.login = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Login realizado com sucesso");
      location.reload();
    })
    .catch((err) => {
      alert("Erro no login");
      console.error(err);
    });
};

onAuthStateChanged(auth, (user) => {
  console.log("Usuário:", user);
  document.body.classList.toggle("admin", !!user);
});

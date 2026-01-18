import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

console.log("auth.js carregado");

window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);

    // FECHA O MODAL
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("loginModal"),
    );
    modal.hide();

    alert("Login realizado");
  } catch (e) {
    alert("Erro no login");
    console.error(e);
  }
};

onAuthStateChanged(auth, (user) => {
  window.isAdmin = !!user;
  atualizarAdminUI(window.isAdmin);
});

window.atualizarAdminUI = function (isAdmin) {
  document.querySelectorAll(".admin-only").forEach((el) => {
    el.style.display = isAdmin ? "inline-block" : "none";
  });
};

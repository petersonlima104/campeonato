import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

onSnapshot(collection(db, "jogos"), (snap) => {
  const dados = snap.docs.map((d) => d.data());

  listaJogos.innerHTML = dados
    .map(
      (j) => `
    <tr>
      <td>${j.data}</td>
      <td>${j.hora}</td>
      <td>${j.mandante}</td>
      <td>${j.visitante}</td>
      <td>${j.placar}</td>
      <td class="admin-only">✏️ 🗑️</td>
    </tr>
  `
    )
    .join("");
});

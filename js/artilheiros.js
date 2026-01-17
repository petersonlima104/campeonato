import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

onSnapshot(collection(db, "artilheiros"), (snap) => {
  const dados = snap.docs.map((d) => d.data()).sort((a, b) => b.gols - a.gols);

  listaArtilheiros.innerHTML = dados
    .map(
      (p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${p.nome}</td>
      <td>${p.time}</td>
      <td>${p.gols}</td>
      <td class="admin-only">✏️ 🗑️</td>
    </tr>
  `
    )
    .join("");
});

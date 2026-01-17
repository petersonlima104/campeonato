import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

onSnapshot(collection(db, "times"), (snap) => {
  const dados = snap.docs.map((d) => d.data());

  dados.sort(
    (a, b) =>
      b.pontos - a.pontos ||
      b.vitorias - a.vitorias ||
      b.saldo - a.saldo ||
      b.gols - a.gols
  );

  listaTimes.innerHTML = dados
    .map(
      (t, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${t.nome}</td>
      <td>${t.pontos}</td>
      <td>${t.vitorias}</td>
      <td>${t.saldo}</td>
      <td>${t.gols}</td>
      <td class="admin-only">✏️ 🗑️</td>
    </tr>
  `
    )
    .join("");
});

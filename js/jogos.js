import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const lista = document.getElementById("listaJogos");

onSnapshot(collection(db, "jogos"), (snap) => {
  const dados = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  lista.innerHTML = dados
    .map(
      (j) => `
    <tr>
      <td>${j.data}</td>
      <td>${j.hora}</td>
      <td>${j.mandante}</td>
      <td>${j.visitante}</td>
      <td>${j.placar}</td>
      <td class="admin-only">
        <button class="btn btn-sm btn-warning me-1" onclick="editarJogo('${j.id}')">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="excluirJogo('${j.id}')">🗑️</button>
      </td>
    </tr>
  `,
    )
    .join("");

  if (window.isAdmin) atualizarAdminUI(true);
});

window.excluirJogo = async function (id) {
  if (!confirm("Excluir jogo?")) return;
  await deleteDoc(doc(db, "jogos", id));
};

window.editarJogo = async function (id) {
  const placar = prompt("Novo placar (ex: 3x2):");
  if (!placar) return;

  await updateDoc(doc(db, "jogos", id), {
    placar,
  });
};

window.novoJogo = async function () {
  const data = prompt("Data do jogo (ex: 10/02):");
  if (!data) return;

  const hora = prompt("Hora (ex: 19:30):");
  if (!hora) return;

  const mandante = prompt("Time mandante:");
  if (!mandante) return;

  const visitante = prompt("Time visitante:");
  if (!visitante) return;

  const placar = prompt("Placar (ex: 2x1):") || "-";

  await addDoc(collection(db, "jogos"), {
    data,
    hora,
    mandante,
    visitante,
    placar,
  });
};

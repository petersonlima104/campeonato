import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const lista = document.getElementById("listaArtilheiros");

onSnapshot(collection(db, "artilheiros"), (snap) => {
  const dados = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => b.gols - a.gols);

  lista.innerHTML = dados
    .map(
      (p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${p.nome}</td>
      <td>${p.time}</td>
      <td>${p.gols}</td>
      <td class="admin-only">
        <button class="btn btn-sm btn-warning me-1" onclick="editarArtilheiro('${p.id}')">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="excluirArtilheiro('${p.id}')">🗑️</button>
      </td>
    </tr>
  `,
    )
    .join("");

  if (window.isAdmin) atualizarAdminUI(true);
});

window.excluirArtilheiro = async function (id) {
  if (!confirm("Excluir artilheiro?")) return;
  await deleteDoc(doc(db, "artilheiros", id));
};

window.editarArtilheiro = async function (id) {
  const gols = Number(prompt("Nova quantidade de gols:"));
  if (isNaN(gols)) return;

  await updateDoc(doc(db, "artilheiros", id), {
    gols,
  });
};

window.novoArtilheiro = async function () {
  const nome = prompt("Nome do jogador:");
  if (!nome) return;

  const time = prompt("Time:");
  if (!time) return;

  const gols = Number(prompt("Quantidade de gols:")) || 0;

  await addDoc(collection(db, "artilheiros"), {
    nome,
    time,
    gols,
  });
};

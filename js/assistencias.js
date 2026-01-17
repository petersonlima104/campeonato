import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const lista = document.getElementById("listaAssistencias");

onSnapshot(collection(db, "assistencias"), (snap) => {
  const dados = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => b.assistencias - a.assistencias);

  lista.innerHTML = dados
    .map(
      (p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${p.nome}</td>
      <td>${p.time}</td>
      <td>${p.assistencias}</td>
      <td class="admin-only">
        <button class="btn btn-sm btn-warning me-1" onclick="editarAssistencia('${p.id}')">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="excluirAssistencia('${p.id}')">🗑️</button>
      </td>
    </tr>
  `,
    )
    .join("");
});

window.excluirAssistencia = async function (id) {
  if (!confirm("Excluir assistência?")) return;
  await deleteDoc(doc(db, "assistencias", id));
};

window.editarAssistencia = async function (id) {
  const assistencias = Number(prompt("Novo número de assistências:"));
  if (isNaN(assistencias)) return;

  await updateDoc(doc(db, "assistencias", id), {
    assistencias,
  });
};

window.novaAssistencia = async function () {
  const nome = prompt("Nome do jogador:");
  if (!nome) return;

  const time = prompt("Time:");
  if (!time) return;

  const assistencias = Number(prompt("Número de assistências:")) || 0;

  await addDoc(collection(db, "assistencias"), {
    nome,
    time,
    assistencias,
  });
};

import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const lista = document.getElementById("listaTimes");

onSnapshot(collection(db, "times"), (snap) => {
  const dados = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  dados.sort(
    (a, b) =>
      b.pontos - a.pontos ||
      b.vitorias - a.vitorias ||
      b.saldo - a.saldo ||
      b.gols - a.gols,
  );

  lista.innerHTML = dados
    .map(
      (t, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${t.nome}</td>
      <td>${t.pontos}</td>
      <td>${t.vitorias}</td>
      <td>${t.saldo}</td>
      <td>${t.gols}</td>
      <td class="admin-only">
        <button class="btn btn-sm btn-warning me-1" onclick="editarTime('${t.id}')">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="excluirTime('${t.id}')">🗑️</button>
      </td>
    </tr>
  `,
    )
    .join("");
});

// ===== FUNÇÕES ADMIN =====
window.excluirTime = async function (id) {
  if (!confirm("Deseja excluir este time?")) return;
  await deleteDoc(doc(db, "times", id));
};

window.editarTime = async function (id) {
  const pontos = Number(prompt("Pontos:"));
  const vitorias = Number(prompt("Vitórias:"));
  const saldo = Number(prompt("Saldo de gols:"));
  const gols = Number(prompt("Gols feitos:"));

  await updateDoc(doc(db, "times", id), {
    pontos,
    vitorias,
    saldo,
    gols,
  });
};

window.novoTime = async function () {
  const nome = prompt("Nome do time:");
  if (!nome) return;

  await addDoc(collection(db, "times"), {
    nome,
    pontos: 0,
    vitorias: 0,
    saldo: 0,
    gols: 0,
  });
};

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

  // 🔥 CRITÉRIOS DE CLASSIFICAÇÃO
  dados.sort(
    (a, b) =>
      b.pontos - a.pontos ||
      b.vitorias - a.vitorias ||
      b.saldo - a.saldo ||
      b.golsMarcados - a.golsMarcados,
  );

  lista.innerHTML = dados
    .map(
      (t, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${t.nome}</td>
        <td>${t.pontos}</td>
        <td>${t.partidas}</td>
        <td>${t.vitorias}</td>
        <td>${t.empates}</td>
        <td>${t.derrotas}</td>
        <td>${t.golsMarcados}</td>
        <td>${t.golsSofridos}</td>
        <td>${t.saldo}</td>
        <td class="admin-only">
          <button class="btn btn-sm btn-warning me-1" onclick="editarTime('${t.id}')">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="excluirTime('${t.id}')">🗑️</button>
        </td>
      </tr>
    `,
    )
    .join("");

  if (window.isAdmin) atualizarAdminUI(true);
});

// ===== FUNÇÕES ADMIN =====

window.excluirTime = async function (id) {
  if (!confirm("Deseja excluir este time?")) return;
  await deleteDoc(doc(db, "times", id));
};

window.editarTime = async function (id) {
  const pontos = Number(prompt("Pontos (P):"));
  const partidas = Number(prompt("Partidas Jogadas (PJ):"));
  const vitorias = Number(prompt("Vitórias (VIT):"));
  const empates = Number(prompt("Empates (E):"));
  const derrotas = Number(prompt("Derrotas (DER):"));
  const golsMarcados = Number(prompt("Gols Marcados (GM):"));
  const golsSofridos = Number(prompt("Gols Sofridos (GC):"));

  const saldo = golsMarcados - golsSofridos;

  await updateDoc(doc(db, "times", id), {
    pontos,
    partidas,
    vitorias,
    empates,
    derrotas,
    golsMarcados,
    golsSofridos,
    saldo,
  });
};

window.novoTime = async function () {
  const nome = prompt("Nome do time:");
  if (!nome) return;

  await addDoc(collection(db, "times"), {
    nome,
    pontos: 0,
    partidas: 0,
    vitorias: 0,
    empates: 0,
    derrotas: 0,
    golsMarcados: 0,
    golsSofridos: 0,
    saldo: 0,
  });
};

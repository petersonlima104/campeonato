import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { recalcularClassificacao } from "./classificacao.js";

const lista = document.getElementById("listaJogos");

onSnapshot(collection(db, "jogos"), (snap) => {
  const dados = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  lista.innerHTML = dados
    .map(
      (j) => `
    <tr>
      <td>${j.data}</td>
      <td>${j.hora}</td>
      <td>${j.mandante}</td>
      <td>${j.visitante}</td>
      <td>${j.golsMandante} x ${j.golsVisitante}</td>
      <td class="admin-only">
        <button class="btn btn-sm btn-warning me-1" onclick="editarJogo('${j.id}')">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="excluirJogo('${j.id}')">🗑️</button>
      </td>
    </tr>
  `,
    )
    .join("");
});

// ===== FUNÇÕES ADMIN =====
window.novoJogo = async function () {
  const data = prompt("Data (dd/mm):");
  const hora = prompt("Hora (hh:mm):");
  const mandante = prompt("Time mandante:");
  const visitante = prompt("Time visitante:");
  const golsMandante = Number(prompt("Gols do mandante:"));
  const golsVisitante = Number(prompt("Gols do visitante:"));

  if (!mandante || !visitante) return;

  await addDoc(collection(db, "jogos"), {
    data,
    hora,
    mandante,
    visitante,
    golsMandante,
    golsVisitante,
    finalizado: true,
  });

  await recalcularClassificacao();
};

window.editarJogo = async function (id) {
  const golsMandante = Number(prompt("Gols do mandante:"));
  const golsVisitante = Number(prompt("Gols do visitante:"));

  await updateDoc(doc(db, "jogos", id), {
    golsMandante,
    golsVisitante,
    finalizado: true,
  });

  await recalcularClassificacao();
};

window.excluirJogo = async function (id) {
  if (!confirm("Excluir jogo?")) return;

  await deleteDoc(doc(db, "jogos", id));
  await recalcularClassificacao();
};

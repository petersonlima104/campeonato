import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  addDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const lista = document.getElementById("listaTimes");

onSnapshot(collection(db, "times"), (snap) => {
  const times = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  // AGRUPA POR GRUPO
  const grupos = {};
  times.forEach((t) => {
    if (!grupos[t.grupo]) grupos[t.grupo] = [];
    grupos[t.grupo].push(t);
  });

  lista.innerHTML = "";

  Object.keys(grupos)
    .sort()
    .forEach((grupo) => {
      const timesGrupo = grupos[grupo];

      // ORDENA CLASSIFICAÇÃO
      timesGrupo.sort(
        (a, b) =>
          b.pontos - a.pontos ||
          b.vitorias - a.vitorias ||
          b.saldo - a.saldo ||
          b.golsMarcados - a.golsMarcados,
      );

      // CABEÇALHO DO GRUPO
      lista.innerHTML += `
        <tr class="table-dark">
          <td colspan="11" class="text-center fw-bold">
            GRUPO ${grupo}
          </td>
        </tr>
      `;

      // TIMES DO GRUPO
      timesGrupo.forEach((t, i) => {
        lista.innerHTML += `
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
              <button class="btn btn-sm btn-danger" onclick="excluirTime('${t.id}')">🗑️</button>
            </td>
          </tr>
        `;
      });
    });

  if (window.isAdmin) atualizarAdminUI(true);
});

// ===== ADMIN =====

window.excluirTime = async function (id) {
  if (!confirm("Excluir time?")) return;
  await deleteDoc(doc(db, "times", id));
};

window.novoTime = async function () {
  const nome = prompt("Nome do time:");
  const grupo = prompt("Grupo do time (A, B, C...)");

  if (!nome || !grupo) return;

  await addDoc(collection(db, "times"), {
    nome,
    grupo: grupo.toUpperCase(),
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

import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  addDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { recalcularClassificacao } from "./classificacao.js";

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

window.excluirTime = async function (timeId) {
  if (
    !confirm(
      "Ao excluir este time, TODOS os jogos dele também serão excluídos. Deseja continuar?",
    )
  ) {
    return;
  }

  try {
    // 🔍 Buscar o time para pegar o nome
    const timesSnap = await getDocs(collection(db, "times"));
    const timeDoc = timesSnap.docs.find((d) => d.id === timeId);

    if (!timeDoc) return;

    const nomeTime = timeDoc.data().nome;

    // 🔥 Buscar todos os jogos
    const jogosSnap = await getDocs(collection(db, "jogos"));

    // 🗑️ Excluir jogos onde o time é mandante ou visitante
    for (const jogo of jogosSnap.docs) {
      const dados = jogo.data();

      if (dados.mandante === nomeTime || dados.visitante === nomeTime) {
        await deleteDoc(doc(db, "jogos", jogo.id));
      }
    }

    // 🗑️ Excluir o time
    await deleteDoc(doc(db, "times", timeId));

    // 🔄 Recalcular classificação
    await recalcularClassificacao();

    alert("Time e jogos excluídos com sucesso!");
  } catch (err) {
    console.error("Erro ao excluir time:", err);
    alert("Erro ao excluir o time.");
  }
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

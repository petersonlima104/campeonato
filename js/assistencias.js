import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ===============================
// REFERÊNCIAS
// ===============================
const lista = document.getElementById("listaAssistencias");

let jogadoresCache = [];

const modalAssistencia = new bootstrap.Modal(
  document.getElementById("modalAssistencia"),
);

// ===============================
// LISTAGEM + ORDENAÇÃO
// ===============================
onSnapshot(collection(db, "jogadores"), (snap) => {
  jogadoresCache = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  const ordenado = [...jogadoresCache].sort(
    (a, b) => (b.assistencias || 0) - (a.assistencias || 0),
  );

  renderAssistencias(ordenado);
});

// ===============================
// RENDER
// ===============================
function renderAssistencias(listaDados) {
  lista.innerHTML = listaDados
    .map(
      (j, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${j.nome}</td>
        <td>${j.time}</td>
        <td>${j.assistencias || 0}</td>
        <td class="admin-only">
          <button
            class="btn btn-sm btn-warning"
            onclick="editarAssistencia('${j.id}')"
          >✏️</button>
        </td>
      </tr>
    `,
    )
    .join("");

  if (window.isAdmin) atualizarAdminUI(true);
}

// ===============================
// FILTRO (IGUAL ARILHEIROS)
// ===============================
window.filtrarAssistencias = function () {
  const termo = document
    .getElementById("filtroAssistencia")
    .value.toLowerCase();

  if (!termo) {
    const ordenado = [...jogadoresCache].sort(
      (a, b) => (b.assistencias || 0) - (a.assistencias || 0),
    );
    renderAssistencias(ordenado);
    return;
  }

  const filtrados = jogadoresCache.filter(
    (j) =>
      j.nome.toLowerCase().includes(termo) ||
      j.time.toLowerCase().includes(termo),
  );

  filtrados.sort((a, b) => (b.assistencias || 0) - (a.assistencias || 0));

  renderAssistencias(filtrados);
};

// ===============================
// EDITAR ASSISTÊNCIA
// ===============================
window.editarAssistencia = async function (id) {
  const jogador = jogadoresCache.find((j) => j.id === id);
  if (!jogador) return;

  //await carregarTimesNoSelectAssistencia();

  document.getElementById("assistenciaId").value = jogador.id;
  document.getElementById("assistenciaNome").value = jogador.nome;
  document.getElementById("assistenciaQtd").value = jogador.assistencias || 0;
  //document.getElementById("assistenciaTime").value = jogador.time;

  modalAssistencia.show();
};

// ===============================
// SALVAR ASSISTÊNCIA
// ===============================
window.salvarAssistencia = async function () {
  const id = document.getElementById("assistenciaId").value;
  const assistencias = Number(document.getElementById("assistenciaQtd").value);
  //const time = document.getElementById("assistenciaTime").value;

  if (assistencias < 0) {
    alert("Assistências não pode ser negativo");
    return;
  }

  await updateDoc(doc(db, "jogadores", id), {
    assistencias,
  });

  modalAssistencia.hide();
};

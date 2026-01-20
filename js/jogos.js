import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { recalcularClassificacao } from "./classificacao.js";

let listaTimes = [];
let jogoModal;

document.addEventListener("DOMContentLoaded", () => {
  jogoModal = new bootstrap.Modal(document.getElementById("jogoModal"));
  carregarTimesNoSelect();
});

async function carregarTimesNoSelect() {
  const snap = await getDocs(collection(db, "times"));
  listaTimes = snap.docs.map((d) => d.data().nome);

  const mandante = document.getElementById("jogoMandante");
  const visitante = document.getElementById("jogoVisitante");

  mandante.innerHTML = "";
  visitante.innerHTML = "";

  listaTimes.forEach((t) => {
    mandante.innerHTML += `<option value="${t}">${t}</option>`;
    visitante.innerHTML += `<option value="${t}">${t}</option>`;
  });
}

async function carregarTimes() {
  const snap = await getDocs(collection(db, "times"));
  listaTimes = snap.docs.map((d) => d.data().nome);
}

carregarTimes();

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

  if (window.isAdmin) atualizarAdminUI(true);
});

// ===== FUNÇÕES ADMIN =====

window.novoJogo = function () {
  document.getElementById("jogoModalTitulo").innerText = "Adicionar Jogo";
  document.getElementById("jogoId").value = "";

  document.getElementById("jogoData").value = "";
  document.getElementById("jogoHora").value = "";
  document.getElementById("golsMandante").value = "";
  document.getElementById("golsVisitante").value = "";

  jogoModal.show();
};

window.salvarJogo = async function () {
  const id = document.getElementById("jogoId").value;

  const data = document.getElementById("jogoData").value;
  const hora = document.getElementById("jogoHora").value;
  const mandante = document.getElementById("jogoMandante").value;
  const visitante = document.getElementById("jogoVisitante").value;
  const golsMandante = Number(document.getElementById("golsMandante").value);
  const golsVisitante = Number(document.getElementById("golsVisitante").value);

  if (mandante === visitante) {
    alert("Mandante e visitante não podem ser iguais");
    return;
  }

  const dados = {
    data,
    hora,
    mandante,
    visitante,
    golsMandante,
    golsVisitante,
    finalizado: true,
  };

  if (id) {
    await updateDoc(doc(db, "jogos", id), dados);
  } else {
    await addDoc(collection(db, "jogos"), dados);
  }

  jogoModal.hide();
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

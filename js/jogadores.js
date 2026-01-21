import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const lista = document.getElementById("listaArtilheiros");
let jogadoresCache = [];

let modal = new bootstrap.Modal(document.getElementById("modalArtilheiro"));

async function carregarTimesNoSelect() {
  const select = document.getElementById("artilheiroTime");
  select.innerHTML = "";

  const snap = await getDocs(collection(db, "times"));
  snap.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d.data().nome;
    opt.textContent = d.data().nome;
    select.appendChild(opt);
  });
}

// 🔥 LISTA ÚNICA DE JOGADORES
onSnapshot(collection(db, "jogadores"), (snap) => {
  jogadoresCache = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  // ORDENA POR GOLS
  jogadoresCache.sort((a, b) => b.gols - a.gols);
  render(jogadoresCache);
});

function render(listaDados) {
  lista.innerHTML = listaDados
    .map(
      (j, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${j.nome}</td>
      <td>${j.time}</td>
      <td>${j.gols}</td>
      <td class="admin-only">
        <button class="btn btn-sm btn-warning" onclick="editar('${j.id}')">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="excluir('${j.id}')">🗑️</button>
      </td>
    </tr>
  `,
    )
    .join("");

  if (window.isAdmin) atualizarAdminUI(true);
}

window.filtrarArtilheiros = function () {
  const termo = document.getElementById("filtroArtilheiro").value.toLowerCase();

  const filtrados = termo
    ? jogadoresCache.filter(
        (j) =>
          j.nome.toLowerCase().includes(termo) ||
          j.time.toLowerCase().includes(termo),
      )
    : jogadoresCache;

  render(filtrados.sort((a, b) => b.gols - a.gols));
};

window.novoArtilheiro = async function () {
  document.getElementById("artilheiroId").value = "";
  document.getElementById("artilheiroNome").value = "";
  document.getElementById("artilheiroGols").value = "";

  await carregarTimesNoSelect();
  modal.show();
};

window.editar = function (id) {
  const j = jogadoresCache.find((x) => x.id === id);

  document.getElementById("artilheiroId").value = id;
  document.getElementById("artilheiroNome").value = j.nome;
  document.getElementById("artilheiroGols").value = j.gols;

  carregarTimesNoSelect().then(() => {
    document.getElementById("artilheiroTime").value = j.time;
  });

  modal.show();
};

window.salvarArtilheiro = async function () {
  const id = document.getElementById("artilheiroId").value;
  const nome = document.getElementById("artilheiroNome").value;
  const time = document.getElementById("artilheiroTime").value;
  const gols = Number(document.getElementById("artilheiroGols").value);

  if (!nome || !time) return alert("Preencha tudo");

  if (id) {
    await updateDoc(doc(db, "jogadores", id), { nome, time, gols });
  } else {
    await addDoc(collection(db, "jogadores"), {
      nome,
      time,
      gols,
      assistencias: 0,
    });
  }

  modal.hide();
};

window.excluir = async function (id) {
  if (confirm("Excluir jogador?")) {
    await deleteDoc(doc(db, "jogadores", id));
  }
};

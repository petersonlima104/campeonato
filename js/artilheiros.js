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

let modalArtilheiro = new bootstrap.Modal(
  document.getElementById("modalArtilheiro"),
);

async function carregarTimesNoSelect(selectId) {
  const select = document.getElementById(selectId);
  select.innerHTML = "";

  const snap = await getDocs(collection(db, "times"));
  snap.forEach((doc) => {
    const opt = document.createElement("option");
    opt.value = doc.data().nome;
    opt.textContent = doc.data().nome;
    select.appendChild(opt);
  });
}

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
  const linha = document
    .querySelector(`[onclick="editarArtilheiro('${id}')"]`)
    .closest("tr").children;

  document.getElementById("artilheiroId").value = id;
  document.getElementById("artilheiroNome").value = linha[1].innerText;
  document.getElementById("artilheiroGols").value = linha[3].innerText;

  await carregarTimesNoSelect("artilheiroTime");
  document.getElementById("artilheiroTime").value = linha[2].innerText;

  modalArtilheiro.show();
};

window.novoArtilheiro = async function () {
  document.getElementById("artilheiroId").value = "";
  document.getElementById("artilheiroNome").value = "";
  document.getElementById("artilheiroGols").value = "";

  await carregarTimesNoSelect("artilheiroTime");

  modalArtilheiro.show();
};

window.salvarArtilheiro = async function () {
  const id = document.getElementById("artilheiroId").value;

  const nome = document.getElementById("artilheiroNome").value;
  const time = document.getElementById("artilheiroTime").value;
  const gols = Number(document.getElementById("artilheiroGols").value);

  if (!nome || !time) return alert("Preencha todos os campos");

  if (id) {
    await updateDoc(doc(db, "artilheiros", id), { nome, time, gols });
  } else {
    await addDoc(collection(db, "artilheiros"), { nome, time, gols });
  }

  modalArtilheiro.hide();
};

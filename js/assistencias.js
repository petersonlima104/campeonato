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

const lista = document.getElementById("listaAssistencias");

let modalAssistencia = new bootstrap.Modal(
  document.getElementById("modalAssistencia"),
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

  if (window.isAdmin) atualizarAdminUI(true);
});

window.excluirAssistencia = async function (id) {
  if (!confirm("Excluir assistência?")) return;
  await deleteDoc(doc(db, "assistencias", id));
};

window.editarAssistencia = async function (id) {
  const linha = document
    .querySelector(`[onclick="editarAssistencia('${id}')"]`)
    .closest("tr").children;

  document.getElementById("assistenciaId").value = id;
  document.getElementById("assistenciaNome").value = linha[1].innerText;
  document.getElementById("assistenciaQtd").value = linha[3].innerText;

  await carregarTimesNoSelect("assistenciaTime");
  document.getElementById("assistenciaTime").value = linha[2].innerText;

  new bootstrap.Modal(document.getElementById("modalAssistencia")).show();
};

window.novaAssistencia = async function () {
  document.getElementById("assistenciaId").value = "";
  document.getElementById("assistenciaNome").value = "";
  document.getElementById("assistenciaQtd").value = "";

  await carregarTimesNoSelect("assistenciaTime");

  new bootstrap.Modal(document.getElementById("modalAssistencia")).show();
};

window.salvarAssistencia = async function () {
  const id = document.getElementById("assistenciaId").value;

  const nome = document.getElementById("assistenciaNome").value;
  const time = document.getElementById("assistenciaTime").value;
  const assistencias = Number(document.getElementById("assistenciaQtd").value);

  if (!nome || !time) return alert("Preencha todos os campos");

  if (id) {
    await updateDoc(doc(db, "assistencias", id), {
      nome,
      time,
      assistencias,
    });
  } else {
    await addDoc(collection(db, "assistencias"), {
      nome,
      time,
      assistencias,
    });
  }

  bootstrap.Modal.getInstance(
    document.getElementById("modalAssistencia"),
  ).hide();
};

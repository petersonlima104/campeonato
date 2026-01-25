import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  getDocs,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { recalcularClassificacao } from "./classificacao.js";

let listaTimes = [];
let jogoModal;

function dataParaDate(dataBR) {
  if (!dataBR) return new Date(0); // segurança
  const [dia, mes, ano] = dataBR.split("/");
  return new Date(`${ano}-${mes}-${dia}`);
}

document.addEventListener("DOMContentLoaded", () => {
  jogoModal = new bootstrap.Modal(document.getElementById("jogoModal"));
  carregarTimesNoSelect();
});

async function carregarTimesNoSelect() {
  const snap = await getDocs(collection(db, "times"));

  const mandante = document.getElementById("jogoMandante");
  const visitante = document.getElementById("jogoVisitante");

  mandante.innerHTML = "";
  visitante.innerHTML = "";

  snap.forEach((doc) => {
    const time = doc.data();

    // 🔥 GARANTE QUE TENHA NOME
    if (!time.nome) return;

    mandante.innerHTML += `<option value="${time.nome}">${time.nome}</option>`;
    visitante.innerHTML += `<option value="${time.nome}">${time.nome}</option>`;
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

  // ORDENAR OS JOGOS PELA DATA E EM ANDAMENTO NO TOPO
  dados.sort((a, b) => {
    // 1️⃣ Jogos em andamento sempre no topo
    if (a.status === "andamento" && b.status !== "andamento") return -1;
    if (a.status !== "andamento" && b.status === "andamento") return 1;

    // 2️⃣ Dentro do mesmo grupo, ordenar por data (mais antigo → mais novo)
    return dataParaDate(a.data) - dataParaDate(b.data);
  });

  lista.innerHTML = dados
    .map(
      (j) => `
    <tr>
      <td>${j.data}</td>
      <td>${j.hora}</td>
      <td>${j.mandante}</td>
      <td>${j.visitante}</td>
      <td>${j.golsMandante} x ${j.golsVisitante}</td>
      <td>
        <span class="fw-semibold ${
          j.status === "finalizado"
            ? "text-success"
            : j.status === "andamento"
              ? "text-primary"
              : "text-secondary"
        }">
        ${
          j.status === "finalizado"
            ? "Finalizado"
            : j.status === "andamento"
              ? "Em andamento"
              : "Em breve"
        }
        </span>
      </td>

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

  document.getElementById("jogoData").value = dataHojeBR();
  document.getElementById("jogoHora").value = "20:00";
  document.getElementById("golsMandante").value = "";
  document.getElementById("golsVisitante").value = "";
  document.getElementById("jogoStatus").value = "embreve";

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
  const status = document.getElementById("jogoStatus").value;

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
    status,
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
  const snap = await getDocs(collection(db, "jogos"));
  const jogo = snap.docs.find((d) => d.id === id);

  if (!jogo) return;

  const dados = jogo.data();

  document.getElementById("jogoModalTitulo").innerText = "Editar Jogo";
  document.getElementById("jogoId").value = id;

  document.getElementById("jogoData").value = dados.data;
  document.getElementById("jogoHora").value = dados.hora;
  document.getElementById("jogoMandante").value = dados.mandante;
  document.getElementById("jogoVisitante").value = dados.visitante;
  document.getElementById("golsMandante").value = dados.golsMandante;
  document.getElementById("golsVisitante").value = dados.golsVisitante;
  document.getElementById("jogoStatus").value = dados.status;

  jogoModal.show();
};

window.excluirJogo = async function (id) {
  if (!confirm("Excluir jogo?")) return;

  await deleteDoc(doc(db, "jogos", id));
  await recalcularClassificacao();
};

window.excluirTodosJogos = async function () {
  const confirmar = confirm(
    "⚠️ ATENÇÃO!\n\nIsso irá EXCLUIR TODOS os jogos e ZERAR gols e assistências.\nEssa ação NÃO pode ser desfeita.\n\nDeseja continuar?",
  );
  if (!confirmar) return;

  try {
    let batch = writeBatch(db);
    let operacoes = 0; // conta operações para commit a cada 500

    // 🗑️ EXCLUIR TODOS OS JOGOS
    const jogosSnap = await getDocs(collection(db, "jogos"));
    for (const jogo of jogosSnap.docs) {
      batch.delete(doc(db, "jogos", jogo.id));
      operacoes++;
      if (operacoes === 500) {
        await batch.commit();
        batch = writeBatch(db);
        operacoes = 0;
      }
    }

    // 👤 ZERAR GOLS E ASSISTÊNCIAS DOS JOGADORES
    const jogadoresSnap = await getDocs(collection(db, "jogadores"));
    for (const jog of jogadoresSnap.docs) {
      batch.update(doc(db, "jogadores", jog.id), {
        gols: 0,
        assistencias: 0,
      });
      operacoes++;
      if (operacoes === 500) {
        await batch.commit();
        batch = writeBatch(db);
        operacoes = 0;
      }
    }

    // Commit final se sobrar alguma operação
    if (operacoes > 0) {
      await batch.commit();
    }

    // 🔄 RECLASSIFICA TIMES
    await recalcularClassificacao();

    alert("✅ Campeonato resetado com sucesso!");
  } catch (err) {
    console.error("Erro ao resetar campeonato:", err);
    alert("❌ Erro ao resetar o campeonato.");
  }
};

window.gerarJogosAutomaticos = async function () {
  if (
    !confirm(
      "Isso irá APAGAR os jogos existentes e gerar novos automaticamente por GRUPO. Continuar?",
    )
  ) {
    return;
  }

  try {
    const batch = writeBatch(db);

    // 🗑️ APAGA TODOS OS JOGOS
    const jogosSnap = await getDocs(collection(db, "jogos"));
    jogosSnap.forEach((docSnap) => {
      batch.delete(doc(db, "jogos", docSnap.id));
    });

    // 📥 BUSCA TIMES
    const timesSnap = await getDocs(collection(db, "times"));
    const times = timesSnap.docs.map((d) => d.data());

    // 🧩 AGRUPA TIMES POR GRUPO
    const grupos = {};
    times.forEach((time) => {
      if (!grupos[time.grupo]) grupos[time.grupo] = [];
      grupos[time.grupo].push(time);
    });

    // 📅 DATA BASE
    let dataBase = proximoSabado();

    // ⚽ GERA JOGOS PARA CADA GRUPO
    Object.keys(grupos).forEach((grupo) => {
      const timesGrupo = grupos[grupo];

      if (timesGrupo.length < 2) return;

      // TURNO
      criarRodadasGrupo(timesGrupo, grupo, batch, dataBase, false);

      // RETURNO (espelhado e distante)
      const semanas = timesGrupo.length - 1;
      const dataReturno = adicionarDias(dataBase, semanas * 7);
      criarRodadasGrupo(timesGrupo, grupo, batch, dataReturno, true);

      // Empurra a próxima data base para evitar sobreposição entre grupos
      dataBase = adicionarDias(dataBase, semanas * 14);
    });

    await batch.commit();

    alert("✅ Jogos gerados corretamente por grupo!");
  } catch (err) {
    console.error(err);
    alert("❌ Erro ao gerar jogos.");
  }
};

// =========================
// FUNÇÃO INTERNA
// =========================
function criarRodadasGrupo(times, grupo, batch, dataInicial, isReturno) {
  const total = times.length;
  const rodadas = total - 1;
  const metade = total / 2;

  let lista = [...times];

  for (let r = 0; r < rodadas; r++) {
    const sabado = adicionarDias(dataInicial, r * 7);
    const domingo = adicionarDias(sabado, 1);

    for (let i = 0; i < metade; i++) {
      const timeA = lista[i];
      const timeB = lista[total - 1 - i];

      const mandante = isReturno ? timeB : timeA;
      const visitante = isReturno ? timeA : timeB;

      const dataJogo = i % 2 === 0 ? sabado : domingo;

      batch.set(doc(collection(db, "jogos")), {
        data: formatarData(dataJogo),
        hora: "20:00",
        mandante: mandante.nome,
        visitante: visitante.nome,
        golsMandante: 0,
        golsVisitante: 0,
        status: "embreve",
        grupo: grupo,
      });
    }

    // 🔄 ROTAÇÃO TIPO BRASILEIRÃO
    lista = [
      lista[0],
      lista[lista.length - 1],
      ...lista.slice(1, lista.length - 1),
    ];
  }
}

function proximoSabado() {
  const hoje = new Date();
  const dia = hoje.getDay();
  const diff = (6 - dia + 7) % 7 || 7;
  hoje.setDate(hoje.getDate() + diff);
  return hoje;
}

function adicionarDias(data, dias) {
  const nova = new Date(data);
  nova.setDate(nova.getDate() + dias);
  return nova;
}

function formatarData(data) {
  return data.toLocaleDateString("pt-BR");
}

function dataHojeBR() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

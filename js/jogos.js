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

window.confirmarGeracao = async function (gerarReturno) {
  const modalEl = document.getElementById("modalFormatoCampeonato");
  const modal = bootstrap.Modal.getInstance(modalEl);
  modal.hide();

  await gerarJogosAutomaticos(gerarReturno);
};

window.gerarJogosAutomaticos = async function (gerarReturno) {
  try {
    let batch = writeBatch(db);
    let operacoes = 0;

    // 🗑️ APAGAR TODOS OS JOGOS
    const jogosSnap = await getDocs(collection(db, "jogos"));
    for (const docSnap of jogosSnap.docs) {
      batch.delete(doc(db, "jogos", docSnap.id));
      operacoes++;

      if (operacoes === 500) {
        await batch.commit();
        batch = writeBatch(db);
        operacoes = 0;
      }
    }

    // 📥 BUSCAR TIMES
    const timesSnap = await getDocs(collection(db, "times"));
    const times = timesSnap.docs.map((d) => d.data());

    // 🧩 AGRUPAR TIMES POR GRUPO
    const grupos = {};
    times.forEach((t) => {
      if (!grupos[t.grupo]) grupos[t.grupo] = [];
      grupos[t.grupo].push(t);
    });

    let dataBase = proximoSabado(new Date());

    // 🔁 GERAR JOGOS POR GRUPO (SEM MISTURAR)
    for (const grupo in grupos) {
      const timesGrupo = grupos[grupo];
      if (timesGrupo.length < 2) continue;

      // 🧠 GERA TABELA (TURNO OU TURNO + RETURNO)
      const tabela = gerarTabelaGrupo(timesGrupo, gerarReturno);

      // 📅 GERA JOGOS COM DATAS
      const jogos = montarJogosComDatas(tabela, grupo, dataBase);

      for (const jogo of jogos) {
        batch.set(doc(collection(db, "jogos")), jogo);
        operacoes++;

        if (operacoes === 500) {
          await batch.commit();
          batch = writeBatch(db);
          operacoes = 0;
        }
      }

      // ⏭️ AVANÇA O CALENDÁRIO APÓS O GRUPO
      dataBase.setDate(dataBase.getDate() + tabela.length * 7);
    }

    if (operacoes > 0) {
      await batch.commit();
    }

    alert(
      gerarReturno
        ? "✅ Jogos de TURNO + RETURNO gerados com sucesso!"
        : "✅ Jogos de TURNO ÚNICO gerados com sucesso!",
    );
  } catch (err) {
    console.error(err);
    alert("❌ Erro ao gerar jogos automáticos.");
  }
};

function gerarTabelaGrupo(times, gerarReturno) {
  let lista = [...times];

  // Se ímpar, adiciona folga
  if (lista.length % 2 !== 0) {
    lista.push({ nome: "FOLGA" });
  }

  const total = lista.length;
  const rodadas = total - 1;
  const jogosPorRodada = total / 2;

  let rodadaTimes = [...lista];
  let turno = [];

  for (let r = 0; r < rodadas; r++) {
    let jogosRodada = [];

    for (let i = 0; i < jogosPorRodada; i++) {
      const mandante = rodadaTimes[i];
      const visitante = rodadaTimes[total - 1 - i];

      if (mandante.nome !== "FOLGA" && visitante.nome !== "FOLGA") {
        jogosRodada.push({
          mandante,
          visitante,
        });
      }
    }

    turno.push(jogosRodada);

    // Rotação estilo Brasileirão
    rodadaTimes = [rodadaTimes[0], ...rodadaTimes.slice(2), rodadaTimes[1]];
  }

  // 🔁 RETURNO ESPELHADO
  if (!gerarReturno) return turno;

  const returno = turno.map((rodada) =>
    rodada.map((j) => ({
      mandante: j.visitante,
      visitante: j.mandante,
    })),
  );

  return [...turno, ...returno];
}

window.abrirModalGeracaoJogos = function () {
  const modal = new bootstrap.Modal(
    document.getElementById("modalFormatoCampeonato"),
  );
  modal.show();
};

function proximoSabado(data) {
  const d = new Date(data);
  const dia = d.getDay(); // 0=Domingo
  const diff = (6 - dia + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d;
}

function montarJogosComDatas(tabela, grupo, dataInicial) {
  let jogos = [];
  let dataBase = new Date(dataInicial);

  tabela.forEach((rodada, indexRodada) => {
    rodada.forEach((jogo, i) => {
      const dataJogo = new Date(dataBase);

      // Alterna sábado / domingo
      if (i % 2 !== 0) {
        dataJogo.setDate(dataJogo.getDate() + 1);
      }

      jogos.push({
        data: dataJogo.toLocaleDateString("pt-BR"),
        hora: "20:00",
        mandante: jogo.mandante.nome,
        visitante: jogo.visitante.nome,
        golsMandante: 0,
        golsVisitante: 0,
        status: "embreve",
        grupo: grupo,
        rodada: indexRodada + 1,
      });
    });

    // Próxima rodada = +7 dias
    dataBase.setDate(dataBase.getDate() + 7);
  });

  return jogos;
}

function dataHojeBR() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

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

  // 🔥 MANTÉM A LÓGICA ORIGINAL
  dados.sort((a, b) => {
    // Jogos em andamento sempre no topo
    if (a.status === "andamento" && b.status !== "andamento") return -1;
    if (a.status !== "andamento" && b.status === "andamento") return 1;

    // Dentro do mesmo grupo, ordenar por data
    return dataParaDate(a.data) - dataParaDate(b.data);
  });

  let html = "";
  let turnoAtual = "";

  dados.forEach((j) => {
    // 🔹 Cabeçalho visual do turno
    if (j.turno && j.turno !== turnoAtual) {
      turnoAtual = j.turno;
      html += `
        <tr class="table-dark">
          <td colspan="7" class="text-center fw-bold">
            ${turnoAtual}
          </td>
        </tr>
      `;
    }

    html += `
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
    `;
  });

  lista.innerHTML = html;

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

window.excluirTodosJogos = async function () {
  const confirmar = confirm(
    "⚠️ ATENÇÃO!\n\nIsso irá EXCLUIR TODOS os jogos e ZERAR gols e assistências.\nEssa ação NÃO pode ser desfeita.\n\nDeseja continuar?",
  );
  if (!confirmar) return;

  try {
    let batch = writeBatch(db);
    let operacoes = 0; // contagem de operações no batch

    // 🗑️ EXCLUIR TODOS OS JOGOS
    const jogosSnap = await getDocs(collection(db, "jogos"));
    for (const jogo of jogosSnap.docs) {
      batch.delete(doc(db, "jogos", jogo.id));
      operacoes++;

      // ⚠️ Commit a cada 500 operações (limite do Firestore)
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
  const confirmar = confirm(
    "⚠️ Isso irá APAGAR todos os jogos existentes e criar novos jogos automaticamente.\nEssa ação não pode ser desfeita.\n\nDeseja continuar?",
  );
  if (!confirmar) return;

  try {
    // 🔹 Criar batch
    let batch = writeBatch(db);
    let operacoes = 0;

    // 1️⃣ Excluir jogos
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

    // 2️⃣ Zerar jogadores (gols e assistências)
    const jogadoresSnap = await getDocs(collection(db, "jogadores"));
    for (const jogador of jogadoresSnap.docs) {
      batch.update(doc(db, "jogadores", jogador.id), {
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

    // 3️⃣ Buscar times
    const timesSnap = await getDocs(collection(db, "times"));
    const times = timesSnap.docs.map((d) => ({
      id: d.id,
      nome: d.data().nome,
    }));

    if (times.length < 2) {
      alert("❌ É necessário pelo menos 2 times.");
      return;
    }

    // 4️⃣ Gerar jogos (retorna array)
    const jogosGerados = gerarTabelaBrasileirao(times);

    // 5️⃣ Salvar jogos no batch
    for (const jogo of jogosGerados) {
      const ref = doc(collection(db, "jogos"));
      batch.set(ref, jogo);
      operacoes++;

      if (operacoes === 500) {
        await batch.commit();
        batch = writeBatch(db);
        operacoes = 0;
      }
    }

    // Commit final
    if (operacoes > 0) {
      await batch.commit();
    }

    alert("✅ Jogos automáticos criados com sucesso!");
  } catch (err) {
    console.error(err);
    alert("❌ Erro ao gerar jogos automáticos.");
  }
};

function gerarTabelaBrasileirao(times) {
  let lista = [...times];

  if (lista.length % 2 !== 0) {
    lista.push({ id: null, nome: "FOLGA" });
  }

  const totalTimes = lista.length;
  const rodadas = totalTimes - 1;
  const jogosPorRodada = totalTimes / 2;

  let rodadaTimes = [...lista];
  let turno = [];

  for (let r = 0; r < rodadas; r++) {
    let jogosRodada = [];

    for (let i = 0; i < jogosPorRodada; i++) {
      const casa = rodadaTimes[i];
      const fora = rodadaTimes[totalTimes - 1 - i];

      if (casa.id && fora.id) {
        jogosRodada.push({ casa, fora });
      }
    }

    turno.push(jogosRodada);

    rodadaTimes = [rodadaTimes[0], ...rodadaTimes.slice(2), rodadaTimes[1]];
  }

  // Returno espelhado
  const returno = turno.map((rodada) =>
    rodada.map((j) => ({
      casa: j.fora,
      fora: j.casa,
    })),
  );

  return gerarJogosComDatas([...turno, ...returno]);
}

function gerarJogosComDatas(tabela) {
  let jogos = [];
  let dataBase = proximoSabado(new Date());

  const metade = tabela.length / 2;

  for (let r = 0; r < tabela.length; r++) {
    const rodada = tabela[r];
    const turno = r < metade ? "1º Turno" : "2º Turno";

    for (let i = 0; i < rodada.length; i++) {
      const jogo = rodada[i];
      let dataJogo = new Date(dataBase);

      if (i % 2 !== 0) {
        dataJogo.setDate(dataJogo.getDate() + 1); // domingo
      }

      jogos.push({
        data: formatarData(dataJogo),
        hora: "20:00", // hora padrão
        mandante: jogo.casa.nome,
        visitante: jogo.fora.nome,
        golsMandante: 0,
        golsVisitante: 0,
        status: "embreve",
        turno,
      });
    }

    dataBase.setDate(dataBase.getDate() + 7);
  }

  return jogos;
}

function proximoSabado(data) {
  const d = new Date(data);
  const dia = d.getDay();
  const diff = (6 - dia + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d;
}

function formatarData(data) {
  return data.toLocaleDateString("pt-BR");
}

function dataHojeBR() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function recalcularClassificacao() {
  const timesSnap = await getDocs(collection(db, "times"));
  const jogosSnap = await getDocs(collection(db, "jogos"));

  const times = {};

  // ZERA
  timesSnap.forEach((t) => {
    times[t.id] = {
      id: t.id,
      ...t.data(),
      pontos: 0,
      partidas: 0,
      vitorias: 0,
      empates: 0,
      derrotas: 0,
      golsMarcados: 0,
      golsSofridos: 0,
      saldo: 0,
    };
  });

  jogosSnap.forEach((j) => {
    const jogo = j.data();
    if (!jogo.finalizado) return;

    const mandante = Object.values(times).find((t) => t.nome === jogo.mandante);
    const visitante = Object.values(times).find(
      (t) => t.nome === jogo.visitante,
    );

    // 🔴 SÓ CONTA SE FOREM DO MESMO GRUPO
    if (!mandante || !visitante) return;

    mandante.partidas++;
    visitante.partidas++;

    mandante.golsMarcados += jogo.golsMandante;
    mandante.golsSofridos += jogo.golsVisitante;

    visitante.golsMarcados += jogo.golsVisitante;
    visitante.golsSofridos += jogo.golsMandante;

    if (jogo.golsMandante > jogo.golsVisitante) {
      mandante.vitorias++;
      mandante.pontos += 3;
      visitante.derrotas++;
    } else if (jogo.golsMandante < jogo.golsVisitante) {
      visitante.vitorias++;
      visitante.pontos += 3;
      mandante.derrotas++;
    } else {
      mandante.empates++;
      visitante.empates++;
      mandante.pontos++;
      visitante.pontos++;
    }
  });

  for (const t of Object.values(times)) {
    t.saldo = t.golsMarcados - t.golsSofridos;

    await updateDoc(doc(db, "times", t.id), {
      pontos: t.pontos,
      partidas: t.partidas,
      vitorias: t.vitorias,
      empates: t.empates,
      derrotas: t.derrotas,
      golsMarcados: t.golsMarcados,
      golsSofridos: t.golsSofridos,
      saldo: t.saldo,
    });
  }
}

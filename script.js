/* ==========================================================
   BOLETIM DIGITAL — SCRIPT
   Responsável por: normalizar notas, calcular médias,
   somar faltas, definir situação e preencher a tela.
   ========================================================== */

/* ----------------------------------------------------------
   DADOS FICTÍCIOS (8º Ano) — dados "brutos" de exemplo.
   Cada item é um OBJETO com: disciplina, tri1, tri2, tri3, faltas.
   O conjunto inteiro é um ARRAY (lista) de objetos.
   ---------------------------------------------------------- */
const disciplinas = [
  { disciplina: "Língua Portuguesa", tri1: 82, tri2: "7,8", tri3: 85, faltas: [2, 1, 1] },
  { disciplina: "Matemática", tri1: 52, tri2: "5,8", tri3: null, faltas: [3, 2, 1] },
  { disciplina: "Ciências", tri1: "8,1", tri2: 76, tri3: 8.0, faltas: [1, 2, 0] },
  { disciplina: "História", tri1: 7.0, tri2: 84, tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Geografia", tri1: 68, tri2: 7.3, tri3: "7,9", faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 86, tri2: "8,1", tri3: 8.7, faltas: [1, 0, 0] },
  { disciplina: "Arte", tri1: 9.0, tri2: 92, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: 95, tri2: 9.0, tri3: "9,4", faltas: [0, 1, 0] },
  { disciplina: "Educação Digital", tri1: 88, tri2: 9.1, tri3: 93, faltas: [1, 0, 1] },
  { disciplina: "Educação Financeira", tri1: 74, tri2: "7,8", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Estudo Orientado", tri1: 8.0, tri2: 83, tri3: "8,5", faltas: [0, 1, 0] },
  { disciplina: "Redação e Leitura", tri1: 62, tri2: "6,8", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 48, tri2: 5.6, tri3: "6,0", faltas: [2, 2, 1] },
  { disciplina: "Literatura Arte e Movimento", tri1: "7,7", tri2: 80, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Práticas Experimentais", tri1: 58, tri2: "6,2", tri3: 6.4, faltas: [1, 1, 1] },
];

/* Média mínima de referência para "Bom desempenho" */
const MEDIA_MINIMA = 6.0;

/* Frequência GERAL fictícia (apenas demonstrativa nesta versão).
   Futuramente será calculada de outra forma. */
const FREQUENCIA_DEMONSTRATIVA = 92;

/* ----------------------------------------------------------
   FUNÇÃO: normalizarNota(valor)
   Converte qualquer formato de nota para a escala 0–10.
   - vazio/null/undefined -> null (nota não lançada)
   - 0 a 10 -> permanece igual
   - >10 e <=100 -> divide por 10
   - aceita ponto ou vírgula decimal
   - valores inválidos -> null (não entram na média)
   ---------------------------------------------------------- */
function normalizarNota(valor) {
  // Se estiver vazio, nulo ou indefinido, é nota não lançada
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Se for texto, troca vírgula por ponto para poder converter em número
  if (typeof valor === "string") {
    valor = valor.trim().replace(",", ".");
  }

  // Converte para número
  const numero = Number(valor);

  // Se não for um número válido, retorna null (inválido)
  if (isNaN(numero)) {
    return null;
  }

  // Regra da escala:
  if (numero >= 0 && numero <= 10) {
    return numero;              // já está na escala
  } else if (numero > 10 && numero <= 100) {
    return numero / 10;         // ex: 82 -> 8.2 | 100 -> 10
  } else {
    return null;                // fora das regras -> inválido
  }
}

/* ----------------------------------------------------------
   FUNÇÃO: calcularMedia(notas)
   Recebe um array de notas (já normalizadas ou null)
   e retorna a média SOMENTE das notas disponíveis.
   Nota ausente NUNCA vira zero.
   ---------------------------------------------------------- */
function calcularMedia(notas) {
  // Filtra só as notas válidas (ignora null)
  const validas = notas.filter((n) => n !== null);

  // Se não há nenhuma nota válida, retorna null
  if (validas.length === 0) {
    return null;
  }

  // Soma todas e divide pela quantidade de válidas
  const soma = validas.reduce((total, n) => total + n, 0);
  return soma / validas.length;
}

/* ----------------------------------------------------------
   FUNÇÃO: somarFaltas(listaDeFaltas)
   Soma as faltas dos trimestres de uma disciplina.
   ---------------------------------------------------------- */
function somarFaltas(listaDeFaltas) {
  return listaDeFaltas.reduce((total, f) => total + f, 0);
}

/* ----------------------------------------------------------
   FUNÇÃO: definirSituacao(media)
   Retorna a situação com base na média disponível.
   ---------------------------------------------------------- */
function definirSituacao(media) {
  if (media === null) {
    return "Nota ainda não disponível";
  } else if (media >= MEDIA_MINIMA) {
    return "Bom desempenho";
  } else {
    return "Atenção";
  }
}

/* ----------------------------------------------------------
   FUNÇÃO: formatarNota(nota)
   Mostra a nota com 1 casa decimal ou "—" se não lançada.
   ---------------------------------------------------------- */
function formatarNota(nota) {
  if (nota === null) {
    return "—";
  }
  return nota.toFixed(1).replace(".", ",");
}

/* ----------------------------------------------------------
   FUNÇÃO: classeDaSituacao(situacao)
   Retorna a classe CSS da etiqueta conforme a situação.
   ---------------------------------------------------------- */
function classeDaSituacao(situacao) {
  if (situacao === "Bom desempenho") return "etiqueta etiqueta-bom";
  if (situacao === "Atenção") return "etiqueta etiqueta-atencao";
  return "etiqueta etiqueta-neutro";
}

/* ----------------------------------------------------------
   FUNÇÃO: preencherTabela()
   Cria as linhas da tabela automaticamente com os dados.
   ---------------------------------------------------------- */
function preencherTabela() {
  const corpoTabela = document.getElementById("corpoTabela");

  // forEach percorre cada disciplina do array
  disciplinas.forEach((item) => {
    // Normaliza as três notas do trimestre
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    // Calcula a média (ignorando notas ausentes)
    const media = calcularMedia([n1, n2, n3]);

    // Soma as faltas
    const faltas = somarFaltas(item.faltas);

    // Define a situação
    const situacao = definirSituacao(media);

    // Cria uma nova linha <tr>
    const linha = document.createElement("tr");

    // Monta o HTML interno da linha
    linha.innerHTML = `
      <td>${item.disciplina}</td>
      <td>${formatarNota(n1)}</td>
      <td>${formatarNota(n2)}</td>
      <td>${formatarNota(n3)}</td>
      <td><strong>${formatarNota(media)}</strong></td>
      <td>${faltas}</td>
      <td><span class="${classeDaSituacao(situacao)}">${situacao}</span></td>
    `;

    // Adiciona a linha ao corpo da tabela
    corpoTabela.appendChild(linha);
  });
}

/* ----------------------------------------------------------
   FUNÇÃO: preencherCards()
   Calcula os totais e preenche os cards de resumo.
   ---------------------------------------------------------- */
function preencherCards() {
  let somaMedias = 0;
  let qtdMedias = 0;
  let totalFaltas = 0;
  let qtdBom = 0;
  let qtdAtencao = 0;

  disciplinas.forEach((item) => {
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);
    const media = calcularMedia([n1, n2, n3]);

    // Soma faltas de todas as disciplinas
    totalFaltas += somarFaltas(item.faltas);

    // Só entra na média geral se a disciplina tiver alguma nota
    if (media !== null) {
      somaMedias += media;
      qtdMedias++;

      if (media >= MEDIA_MINIMA) {
        qtdBom++;
      } else {
        qtdAtencao++;
      }
    }
  });

  // Média geral (média das médias disponíveis)
  const mediaGeral = qtdMedias > 0 ? somaMedias / qtdMedias : null;

  // Preenche os elementos da tela
  document.getElementById("mediaGeral").textContent =
    mediaGeral !== null ? formatarNota(mediaGeral) : "—";
  document.getElementById("totalFaltas").textContent = totalFaltas;
  document.getElementById("qtdBom").textContent = qtdBom;
  document.getElementById("qtdAtencao").textContent = qtdAtencao;

  // Frequência demonstrativa (fictícia)
  document.getElementById("frequencia").textContent =
    FREQUENCIA_DEMONSTRATIVA + "%";
  document.getElementById("statusFrequencia").textContent =
    "Frequência adequada";
}

/* ----------------------------------------------------------
   INICIALIZAÇÃO
   Executa as funções quando a página termina de carregar.
   ---------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  preencherCards();
  preencherTabela();
});
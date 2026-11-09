/* ==========================================================
   BOLETIM DIGITAL — SCRIPT (VERSÃO CONECTADA À API)
   Responsável por: gerenciar sessão com PIN, conectar com a API,
   tratar validações estritas de formulário e renderizar a tela.
   ========================================================== */

// CONFIGURAÇÃO FIXA DO ALUNO (Não alterável pela página)
const CONFIG_ALUNO = {
  turma: "8B",
  numeroChamada: 29,
  apiUrl: "https://boletim-api.profbt.com.br"
};

/* ----------------------------------------------------------
   DADOS LOCAIS / BANCO DE BACKUP (Preservado do projeto original)
   Sempre que a API não retornar dados, usaremos estes dados autênticos.
   ---------------------------------------------------------- */
let dadosBoletim = [
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
  { disciplina: "Práticas Experimentais", tri1: 58, tri2: "6,2", tri3: 6.4, faltas: [1, 1, 1] }
];

/* Variáveis de sessão mantidas estritamente em memória */
let pinSessao = "";
let modoEdicaoAtivo = false;

/* Média mínima de referência para "Bom desempenho" */
const MEDIA_MINIMA = 6.0;

/* Frequência GERAL fictícia (apenas demonstrativa nesta versão) */
const FREQUENCIA_DEMONSTRATIVA = 92;

/* ----------------------------------------------------------
   FUNÇÃO: normalizarNota(valor)
   Mantém as regras originais de tratamento para dados antigos.
   ---------------------------------------------------------- */
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }
  if (typeof valor === "string") {
    valor = valor.trim().replace(",", ".");
  }
  const numero = Number(valor);
  if (isNaN(numero)) {
    return null;
  }
  if (numero >= 0 && numero <= 10) {
    return numero;
  } else if (numero > 10 && numero <= 100) {
    return numero / 10;
  } else {
    return null;
  }
}

function calcularMedia(notas) {
  const validas = notas.filter((n) => n !== null);
  if (validas.length === 0) return null;
  const soma = validas.reduce((total, n) => total + n, 0);
  return soma / validas.length;
}

function somarFaltas(listaDeFaltas) {
  if (!Array.isArray(listaDeFaltas)) return 0;
  return listaDeFaltas.reduce((total, f) => total + (Number(f) || 0), 0);
}

function definirSituacao(media) {
  if (media === null) return "Nota ainda não disponível";
  return media >= MEDIA_MINIMA ? "Bom desempenho" : "Atenção";
}

function formatarNota(nota) {
  if (nota === null) return "—";
  return nota.toFixed(1).replace(".", ",");
}

function classeDaSituacao(situacao) {
  if (situacao === "Bom desempenho") return "etiqueta etiqueta-bom";
  if (situacao === "Atenção") return "etiqueta etiqueta-atencao";
  return "etiqueta etiqueta-neutro";
}

function exibirMensagemFeedback(elemento, texto, tipo) {
  if (!elemento) return;
  elemento.textContent = texto;
  elemento.className = `mensagem-status ${tipo}`;
  elemento.style.display = "inline-block";
}

/* ----------------------------------------------------------
   CONEXÃO COM A API: ABRIR BOLETIM (POST)
   ---------------------------------------------------------- */
async function autenticarBoletim() {
  const campoPin = document.getElementById("campoPin");
  const msgStatus = document.getElementById("msgStatusLogin");
  const pinDigitado = campoPin.value.trim();

  if (!pinDigitado) {
    exibirMensagemFeedback(msgStatus, "Por favor, digite o PIN.", "erro");
    return;
  }

  exibirMensagemFeedback(msgStatus, "Conectando...", "processando");

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/abrir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinDigitado
      })
    });

    if (resposta.status === 401) {
      exibirMensagemFeedback(msgStatus, "Turma, chamada ou PIN inválidos.", "erro");
      return;
    } else if (resposta.status === 429) {
      exibirMensagemFeedback(msgStatus, "Muitas tentativas. Aguarde um minuto e tente novamente.", "erro");
      return;
    } else if (!resposta.ok) {
      exibirMensagemFeedback(msgStatus, "Não foi possível conectar ao servidor. Tente novamente.", "erro");
      return;
    }

    const resultado = await resposta.json();
    
    // Segurança: Armazena o PIN apenas na variável de memória e limpa a tela imediatamente
    pinSessao = pinDigitado;
    campoPin.value = "";

    // Regra Obrigatória: Se existirem dados salvos na API, use-os. Caso contrário, mantém locais.
    if (resultado.dados && Array.isArray(resultado.dados.disciplinas)) {
      dadosBoletim = resultado.dados.disciplinas;
    }

    // Transiciona as telas visuais
    document.getElementById("areaLogin").style.display = "none";
    document.getElementById("conteudoBoletim").style.display = "block";
    
    atualizarTelaCompleta();

  } catch (erro) {
    exibirMensagemFeedback(msgStatus, "Não foi possível conectar ao servidor. Tente novamente.", "erro");
  }
}

/* ----------------------------------------------------------
   CONEXÃO COM A API: SALVAR ALTERAÇÕES (PUT)
   ---------------------------------------------------------- */
async function salvarAlteracoesAPI() {
  const msgStatus = document.getElementById("msgStatusBoletim");
  const camposNota = document.querySelectorAll(".input-nota");
  const camposFalta = document.querySelectorAll(".input-falta");
  let validacaoOk = true;

  // 1. Limpa classes de erros visuais anteriores
  document.querySelectorAll(".input-edicao").forEach(el => el.classList.remove("campo-invalido"));

  // 2. Validação estrita das Notas Digitadas pelos alunos
  camposNota.forEach(input => {
    let v = input.value.trim();
    if (v !== "") {
      v = v.replace(",", ".");
      const n = Number(v);
      if (isNaN(n) || n < 0 || n > 10) {
        input.classList.add("campo-invalido");
        validacaoOk = false;
      }
    }
  });

  // 3. Validação estrita das Faltas Digitadas pelos alunos
  camposFalta.forEach(input => {
    const v = input.value.trim();
    const f = Number(v);
    if (v === "" || isNaN(f) || !Number.isInteger(f) || f < 0) {
      input.classList.add("campo-invalido");
      validacaoOk = false;
    }
  });

  if (!validacaoOk) {
    exibirMensagemFeedback(msgStatus, "Existem campos com valores inválidos. Corrija-os para salvar.", "erro");
    return;
  }

  exibirMensagemFeedback(msgStatus, "Salvando...", "processando");

  // 4. Captura estrutural dos dados mapeados a partir dos inputs da tabela
  const novasDisciplinas = [];
  const linhasTabela = document.querySelectorAll("#corpoTabela tr");

  linhasTabela.forEach((linha, index) => {
    const nomeDisciplina = dadosBoletim[index].disciplina;
    const inputsDaLinha = linha.querySelectorAll(".input-edicao");
    
    // Tratamento de Notas (Vazio vira null, caso contrário vira Float)
    const t1 = inputsDaLinha[0].value.trim() === "" ? null : parseFloat(inputsDaLinha[0].value.trim().replace(",", "."));
    const t2 = inputsDaLinha[1].value.trim() === "" ? null : parseFloat(inputsDaLinha[1].value.trim().replace(",", "."));
    const t3 = inputsDaLinha[2].value.trim() === "" ? null : parseFloat(inputsDaLinha[2].value.trim().replace(",", "."));
    
    // Tratamento de Faltas (Inteiros validados)
    const f1 = parseInt(inputsDaLinha[3].value.trim(), 10);
    const f2 = parseInt(inputsDaLinha[4].value.trim(), 10);
    const f3 = parseInt(inputsDaLinha[5].value.trim(), 10);

    novasDisciplinas.push({
      disciplina: nomeDisciplina,
      tri1: t1,
      tri2: t2,
      tri3: t3,
      faltas: [f1, f2, f3]
    });
  });

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinSessao,
        dados: { disciplinas: novasDisciplinas }
      })
    });

    if (!resposta.ok) {
      exibirMensagemFeedback(msgStatus, "Falha ao salvar as alterações no servidor. Tente novamente.", "erro");
      return;
    }

    // Salva com sucesso e desativa o modo de edição reconstruindo a interface estática atualizada
    dadosBoletim = novasDisciplinas;
    modoEdicaoAtivo = false;
    
    atualizarTelaCompleta();
    exibirMensagemFeedback(msgStatus, "Dados salvos com sucesso.", "sucesso");

  } catch (erro) {
    exibirMensagemFeedback(msgStatus, "Falha de rede ao tentar salvar. Verifique sua conexão.", "erro");
  }
}

/* ----------------------------------------------------------
   LÓGICA DE INTERFACE VISUAL E RENDERIZAÇÃO
   ---------------------------------------------------------- */
function alternarModoEdicao() {
  modoEdicaoAtivo = !modoEdicaoAtivo;
  document.getElementById("msgStatusBoletim").style.display = "none";
  preencherTabela();

  const btnAlterar = document.getElementById("btnAlterarDados");
  const btnSalvar = document.getElementById("btnSalvarDados");

  if (modoEdicaoAtivo) {
    btnAlterar.textContent = "Cancelar edição";
    btnSalvar.style.display = "inline-block";
  } else {
    btnAlterar.textContent = "Alterar dados";
    btnSalvar.style.display = "none";
  }
}

function preencherTabela() {
  const corpoTabela = document.getElementById("corpoTabela");
  corpoTabela.innerHTML = "";

  dadosBoletim.forEach((item) => {
    const tr = document.createElement("tr");

    const t1 = normalizarNota(item.tri1);
    const t2 = normalizarNota(item.tri2);
    const t3 = normalizarNota(item.tri3);

    const media = calcularMedia([t1, t2, t3]);
    const faltasTrimestres = Array.isArray(item.faltas) ? item.faltas : [0, 0, 0];
    const totalFaltasDisc = somarFaltas(faltasTrimestres);
    const situacao = definirSituacao(media);

    if (modoEdicaoAtivo) {
      // Modo Edição: Renderiza inputs para notas e faltas
      const tdNome = document.createElement("td");
      tdNome.textContent = item.disciplina;
      tr.appendChild(tdNome);

      const valT1 = item.tri1 === null || item.tri1 === undefined ? "" : item.tri1;
      const valT2 = item.tri2 === null || item.tri2 === undefined ? "" : item.tri2;
      const valT3 = item.tri3 === null || item.tri3 === undefined ? "" : item.tri3;

      const f1 = faltasTrimestres[0] !== undefined ? faltasTrimestres[0] : 0;
      const f2 = faltasTrimestres[1] !== undefined ? faltasTrimestres[1] : 0;
      const f3 = faltasTrimestres[2] !== undefined ? faltasTrimestres[2] : 0;

      tr.innerHTML += `
        <td><input type="text" class="input-edicao input-nota" value="${valT1}" placeholder="—" /></td>
        <td><input type="text" class="input-edicao input-nota" value="${valT2}" placeholder="—" /></td>
        <td><input type="text" class="input-edicao input-nota" value="${valT3}" placeholder="—" /></td>
        <td>${formatarNota(media)}</td>
        <td>
          <input type="text" class="input-edicao input-falta" value="${f1}" title="1º Tri" style="width:30px;" />
          <input type="text" class="input-edicao input-falta" value="${f2}" title="2º Tri" style="width:30px;" />
          <input type="text" class="input-edicao input-falta" value="${f3}" title="3º Tri" style="width:30px;" />
        </td>
        <td><span class="${classeDaSituacao(situacao)}">${situacao}</span></td>
      `;
    } else {
      // Modo Visualização: Segurança do DOM com textContent para a disciplina
      const tdNome = document.createElement("td");
      tdNome.textContent = item.disciplina;
      tr.appendChild(tdNome);

      const tdT1 = document.createElement("td");
      tdT1.textContent = formatarNota(t1);
      tr.appendChild(tdT1);

      const tdT2 = document.createElement("td");
      tdT2.textContent = formatarNota(t2);
      tr.appendChild(tdT2);

      const tdT3 = document.createElement("td");
      tdT3.textContent = formatarNota(t3);
      tr.appendChild(tdT3);

      const tdMedia = document.createElement("td");
      tdMedia.textContent = formatarNota(media);
      tr.appendChild(tdMedia);

      const tdFaltas = document.createElement("td");
      tdFaltas.textContent = totalFaltasDisc;
      tr.appendChild(tdFaltas);

      const tdSituacao = document.createElement("td");
      const spanSituacao = document.createElement("span");
      spanSituacao.className = classeDaSituacao(situacao);
      spanSituacao.textContent = situacao;
      tdSituacao.appendChild(spanSituacao);
      tr.appendChild(tdSituacao);
    }

    corpoTabela.appendChild(tr);
  });
}

function atualizarCards() {
  let somaMedias = 0;
  let qtdDisciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let qtdBom = 0;
  let qtdAtencao = 0;

  dadosBoletim.forEach((item) => {
    const t1 = normalizarNota(item.tri1);
    const t2 = normalizarNota(item.tri2);
    const t3 = normalizarNota(item.tri3);

    const media = calcularMedia([t1, t2, t3]);
    const faltasTrimestres = Array.isArray(item.faltas) ? item.faltas : [0, 0, 0];
    totalFaltasGeral += somarFaltas(faltasTrimestres);

    if (media !== null) {
      somaMedias += media;
      qtdDisciplinasComMedia++;
      if (media >= MEDIA_MINIMA) {
        qtdBom++;
      } else {
        qtdAtencao++;
      }
    }
  });

  const mediaGeralCalculada = qtdDisciplinasComMedia > 0 ? somaMedias / qtdDisciplinasComMedia : null;

  document.getElementById("mediaGeral").textContent = formatarNota(mediaGeralCalculada);
  document.getElementById("totalFaltas").textContent = totalFaltasGeral;
  document.getElementById("qtdBom").textContent = qtdBom;
  document.getElementById("qtdAtencao").textContent = qtdAtencao;
  document.getElementById("frequencia").textContent = FREQUENCIA_DEMONSTRATIVA + "%";
  document.getElementById("statusFrequencia").textContent = FREQUENCIA_DEMONSTRATIVA >= 75 ? "Frequência OK" : "Atenção às faltas";
}

function atualizarTelaCompleta() {
  preencherTabela();
  atualizarCards();

  const btnAlterar = document.getElementById("btnAlterarDados");
  const btnSalvar = document.getElementById("btnSalvarDados");

  if (modoEdicaoAtivo) {
    btnAlterar.textContent = "Cancelar edição";
    btnSalvar.style.display = "inline-block";
  } else {
    btnAlterar.textContent = "Alterar dados";
    btnSalvar.style.display = "none";
  }
}
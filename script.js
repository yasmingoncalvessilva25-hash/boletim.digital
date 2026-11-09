/* ==========================================================
   BOLETIM DIGITAL — SCRIPT (VERSÃO CONECTADA À API)
   Responsável por: gerenciar sessão com PIN, conectar com a API,
   tratar validações estritas de formulário e renderizar a tela.
   ========================================================== */

// CONFIGURAÇÃO FIXA DO ALUNO (Não alterável pela página)
const CONFIG_ALUNO = {
  turma: "8B",
  numeroChamada: 29,
  apiUrl: "https://profbt.com.br"
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
  { disciplina: "Práticas Experimentais", tri1: 58, tri2: "6,2", tri3: 6.4, faltas: [1, 1, 1] },
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
  return listaDeFaltas.reduce((total, f) => total + f, 0);
}

// Garante que o array de faltas seja limpo se vier em formato incorreto ou string da tela
function extrairFaltasArray(valor) {
  if (Array.isArray(valor)) return valor;
  if (typeof valor === "string") {
    return valor.split(",").map(f => parseInt(f.trim(), 10) || 0);
  }
  return;
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
    if (resultado.dados && resultado.dados.disciplinas && resultado.dados.disciplinas.length > 0) {
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
    const inputsNotaLinha = linha.querySelectorAll(".input-nota");
    const inputsFaltaLinha = linha.querySelectorAll(".input-falta");
    
    // Tratamento de Notas (Vazio vira null, caso contrário vira Float)
    const t1 = inputsNotaLinha[0].value.trim() === "" ? null : parseFloat(inputsNotaLinha[0].value.trim().replace(",", "."));
    const t2 = inputsNotaLinha[1].value.trim() === "" ? null : parseFloat(inputsNotaLinha[1].value.trim().replace(",", "."));
    const t3 = inputsNotaLinha[2].value.trim() === "" ? null : parseFloat(inputsNotaLinha[2].value.trim().replace(",", "."));
    
    // Tratamento de Faltas (Inteiros validados)
    const f1 = parseInt(inputsFaltaLinha[0].value.trim(), 10);
    const f2 = parseInt(inputsFaltaLinha[1].value.trim(), 10);
    const f3 = parseInt(inputsFaltaLinha[2].value.trim(), 10);

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


import { RenderizadorCanvas } from './motor/renderizador_canvas.js';
import { GeradorMapas, INFO_TILES, TIPOS_TILE, PALETAS_BIOMA } from './motor/gerador_mapas.js';
import { MotorNarrativo } from './motor/motor_narrativo.js';
import { MotorCombate } from './motor/motor_combate.js';

const CHAVE_SAVE = 'lendas_novo_mundo_save_v2';

const NOMES_ATRIBUTOS = {
  forca: 'Força',
  destreza: 'Destreza',
  constituicao: 'Constituição',
  inteligencia: 'Inteligência',
  sabedoria: 'Sabedoria',
  carisma: 'Carisma'
};

export const estadoJogo = {
  dadosRacasClasses: null,
  dadosPoderes: null,
  dadosMundo: null,
  configSprites: null,
  jogador: null,
  faseAtual: 'criacao',
  faseAnterior: 'ilha',
  mapaAtual: null,
  mapaOceano: null,
  posicaoJogador: { x: 14, y: 14 },
  posicaoNavio: { x: 37, y: 4 },
  atividadesConcluidas: {}
};

class GerenciadorCriacao {
  constructor(onConcluir, onCarregarSave) {
    this.onConcluir = onConcluir;
    this.onCarregarSave = onCarregarSave;
    this.pontosDisponiveis = 8;
    this.atributosBase = {
      forca: 10,
      destreza: 10,
      constituicao: 10,
      inteligencia: 10,
      sabedoria: 10,
      carisma: 10
    };
    this.previewZoan = false;
    this.renderizador = null;
  }

  async carregarJson(caminho) {
    const resposta = await fetch(caminho);
    if (!resposta.ok) {
      throw new Error(`Não foi possível carregar "${caminho}" (Erro HTTP ${resposta.status}).`);
    }
    return await resposta.json();
  }

  async iniciar() {
    try {
      const [dadosRacas, dadosPoderes, dadosMundo, configSprites] = await Promise.all([
        this.carregarJson('./dados/racas_classes.json'),
        this.carregarJson('./dados/poderes.json'),
        this.carregarJson('./dados/mundo_one_piece.json'),
        this.carregarJson('./recursos/config_sprites.json')
      ]);

      estadoJogo.dadosRacasClasses = dadosRacas;
      estadoJogo.dadosPoderes = dadosPoderes;
      estadoJogo.dadosMundo = dadosMundo;
      estadoJogo.configSprites = configSprites;

      const canvas = document.getElementById('canvas-preview');
      this.renderizador = new RenderizadorCanvas(canvas, estadoJogo.configSprites);

      if (localStorage.getItem(CHAVE_SAVE)) {
        document.getElementById('btn-continuar-save').classList.remove('oculto');
      }

      this.popularSeletores();
      this.renderizarGradeAtributos();
      this.registrarEventos();
      this.atualizarTudo();
    } catch (erro) {
      console.error('Erro ao inicializar Lendas do Novo Mundo:', erro);
      this.exibirErroNaTela(erro);
    }
  }

  exibirErroNaTela(erro) {
    const painel = document.querySelector('.painel-narrativo');
    const aviso = document.createElement('div');
    aviso.style.cssText =
      'background:#450a0a; border:2px solid #ef4444; color:#fecaca; padding:1rem; border-radius:6px; margin-bottom:1rem; line-height:1.5;';
    aviso.innerHTML = `<strong>⚠️ Erro ao carregar os dados do jogo:</strong><br/>${erro.message}`;
    painel.prepend(aviso);
  }

  popularSeletores() {
    const selMar = document.getElementById('select-mar-origem');
    const selRaca = document.getElementById('select-raca');
    const selClasse = document.getElementById('select-classe');
    const selHaki = document.getElementById('select-haki');
    const selAkuma = document.getElementById('select-akuma');

    Object.values(estadoJogo.dadosMundo.mares).forEach(mar => {
      const opt = document.createElement('option');
      opt.value = mar.id;
      opt.textContent = mar.nome;
      selMar.appendChild(opt);
    });

    estadoJogo.dadosRacasClasses.racas.forEach(raca => {
      const opt = document.createElement('option');
      opt.value = raca.id;
      opt.textContent = raca.nome;
      selRaca.appendChild(opt);
    });

    estadoJogo.dadosRacasClasses.classes.forEach(classe => {
      const opt = document.createElement('option');
      opt.value = classe.id;
      opt.textContent = classe.nome;
      selClasse.appendChild(opt);
    });

    estadoJogo.dadosPoderes.haki.forEach(haki => {
      const opt = document.createElement('option');
      opt.value = haki.id;
      opt.textContent = haki.nome;
      selHaki.appendChild(opt);
    });

    estadoJogo.dadosPoderes.akuma_no_mi.forEach(fruta => {
      const opt = document.createElement('option');
      opt.value = fruta.id;
      opt.textContent = `[${fruta.categoria}] ${fruta.nome}`;
      selAkuma.appendChild(opt);
    });
  }

  renderizarGradeAtributos() {
    const container = document.getElementById('grade-atributos');
    container.innerHTML = '';

    const racaAtual = this.obterRacaSelecionada();
    const classeAtual = this.obterClasseSelecionada();

    Object.keys(NOMES_ATRIBUTOS).forEach(chave => {
      const bonusRaca = (racaAtual.bonus_atributos && racaAtual.bonus_atributos[chave]) || 0;
      const bonusClasse = (classeAtual.bonus_atributos && classeAtual.bonus_atributos[chave]) || 0;
      const valorFinal = this.atributosBase[chave] + bonusRaca + bonusClasse;
      const mod = Math.floor((valorFinal - 10) / 2);
      const sinal = mod >= 0 ? `+${mod}` : `${mod}`;

      const div = document.createElement('div');
      div.className = 'item-atributo';
      div.innerHTML = `
        <div>
          <strong>${NOMES_ATRIBUTOS[chave]}</strong><br/>
          <small style="color:#94a3b8">Total: ${valorFinal} (${sinal})</small>
        </div>
        <div class="controles-attr">
          <button type="button" class="btn-attr" data-attr="${chave}" data-acao="diminuir" ${this.atributosBase[chave] <= 8 ? 'disabled' : ''}>-</button>
          <span>${this.atributosBase[chave]}</span>
          <button type="button" class="btn-attr" data-attr="${chave}" data-acao="aumentar" ${this.pontosDisponiveis <= 0 || this.atributosBase[chave] >= 16 ? 'disabled' : ''}>+</button>
        </div>
      `;
      container.appendChild(div);
    });

    document.getElementById('pontos-restantes').textContent = this.pontosDisponiveis;
  }

  registrarEventos() {
    document.getElementById('grade-atributos').addEventListener('click', (e) => {
      if (!e.target.classList.contains('btn-attr')) return;
      const attr = e.target.dataset.attr;
      const acao = e.target.dataset.acao;

      if (acao === 'aumentar' && this.pontosDisponiveis > 0 && this.atributosBase[attr] < 16) {
        this.atributosBase[attr]++;
        this.pontosDisponiveis--;
      } else if (acao === 'diminuir' && this.atributosBase[attr] > 8) {
        this.atributosBase[attr]--;
        this.pontosDisponiveis++;
      }
      this.atualizarTudo();
    });

    const idsMonitorados = [
      'select-faccao', 'select-mar-origem', 'select-raca', 'select-classe',
      'select-haki', 'select-akuma', 'cor-pele',
      'cor-cabelo', 'cor-roupa', 'cor-calca', 'select-acessorio'
    ];

    idsMonitorados.forEach(id => {
      document.getElementById(id).addEventListener('change', (e) => {
        if (id === 'select-faccao') {
          document.getElementById('select-acessorio').value =
            e.target.value === 'pirata' ? 'chapeu_pirata' : 'bone_marinha';
        }
        if (id === 'select-akuma') {
          this.previewZoan = false;
        }
        this.atualizarTudo();
      });
    });

    document.getElementById('btn-alternar-zoan').addEventListener('click', () => {
      this.previewZoan = !this.previewZoan;
      this.desenharPreview();
    });

    document.getElementById('btn-iniciar-aventura').addEventListener('click', () => {
      this.finalizarCriacao();
    });

    document.getElementById('btn-continuar-save').addEventListener('click', () => {
      this.onCarregarSave();
    });
  }

  obterMarSelecionado() {
    const id = document.getElementById('select-mar-origem').value;
    return estadoJogo.dadosMundo.mares[id];
  }

  obterRacaSelecionada() {
    const id = document.getElementById('select-raca').value;
    return estadoJogo.dadosRacasClasses.racas.find(r => r.id === id);
  }

  obterClasseSelecionada() {
    const id = document.getElementById('select-classe').value;
    return estadoJogo.dadosRacasClasses.classes.find(c => c.id === id);
  }

  obterHakiSelecionado() {
    const id = document.getElementById('select-haki').value;
    return estadoJogo.dadosPoderes.haki.find(h => h.id === id) || null;
  }

  obterAkumaSelecionada() {
    const id = document.getElementById('select-akuma').value;
    return estadoJogo.dadosPoderes.akuma_no_mi.find(f => f.id === id) || null;
  }

  calcularAtributosFinais() {
    const raca = this.obterRacaSelecionada();
    const classe = this.obterClasseSelecionada();
    const finais = {};

    Object.keys(NOMES_ATRIBUTOS).forEach(chave => {
      const bRaca = (raca.bonus_atributos && raca.bonus_atributos[chave]) || 0;
      const bClasse = (classe.bonus_atributos && classe.bonus_atributos[chave]) || 0;
      finais[chave] = this.atributosBase[chave] + bRaca + bClasse;
    });
    return finais;
  }

  atualizarTudo() {
    const mar = this.obterMarSelecionado();
    const raca = this.obterRacaSelecionada();
    const classe = this.obterClasseSelecionada();
    const haki = this.obterHakiSelecionado();
    const akuma = this.obterAkumaSelecionada();
    const attrs = this.calcularAtributosFinais();

    const ilhaInicial = estadoJogo.dadosMundo.ilhas.find(i => i.id === mar.ilha_inicial);
    document.getElementById('desc-mar').textContent =
      `${mar.descricao} Ilha Inicial: ${ilhaInicial ? ilhaInicial.nome : ''}.`;

    document.getElementById('desc-raca').textContent = raca.descricao;
    document.getElementById('desc-classe').textContent = classe.descricao;
    document.getElementById('desc-haki').textContent = haki ? haki.descricao : 'Sem domínio inicial de Haki.';
    document.getElementById('desc-akuma').textContent = akuma
      ? `${akuma.descricao} (Fraqueza: Água profunda é fatal!)`
      : 'Sem fruta consumida. Pode nadar livremente.';

    const modCon = Math.floor((attrs.constituicao - 10) / 2);
    const modDes = Math.floor((attrs.destreza - 10) / 2);
    const modSab = Math.floor((attrs.sabedoria - 10) / 2);

    const hpMax = Math.max(8, raca.hp_base + classe.hp_base + modCon * 2);
    const energiaMax = 40 + Math.max(0, modSab * 5) + (haki ? 15 : 0);
    const defesa = 10 + modDes + (raca.id === 'ciborgue' ? 1 : 0);

    document.getElementById('resumo-hp').textContent = hpMax;
    document.getElementById('resumo-energia').textContent = energiaMax;
    document.getElementById('resumo-defesa').textContent = defesa;
    document.getElementById('resumo-movimento').textContent = raca.movimento;
    document.getElementById('resumo-natacao').textContent = akuma ? 'Não (Afunda!)' : 'Sim';

    const todasHabilidades = [...raca.habilidades, ...classe.habilidades];
    document.getElementById('resumo-habilidades').innerHTML =
      `<strong>Habilidades Iniciais:</strong><br/>• ${todasHabilidades.map(h => h.nome).join('<br/>• ')}`;

    const btnZoan = document.getElementById('btn-alternar-zoan');
    if (akuma && akuma.categoria === 'Zoan') {
      btnZoan.classList.remove('oculto');
    } else {
      btnZoan.classList.add('oculto');
      this.previewZoan = false;
    }

    this.renderizarGradeAtributos();
    this.desenharPreview();
  }

  desenharPreview() {
    const raca = this.obterRacaSelecionada();
    const akuma = this.obterAkumaSelecionada();
    const aparencia = {
      corPele: document.getElementById('cor-pele').value,
      corCabelo: document.getElementById('cor-cabelo').value,
      corRoupa: document.getElementById('cor-roupa').value,
      corCalca: document.getElementById('cor-calca').value,
      acessorio: document.getElementById('select-acessorio').value
    };

    this.renderizador.limpar('#0f172a');
    this.renderizador.desenharGradeFundo(32);

    this.renderizador.desenharPersonagem(
      48,
      48,
      aparencia,
      raca.id,
      3,
      this.previewZoan,
      akuma ? akuma.paleta_cores : null
    );
  }

  finalizarCriacao() {
    const nome = document.getElementById('input-nome').value.trim() || 'Aventureiro';
    const faccao = document.getElementById('select-faccao').value;
    const mar = this.obterMarSelecionado();
    const raca = this.obterRacaSelecionada();
    const classe = this.obterClasseSelecionada();
    const haki = this.obterHakiSelecionado();
    const akuma = this.obterAkumaSelecionada();
    const atributos = this.calcularAtributosFinais();

    const modCon = Math.floor((atributos.constituicao - 10) / 2);
    const modDes = Math.floor((atributos.destreza - 10) / 2);
    const modSab = Math.floor((atributos.sabedoria - 10) / 2);

    estadoJogo.jogador = {
      nome,
      faccao,
      marOrigem: mar.id,
      nivel: 1,
      xp: 0,
      berries: 5000,
      suprimentos: 100,
      raca,
      classe,
      atributos,
      hpMax: Math.max(8, raca.hp_base + classe.hp_base + modCon * 2),
      hpAtual: Math.max(8, raca.hp_base + classe.hp_base + modCon * 2),
      energiaMax: 40 + Math.max(0, modSab * 5) + (haki ? 15 : 0),
      energiaAtual: 40 + Math.max(0, modSab * 5) + (haki ? 15 : 0),
      defesa: 10 + modDes + (raca.id === 'ciborgue' ? 1 : 0),
      movimento: raca.movimento,
      podeNadar: !akuma,
      haki: haki ? [haki] : [],
      akumaNoMi: akuma,
      habilidades: [...raca.habilidades, ...classe.habilidades],
      aparencia: {
        corPele: document.getElementById('cor-pele').value,
        corCabelo: document.getElementById('cor-cabelo').value,
        corRoupa: document.getElementById('cor-roupa').value,
        corCalca: document.getElementById('cor-calca').value,
        acessorio: document.getElementById('select-acessorio').value
      }
    };

    estadoJogo.atividadesConcluidas = {};
    this.onConcluir();
  }
}

class ControladorMundo {
  constructor() {
    this.geradorMapas = new GeradorMapas();
    this.renderizador = null;
    this.motorNarrativo = null;
    this.motorCombate = null;
    this.controlesRegistrados = false;
  }

  prepararInterfaceJogo() {
    document.getElementById('tela-criacao').classList.add('oculto');
    document.getElementById('tela-jogo').classList.remove('oculto');
    document.getElementById('botoes-sistema').classList.remove('oculto');

    const canvas = document.getElementById('canvas-jogo');
    this.renderizador = new RenderizadorCanvas(canvas, estadoJogo.configSprites);

    this.motorCombate = new MotorCombate(estadoJogo, this.renderizador, {
      onLog: (msg) => {
        this.registrarLog(msg);
        this.atualizarHudCombate();
      },
      onAtualizarUI: (titulo, texto) => {
        this.montarPainelAcoesCombate(titulo, texto);
      },
      onFimCombate: (vitoria) => {
        this.finalizarBatalha(vitoria);
      }
    });

    this.motorNarrativo = new MotorNarrativo(estadoJogo, {
      iniciarCombate: (tipoInimigo) => {
        this.entrarModoCombate(tipoInimigo);
      },
      zarparOceano: () => {
        this.entrarModoOceano();
      },
      atracarIlha: (ilhaConfig) => {
        this.entrarModoIlha(ilhaConfig);
      },
      atravessarReverseMountain: () => {
        estadoJogo.posicaoNavio = { x: 23, y: 12 };
        document.getElementById('coordenadas-jogador').textContent = `Navio: (23, 12) • Grand Line`;
        this.renderizar();
      },
      rebocarParaPortoSeguro: () => {
        const mar = estadoJogo.dadosMundo.mares[estadoJogo.jogador.marOrigem || 'east_blue'];
        const ilhaSegura = estadoJogo.dadosMundo.ilhas.find(i => i.id === mar.ilha_inicial);
        if (ilhaSegura) {
          estadoJogo.posicaoNavio = { x: ilhaSegura.x, y: ilhaSegura.y };
        }
        this.entrarModoIlha(ilhaSegura);
      },
      limparTileOceano: (x, y) => {
        if (estadoJogo.mapaOceano) {
          estadoJogo.mapaOceano.matriz[y][x] = TIPOS_TILE.MAR_ABERTO;
          this.renderizar();
        }
      }
    });

    if (!this.controlesRegistrados) {
      this.registrarControles(canvas);
      this.controlesRegistrados = true;
    }
  }

  iniciarAventura() {
    this.prepararInterfaceJogo();
    const mar = estadoJogo.dadosMundo.mares[estadoJogo.jogador.marOrigem];
    const ilhaInicial = estadoJogo.dadosMundo.ilhas.find(i => i.id === mar.ilha_inicial);

    estadoJogo.mapaOceano = this.geradorMapas.gerarMapaMundi(estadoJogo.dadosMundo);
    estadoJogo.posicaoNavio = ilhaInicial
      ? { x: ilhaInicial.x, y: ilhaInicial.y }
      : { ...mar.porto_saida };

    this.entrarModoIlha(ilhaInicial);
    this.salvarProgresso(true);
  }

  salvarProgresso(silencioso = false) {
    if (estadoJogo.faseAtual === 'combate') {
      this.registrarLog('⚠️ Não é possível salvar durante um combate tático.');
      return;
    }

    const dadosSave = {
      jogador: estadoJogo.jogador,
      faseAtual: estadoJogo.faseAtual,
      mapaAtual: estadoJogo.mapaAtual,
      mapaOceano: estadoJogo.mapaOceano,
      posicaoJogador: estadoJogo.posicaoJogador,
      posicaoNavio: estadoJogo.posicaoNavio,
      atividadesConcluidas: estadoJogo.atividadesConcluidas
    };

    localStorage.setItem(CHAVE_SAVE, JSON.stringify(dadosSave));
    if (!silencioso) {
      this.registrarLog('💾 Progresso salvo com sucesso no navegador!');
    }
  }

  carregarProgresso() {
    const bruto = localStorage.getItem(CHAVE_SAVE);
    if (!bruto) {
      alert('Nenhum jogo salvo encontrado.');
      return;
    }

    const dados = JSON.parse(bruto);
    estadoJogo.jogador = dados.jogador;
    estadoJogo.faseAtual = dados.faseAtual || 'ilha';
    estadoJogo.mapaAtual = dados.mapaAtual;
    estadoJogo.mapaOceano = dados.mapaOceano;
    estadoJogo.posicaoJogador = dados.posicaoJogador || { x: 14, y: 14 };
    estadoJogo.posicaoNavio = dados.posicaoNavio || { x: 37, y: 4 };
    estadoJogo.atividadesConcluidas = dados.atividadesConcluidas || {};

    this.prepararInterfaceJogo();

    if (estadoJogo.faseAtual === 'oceano' && estadoJogo.mapaOceano) {
      document.getElementById('barra-status-topo').innerHTML =
        `<span>Fase Atual: Mapa-Múndi Oceânico</span>`;
      document.getElementById('titulo-local').textContent = estadoJogo.mapaOceano.nome;
      document.getElementById('coordenadas-jogador').textContent =
        `Navio: (${estadoJogo.posicaoNavio.x}, ${estadoJogo.posicaoNavio.y})`;
      this.atualizarLegenda('oceano');
    } else {
      estadoJogo.faseAtual = 'ilha';
      if (!estadoJogo.mapaAtual) {
        const mar = estadoJogo.dadosMundo.mares[estadoJogo.jogador.marOrigem || 'east_blue'];
        const ilhaInicial = estadoJogo.dadosMundo.ilhas.find(i => i.id === mar.ilha_inicial);
        estadoJogo.mapaAtual = this.geradorMapas.gerarIlha(ilhaInicial);
      }
      const nomeBioma = PALETAS_BIOMA[estadoJogo.mapaAtual.bioma]?.nome || 'Tropical';
      document.getElementById('barra-status-topo').innerHTML =
        `<span>Exploração: ${estadoJogo.mapaAtual.nome} (${nomeBioma})</span>`;
      document.getElementById('titulo-local').textContent = estadoJogo.mapaAtual.nome;
      document.getElementById('coordenadas-jogador').textContent =
        `Pos: (${estadoJogo.posicaoJogador.x}, ${estadoJogo.posicaoJogador.y})`;
      this.atualizarLegenda('ilha');
    }

    this.atualizarHud();
    this.renderizar();
    this.registrarLog(`📂 Aventura de ${estadoJogo.jogador.nome} carregada com sucesso!`);
  }

  verificarSubidaNivel() {
    const j = estadoJogo.jogador;
    while (j.xp >= j.nivel * 100) {
      j.xp -= j.nivel * 100;
      j.nivel += 1;
      j.hpMax += 4;
      j.hpAtual = j.hpMax;
      j.energiaMax += 5;
      j.energiaAtual = j.energiaMax;

      Object.keys(j.atributos).forEach(attr => {
        j.atributos[attr] += 1;
      });

      this.registrarLog(
        `🌟 LEVEL UP! ${j.nome} alcançou o Nível ${j.nivel}! (+4 HP Máx, +5 Energia, +1 em todos os atributos)`
      );
    }
  }

  exibirFichaModal() {
    const j = estadoJogo.jogador;
    const attrsTexto = Object.entries(j.atributos)
      .map(([k, v]) => `${NOMES_ATRIBUTOS[k]}: ${v}`)
      .join(' | ');

    alert(
      `=== FICHA DE COMBATENTE ===\n` +
      `Nome: ${j.nome} (${j.faccao.toUpperCase()}) - Nível ${j.nivel} (${j.xp}/${j.nivel * 100} XP)\n` +
      `Mar de Origem: ${estadoJogo.dadosMundo.mares[j.marOrigem]?.nome || 'East Blue'}\n` +
      `Raça: ${j.raca.nome} | Classe: ${j.classe.nome}\n` +
      `HP: ${j.hpAtual}/${j.hpMax} | Energia: ${j.energiaAtual}/${j.energiaMax} | Defesa: ${j.defesa}\n` +
      `Akuma no Mi: ${j.akumaNoMi ? j.akumaNoMi.nome : 'Nenhuma'}\n` +
      `Haki: ${j.haki.length > 0 ? j.haki.map(h => h.nome).join(', ') : 'Nenhum'}\n\n` +
      `Atributos:\n${attrsTexto}`
    );
  }

  entrarModoCombate(tipoInimigo) {
    estadoJogo.faseAnterior = estadoJogo.faseAtual;
    estadoJogo.faseAtual = 'combate';

    document.getElementById('barra-status-topo').innerHTML =
      `<span>Fase Atual: ⚔️ Combate Tático (Grid 10x10)</span>`;
    document.getElementById('titulo-local').textContent = 'Arena de Combate (10x10)';
    document.getElementById('coordenadas-jogador').textContent = 'Clique no grid para agir';
    document.querySelector('.controles-direcionais').classList.add('oculto');

    this.atualizarLegenda('combate');
    this.motorCombate.iniciarBatalha(tipoInimigo);
  }

  montarPainelAcoesCombate(titulo, texto) {
    const tituloEl = document.getElementById('narrativa-titulo');
    const textoEl = document.getElementById('narrativa-texto');
    const opcoesEl = document.getElementById('narrativa-opcoes');
    const jogador = this.motorCombate.obterJogador();

    tituloEl.textContent = titulo;
    textoEl.textContent = texto;
    opcoesEl.innerHTML = '';

    const btnMover = document.createElement('button');
    btnMover.type = 'button';
    btnMover.className = 'btn-opcao';
    btnMover.textContent = `🦶 Mover (${jogador.movimentoRestante} quadrados restantes)`;
    btnMover.addEventListener('click', () => this.motorCombate.selecionarAcao('mover'));
    opcoesEl.appendChild(btnMover);

    const btnAtacar = document.createElement('button');
    btnAtacar.type = 'button';
    btnAtacar.className = 'btn-opcao';
    btnAtacar.textContent = `👊 Ataque Básico (Alcance: 1 quad.)`;
    btnAtacar.addEventListener('click', () => this.motorCombate.selecionarAcao('atacar'));
    opcoesEl.appendChild(btnAtacar);

    if (jogador.akumaNoMi) {
      const fruta = jogador.akumaNoMi;
      const btnFruta = document.createElement('button');
      btnFruta.type = 'button';
      btnFruta.className = 'btn-opcao';
      btnFruta.textContent = `🍎 ${fruta.nome} (Custo: ${fruta.custo_energia} EN | Empurrão: ${fruta.empurrao})`;
      btnFruta.addEventListener('click', () => this.motorCombate.selecionarAcao('poder', fruta));
      opcoesEl.appendChild(btnFruta);
    }

    jogador.haki.forEach(haki => {
      const btnHaki = document.createElement('button');
      btnHaki.type = 'button';
      btnHaki.className = 'btn-opcao';
      btnHaki.textContent = `✨ ${haki.nome} (Custo: ${haki.custo_energia} EN)`;
      btnHaki.addEventListener('click', () => this.motorCombate.selecionarAcao('poder', haki));
      opcoesEl.appendChild(btnHaki);
    });

    jogador.habilidades.filter(h => h.tipo === 'ativa').forEach(hab => {
      const btnHab = document.createElement('button');
      btnHab.type = 'button';
      btnHab.className = 'btn-opcao';
      btnHab.textContent = `⚡ ${hab.nome} (Custo: ${hab.custo_energia} EN)`;
      btnHab.addEventListener('click', () =>
        this.motorCombate.selecionarAcao('poder', {
          ...hab,
          dano_base: 14,
          empurrao: hab.id === 'forca_bruta' || hab.id === 'dial_impacto' ? 2 : 0,
          efeito_visual: 'particulas_area',
          paleta_cores: ['#38bdf8', '#facc15']
        })
      );
      opcoesEl.appendChild(btnHab);
    });

    const btnPassar = document.createElement('button');
    btnPassar.type = 'button';
    btnPassar.className = 'btn-primario';
    btnPassar.style.marginTop = '0.4rem';
    btnPassar.textContent = '⏭️ Encerrar Turno';
    btnPassar.addEventListener('click', async () => {
      await this.motorCombate.encerrarTurnoJogador();
      if (estadoJogo.faseAtual === 'combate') {
        this.montarPainelAcoesCombate('🔵 Seu Turno', 'Escolha sua próxima jogada tática no grid 10x10.');
      }
    });
    opcoesEl.appendChild(btnPassar);
  }

  atualizarHudCombate() {
    const u = this.motorCombate?.obterJogador();
    if (!u) return;
    document.getElementById('hud-hp').textContent = `${u.hpAtual}/${u.hpMax}`;
    document.getElementById('hud-energia').textContent = `${u.energiaAtual}/${u.energiaMax}`;
  }

  finalizarBatalha(vitoria) {
    document.querySelector('.controles-direcionais').classList.remove('oculto');
    if (vitoria) {
      this.registrarLog('🏆 VITÓRIA! Você ganhou +80 XP e +฿ 1.500!');
      this.verificarSubidaNivel();
      if (estadoJogo.faseAnterior === 'oceano') {
        this.entrarModoOceano();
      } else {
        this.entrarModoIlha({
          id: estadoJogo.mapaAtual?.id,
          nome: estadoJogo.mapaAtual?.nome,
          mar: estadoJogo.mapaAtual?.mar,
          bioma: estadoJogo.mapaAtual?.bioma,
          nivel_recomendado: estadoJogo.mapaAtual?.nivelRecomendado
        });
      }
      this.salvarProgresso(true);
    } else {
      alert('Você foi derrotado em batalha! A tripulação recuou para se recuperar.');
      estadoJogo.jogador.hpAtual = estadoJogo.jogador.hpMax;
      estadoJogo.jogador.energiaAtual = estadoJogo.jogador.energiaMax;
      this.entrarModoIlha(null);
    }
  }

  entrarModoIlha(ilhaConfig) {
    estadoJogo.faseAtual = 'ilha';
    estadoJogo.mapaAtual = this.geradorMapas.gerarIlha(ilhaConfig);
    estadoJogo.posicaoJogador = { ...estadoJogo.mapaAtual.posicaoInicial };

    const nomeBioma = PALETAS_BIOMA[estadoJogo.mapaAtual.bioma]?.nome || 'Tropical';
    document.getElementById('barra-status-topo').innerHTML =
      `<span>Exploração: ${estadoJogo.mapaAtual.nome} • ${nomeBioma}</span>`;
    document.getElementById('titulo-local').textContent = estadoJogo.mapaAtual.nome;
    document.getElementById('coordenadas-jogador').textContent =
      `Pos: (${estadoJogo.posicaoJogador.x}, ${estadoJogo.posicaoJogador.y})`;

    this.atualizarLegenda('ilha');
    this.atualizarHud();
    this.renderizar();
    this.registrarLog(`Você desembarcou em ${estadoJogo.mapaAtual.nome} (${nomeBioma}).`);
  }

  identificarRegiaoOceano(x, y) {
    if (y >= 11 && y <= 13) {
      return x >= 22 ? 'Grand Line (Paraíso)' : 'Grand Line (Novo Mundo)';
    }
    if (y < 10) {
      return x < 20 ? 'North Blue' : 'East Blue';
    }
    if (y > 14) {
      return x < 20 ? 'West Blue' : 'South Blue';
    }
    return 'Calm Belt';
  }

  entrarModoOceano() {
    estadoJogo.faseAtual = 'oceano';
    if (!estadoJogo.mapaOceano) {
      estadoJogo.mapaOceano = this.geradorMapas.gerarMapaMundi(estadoJogo.dadosMundo);
    }

    const regiao = this.identificarRegiaoOceano(estadoJogo.posicaoNavio.x, estadoJogo.posicaoNavio.y);
    document.getElementById('barra-status-topo').innerHTML =
      `<span>Navegação Marítima • ${regiao}</span>`;
    document.getElementById('titulo-local').textContent = `Oceano — ${regiao}`;
    document.getElementById('coordenadas-jogador').textContent =
      `Navio: (${estadoJogo.posicaoNavio.x}, ${estadoJogo.posicaoNavio.y})`;

    this.atualizarLegenda('oceano');
    this.atualizarHud();
    this.renderizar();

    document.getElementById('narrativa-titulo').textContent = `🧭 Navegando por ${regiao}`;
    document.getElementById('narrativa-texto').textContent =
      'Explore as ilhas oficiais do mapa! Para entrar na Grand Line, navegue até o centro do mapa-múndi na Reverse Mountain (x: 20-21, y: 12).';
    document.getElementById('narrativa-opcoes').innerHTML = '';
    this.registrarLog(`Você zarpou para ${regiao}!`);
  }

  atualizarLegenda(modo) {
    const legenda = document.querySelector('.legenda-mapa');
    if (modo === 'ilha') {
      legenda.innerHTML = `
        <span><i style="background:#f59e0b"></i> Taverna (Oeste)</span>
        <span><i style="background:#dc2626"></i> Dojo (Leste)</span>
        <span><i style="background:#3b82f6"></i> Marinha (Norte)</span>
        <span><i style="background:#38bdf8"></i> Porto (Sul)</span>
      `;
    } else if (modo === 'oceano') {
      legenda.innerHTML = `
        <span><i style="background:#16a34a"></i> Ilha</span>
        <span><i style="background:#991b1b"></i> Red Line</span>
        <span><i style="background:#facc15"></i> Reverse Mt.</span>
        <span><i style="background:#ef4444"></i> Navio Hostil</span>
      `;
    } else {
      legenda.innerHTML = `
        <span><i style="background:#1d4ed8"></i> Água (Fatal p/ Akuma)</span>
        <span><i style="background:#78350f"></i> Obstáculo</span>
        <span><i style="background:#38bdf8"></i> Alcance Mover</span>
        <span><i style="background:#ef4444"></i> Alcance Ataque</span>
      `;
    }
  }

  registrarControles(canvas) {
    document.getElementById('btn-salvar-jogo').addEventListener('click', () => this.salvarProgresso(false));
    document.getElementById('btn-carregar-jogo').addEventListener('click', () => this.carregarProgresso());
    document.getElementById('btn-ver-ficha').addEventListener('click', () => this.exibirFichaModal());

    canvas.addEventListener('click', (e) => {
      if (estadoJogo.faseAtual !== 'combate') return;
      const rect = canvas.getBoundingClientRect();
      const escalaX = canvas.width / rect.width;
      const escalaY = canvas.height / rect.height;
      const gx = Math.floor(((e.clientX - rect.left) * escalaX) / 48);
      const gy = Math.floor(((e.clientY - rect.top) * escalaY) / 48);

      this.motorCombate.lidarCliqueGrid(gx, gy);
    });

    window.addEventListener('keydown', (e) => {
      if (estadoJogo.faseAtual !== 'ilha' && estadoJogo.faseAtual !== 'oceano') return;
      const mapaTeclas = {
        ArrowUp: 'cima', w: 'cima', W: 'cima',
        ArrowDown: 'baixo', s: 'baixo', S: 'baixo',
        ArrowLeft: 'esquerda', a: 'esquerda', A: 'esquerda',
        ArrowRight: 'direita', d: 'direita', D: 'direita'
      };
      if (mapaTeclas[e.key]) {
        e.preventDefault();
        this.moverEntidade(mapaTeclas[e.key]);
      }
    });

    document.querySelectorAll('.btn-dpad').forEach(btn => {
      btn.addEventListener('click', () => {
        if (estadoJogo.faseAtual === 'ilha' || estadoJogo.faseAtual === 'oceano') {
          this.moverEntidade(btn.dataset.dir);
        }
      });
    });
  }

  moverEntidade(direcao) {
    const deltas = {
      cima: { dx: 0, dy: -1 },
      baixo: { dx: 0, dy: 1 },
      esquerda: { dx: -1, dy: 0 },
      direita: { dx: 1, dy: 0 }
    };

    if (estadoJogo.faseAtual === 'ilha') {
      const novoX = estadoJogo.posicaoJogador.x + deltas[direcao].dx;
      const novoY = estadoJogo.posicaoJogador.y + deltas[direcao].dy;
      const mapa = estadoJogo.mapaAtual;

      if (novoX < 0 || novoX >= mapa.largura || novoY < 0 || novoY >= mapa.altura) return;

      const tipoTile = mapa.matriz[novoY][novoX];
      if (!INFO_TILES[tipoTile].caminhavel) {
        this.registrarLog(`Caminho bloqueado por ${INFO_TILES[tipoTile].nome}.`);
        return;
      }

      estadoJogo.posicaoJogador = { x: novoX, y: novoY };
      document.getElementById('coordenadas-jogador').textContent = `Pos: (${novoX}, ${novoY})`;
      this.renderizar();
      this.exibirEvento(this.motorNarrativo.gerarEventoLocal(tipoTile), INFO_TILES[tipoTile].nome);
    } else if (estadoJogo.faseAtual === 'oceano') {
      const jogador = estadoJogo.jogador;

      // Bloqueia navegação se os suprimentos estiverem zerados (Navio à Deriva)
      if (jogador.suprimentos <= 0) {
        this.registrarLog('🚨 Navio à deriva! Sem suprimentos para navegar. Resolva a emergência no painel narrativo.');
        this.exibirEvento(this.motorNarrativo.gerarEventoSemSuprimentos(), 'Navio à Deriva');
        return;
      }

      const novoX = estadoJogo.posicaoNavio.x + deltas[direcao].dx;
      const novoY = estadoJogo.posicaoNavio.y + deltas[direcao].dy;
      const mapa = estadoJogo.mapaOceano;

      if (novoX < 0 || novoX >= mapa.largura || novoY < 0 || novoY >= mapa.altura) return;

      const tipoTile = mapa.matriz[novoY][novoX];
      if (!INFO_TILES[tipoTile].navegavel) {
        this.registrarLog(`Rota bloqueada pela ${INFO_TILES[tipoTile].nome}!`);
        return;
      }

      estadoJogo.posicaoNavio = { x: novoX, y: novoY };
      jogador.suprimentos = Math.max(0, jogador.suprimentos - 1);

      const regiao = this.identificarRegiaoOceano(novoX, novoY);
      document.getElementById('titulo-local').textContent = `Oceano — ${regiao}`;
      document.getElementById('coordenadas-jogador').textContent = `Navio: (${novoX}, ${novoY})`;

      this.atualizarHud();
      this.renderizar();

      // Se acabou de chegar a 0 suprimentos neste movimento, aciona imediatamente o alerta de navio à deriva
      if (jogador.suprimentos === 0) {
        this.registrarLog('🚨 Seus suprimentos acabaram completamente! O navio ficou à deriva.');
        this.exibirEvento(this.motorNarrativo.gerarEventoSemSuprimentos(), 'Navio à Deriva');
        return;
      }

      const eventoMar = this.motorNarrativo.gerarEventoMaritimo(tipoTile, novoX, novoY);
      this.exibirEvento(eventoMar, `${regiao} — Mar Aberto`);
    }
  }

  exibirEvento(evento, tituloPadrao) {
    const tituloEl = document.getElementById('narrativa-titulo');
    const textoEl = document.getElementById('narrativa-texto');
    const opcoesEl = document.getElementById('narrativa-opcoes');
    opcoesEl.innerHTML = '';

    if (!evento) {
      tituloEl.textContent = tituloPadrao;
      textoEl.textContent = estadoJogo.faseAtual === 'ilha'
        ? 'Ilha ampla (28x28): Taverna a Oeste, Dojo a Leste, Marinha ao Norte e Porto ao Sul.'
        : 'Navegue até uma das ilhas nomeadas no mapa ou rume ao centro (Reverse Mountain) para entrar na Grand Line.';
      return;
    }

    tituloEl.textContent = evento.titulo;
    textoEl.textContent = evento.texto;

    evento.opcoes.forEach(opcao => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-opcao';
      btn.textContent = opcao.texto;
      btn.addEventListener('click', () => {
        const resultado = opcao.acao();
        this.registrarLog(resultado);
        this.verificarSubidaNivel();

        if (estadoJogo.faseAtual !== 'combate') {
          this.atualizarHud();
          // Se era uma atividade única de XP, recarrega o evento do local para remover o botão imediatamente
          if (opcao.unica && estadoJogo.faseAtual === 'ilha') {
            const tileAtual = estadoJogo.mapaAtual.matriz[estadoJogo.posicaoJogador.y][estadoJogo.posicaoJogador.x];
            this.exibirEvento(this.motorNarrativo.gerarEventoLocal(tileAtual), tituloPadrao);
          }
          textoEl.textContent = resultado;
        }
      });
      opcoesEl.appendChild(btn);
    });
  }

  atualizarHud() {
    const j = estadoJogo.jogador;
    document.getElementById('hud-nome').textContent = `${j.nome} (Nv. ${j.nivel} • ${j.xp}/${j.nivel * 100} XP)`;
    const badge = document.getElementById('hud-faccao');
    badge.textContent = j.faccao.toUpperCase();
    badge.className = `badge-faccao ${j.faccao}`;

    document.getElementById('hud-hp').textContent = `${j.hpAtual}/${j.hpMax}`;
    document.getElementById('hud-energia').textContent = `${j.energiaAtual}/${j.energiaMax}`;
    document.getElementById('hud-berries').textContent = `฿ ${j.berries.toLocaleString('pt-BR')}`;
    document.getElementById('hud-suprimentos').textContent = `${j.suprimentos}%`;
  }

  registrarLog(mensagem) {
    const lista = document.getElementById('lista-log');
    const item = document.createElement('li');
    item.textContent = `• ${mensagem}`;
    lista.prepend(item);
  }

  renderizar() {
    if (estadoJogo.faseAtual === 'ilha') {
      this.renderizador.desenharMapaIlha(
        estadoJogo.mapaAtual,
        estadoJogo.posicaoJogador,
        estadoJogo.jogador
      );
    } else if (estadoJogo.faseAtual === 'oceano') {
      this.renderizador.desenharMapaOceano(
        estadoJogo.mapaOceano,
        estadoJogo.posicaoNavio,
        estadoJogo.jogador.faccao
      );
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const mundo = new ControladorMundo();
  const criador = new GerenciadorCriacao(
    () => mundo.iniciarAventura(),
    () => mundo.carregarProgresso()
  );
  criador.iniciar();
});
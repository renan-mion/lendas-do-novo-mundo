import { RenderizadorCanvas } from './motor/renderizador_canvas.js';
import { GeradorMapas, INFO_TILES } from './motor/gerador_mapas.js';
import { MotorNarrativo } from './motor/motor_narrativo.js';

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
  configSprites: null,
  jogador: null,
  faseAtual: 'criacao',
  mapaAtual: null,
  posicaoJogador: { x: 7, y: 7 }
};

class GerenciadorCriacao {
  constructor(onConcluir) {
    this.onConcluir = onConcluir;
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
      const [dadosRacas, dadosPoderes, configSprites] = await Promise.all([
        this.carregarJson('./dados/racas_classes.json'),
        this.carregarJson('./dados/poderes.json'),
        this.carregarJson('./recursos/config_sprites.json')
      ]);

      estadoJogo.dadosRacasClasses = dadosRacas;
      estadoJogo.dadosPoderes = dadosPoderes;
      estadoJogo.configSprites = configSprites;

      const canvas = document.getElementById('canvas-preview');
      this.renderizador = new RenderizadorCanvas(canvas, estadoJogo.configSprites);

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
    const selRaca = document.getElementById('select-raca');
    const selClasse = document.getElementById('select-classe');
    const selHaki = document.getElementById('select-haki');
    const selAkuma = document.getElementById('select-akuma');

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
      'select-faccao', 'select-raca', 'select-classe',
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
    const raca = this.obterRacaSelecionada();
    const classe = this.obterClasseSelecionada();
    const haki = this.obterHakiSelecionado();
    const akuma = this.obterAkumaSelecionada();
    const attrs = this.calcularAtributosFinais();

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

    this.onConcluir();
  }
}

class ControladorMundo {
  constructor() {
    this.geradorMapas = new GeradorMapas(15, 15);
    this.renderizador = null;
    this.motorNarrativo = null;
  }

  iniciarExploracaoIlha() {
    estadoJogo.faseAtual = 'ilha';
    document.getElementById('tela-criacao').classList.add('oculto');
    document.getElementById('tela-jogo').classList.remove('oculto');

    const canvas = document.getElementById('canvas-jogo');
    this.renderizador = new RenderizadorCanvas(canvas, estadoJogo.configSprites);

    estadoJogo.mapaAtual = this.geradorMapas.gerarIlhaOrigem(estadoJogo.jogador.faccao);
    estadoJogo.posicaoJogador = { ...estadoJogo.mapaAtual.posicaoInicial };

    this.motorNarrativo = new MotorNarrativo(estadoJogo, {
      iniciarCombate: (tipoInimigo) => {
        this.registrarLog(`⚔️ Preparando combate tático 10x10 contra: ${tipoInimigo} (Será ativado na Fase 5!)`);
      },
      zarparOceano: () => {
        this.registrarLog(`⛵ Navegação marítima procedural será ativada na Fase 4!`);
      }
    });

    document.getElementById('barra-status-topo').innerHTML =
      `<span>Fase Atual: Exploração Terrestre (${estadoJogo.mapaAtual.nome})</span>`;
    document.getElementById('titulo-local').textContent = estadoJogo.mapaAtual.nome;

    this.registrarControles();
    this.atualizarHud();
    this.renderizar();
    this.registrarLog(`Você desembarcou em ${estadoJogo.mapaAtual.nome}.`);
  }

  registrarControles() {
    window.addEventListener('keydown', (e) => {
      if (estadoJogo.faseAtual !== 'ilha') return;
      const mapaTeclas = {
        ArrowUp: 'cima', w: 'cima', W: 'cima',
        ArrowDown: 'baixo', s: 'baixo', S: 'baixo',
        ArrowLeft: 'esquerda', a: 'esquerda', A: 'esquerda',
        ArrowRight: 'direita', d: 'direita', D: 'direita'
      };
      if (mapaTeclas[e.key]) {
        e.preventDefault();
        this.moverJogador(mapaTeclas[e.key]);
      }
    });

    document.querySelectorAll('.btn-dpad').forEach(btn => {
      btn.addEventListener('click', () => {
        if (estadoJogo.faseAtual === 'ilha') {
          this.moverJogador(btn.dataset.dir);
        }
      });
    });
  }

  moverJogador(direcao) {
    const deltas = {
      cima: { dx: 0, dy: -1 },
      baixo: { dx: 0, dy: 1 },
      esquerda: { dx: -1, dy: 0 },
      direita: { dx: 1, dy: 0 }
    };

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
    this.verificarEventoTile(tipoTile);
  }

  verificarEventoTile(tipoTile) {
    const evento = this.motorNarrativo.gerarEventoLocal(tipoTile);
    const tituloEl = document.getElementById('narrativa-titulo');
    const textoEl = document.getElementById('narrativa-texto');
    const opcoesEl = document.getElementById('narrativa-opcoes');
    opcoesEl.innerHTML = '';

    if (!evento) {
      tituloEl.textContent = INFO_TILES[tipoTile].nome;
      textoEl.textContent = 'Você caminha pela ilha observando o horizonte. Aproxime-se da Taverna, Dojo, Base da Marinha ou Porto.';
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
        textoEl.textContent = resultado;
        this.atualizarHud();
      });
      opcoesEl.appendChild(btn);
    });
  }

  atualizarHud() {
    const j = estadoJogo.jogador;
    document.getElementById('hud-nome').textContent = `${j.nome} (Nv. ${j.nivel} • ${j.xp} XP)`;
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
    this.renderizador.desenharMapaIlha(
      estadoJogo.mapaAtual,
      estadoJogo.posicaoJogador,
      estadoJogo.jogador
    );
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const mundo = new ControladorMundo();
  const criador = new GerenciadorCriacao(() => mundo.iniciarExploracaoIlha());
  criador.iniciar();
});
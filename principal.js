import { RenderizadorCanvas } from './motor/renderizador_canvas.js';

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
  faseAtual: 'criacao'
};

class GerenciadorCriacao {
  constructor() {
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

  async iniciar() {
    const [resRacas, resPoderes, resSprites] = await Promise.all([
      fetch('./dados/racas_classes.json'),
      fetch('./dados/poderes.json'),
      fetch('./recursos/config_sprites.json')
    ]);

    estadoJogo.dadosRacasClasses = await resRacas.json();
    estadoJogo.dadosPoderes = await resPoderes.json();
    estadoJogo.configSprites = await resSprites.json();

    const canvas = document.getElementById('canvas-preview');
    this.renderizador = new RenderizadorCanvas(canvas, estadoJogo.configSprites);

    this.popularSeletores();
    this.renderizarGradeAtributos();
    this.registrarEventos();
    this.atualizarTudo();
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

    // Desenha o sprite ampliado 3x (96x96) centralizado no canvas 192x192
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

    console.log('Personagem criado com sucesso:', estadoJogo.jogador);
    alert(
      `Ficha confirmada para ${estadoJogo.jogador.nome} (${faccao.toUpperCase()})!\n` +
      `Raça: ${raca.nome} | Classe: ${classe.nome}\n` +
      `HP: ${estadoJogo.jogador.hpMax} | Energia: ${estadoJogo.jogador.energiaMax}\n\n` +
      `Tudo pronto para construirmos a Ilha de Origem na Fase 3!`
    );
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const criador = new GerenciadorCriacao();
  criador.iniciar();
});
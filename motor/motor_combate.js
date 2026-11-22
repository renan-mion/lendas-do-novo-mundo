export const TERRENOS_COMBATE = {
  CHAO: 0,
  OBSTACULO: 1,
  AGUA: 2,
  GELO: 3,
  SALA_OPE: 4,
  FUMAÇA: 5
};

export class MotorCombate {
  constructor(estadoJogo, renderizador, callbacks) {
    this.estadoJogo = estadoJogo;
    this.renderizador = renderizador;
    this.callbacks = callbacks;

    this.tamanhoGrid = 10;
    this.grid = [];
    this.unidades = [];
    this.turnoAtual = 'jogador'; // 'jogador' | 'inimigo'
    this.acaoSelecionada = null; // { tipo: 'mover' | 'atacar' | 'poder', dados: obj }
    this.animando = false;
  }

  iniciarBatalha(tipoEncontro = 'patrulha_marinha') {
    this.gerarArena(tipoEncontro);
    this.posicionarCombatentes(tipoEncontro);
    this.turnoAtual = 'jogador';
    this.acaoSelecionada = { tipo: 'mover', dados: null };
    this.animando = false;

    this.callbacks.onAtualizarUI(
      '⚔️ Combate Tático Iniciado!',
      'Seu turno! Mova-se pelo grid 10x10 ou selecione um ataque, Haki ou poder de Akuma no Mi.'
    );
    this.renderizarCena();
  }

  gerarArena(tipoEncontro) {
    this.grid = [];
    const ehNaval = tipoEncontro === 'abordagem_naval';

    for (let y = 0; y < this.tamanhoGrid; y++) {
      const linha = [];
      for (let x = 0; x < this.tamanhoGrid; x++) {
        if (ehNaval && (y === 0 || y === 9 || x === 0 || x === 9)) {
          linha.push(TERRENOS_COMBATE.AGUA);
        } else if (!ehNaval && (y === 9 || (x === 9 && y >= 6))) {
          // Pier/costa com água nas bordas
          linha.push(TERRENOS_COMBATE.AGUA);
        } else if (Math.random() < 0.08 && x > 1 && x < 8 && y > 1 && y < 8) {
          linha.push(TERRENOS_COMBATE.OBSTACULO);
        } else {
          linha.push(TERRENOS_COMBATE.CHAO);
        }
      }
      this.grid.push(linha);
    }
  }

  posicionarCombatentes(tipoEncontro) {
    const j = this.estadoJogo.jogador;
    const jogadorUnidade = {
      id: 'jogador',
      nome: j.nome,
      lado: 'jogador',
      x: 2,
      y: 5,
      hpAtual: j.hpAtual,
      hpMax: j.hpMax,
      energiaAtual: j.energiaAtual,
      energiaMax: j.energiaMax,
      defesa: j.defesa,
      movimentoMax: j.movimento,
      movimentoRestante: j.movimento,
      acaoDisponivel: true,
      usuarioAkuma: Boolean(j.akumaNoMi),
      akumaNoMi: j.akumaNoMi,
      haki: j.haki || [],
      habilidades: j.habilidades || [],
      atributos: j.atributos,
      aparencia: j.aparencia,
      racaId: j.raca.id,
      modoZoan: false,
      esquivaGarantida: false,
      armamentoAtivo: false
    };

    const inimigos = this.criarInimigos(tipoEncontro);
    this.unidades = [jogadorUnidade, ...inimigos];
  }

  criarInimigos(tipoEncontro) {
    const ehPirata = this.estadoJogo.jogador.faccao === 'pirata';
    const tituloChefe = ehPirata ? 'Capitão da Marinha' : 'Capitão Pirata';
    const tituloSoldado = ehPirata ? 'Fuzileiro Naval' : 'Marujo Pirata';
    const corUniforme = ehPirata ? '#f8fafc' : '#991b1b';
    const acessorioInimigo = ehPirata ? 'bone_marinha' : 'bandana';

    const lista = [
      {
        id: 'inimigo_chefe',
        nome: tituloChefe,
        lado: 'inimigo',
        x: 7,
        y: 4,
        hpAtual: 34,
        hpMax: 34,
        defesa: 12,
        movimentoMax: 5,
        movimentoRestante: 5,
        acaoDisponivel: true,
        usuarioAkuma: tipoEncontro === 'abordagem_naval', // Chefe naval tem Akuma no Mi (vulnerável à água!)
        danoBase: 7,
        aparencia: { corPele: '#e0ac69', corCabelo: '#0f172a', corRoupa: corUniforme, corCalca: '#1e293b', acessorio: acessorioInimigo },
        racaId: 'humano',
        modoZoan: false
      },
      {
        id: 'inimigo_soldado_1',
        nome: `${tituloSoldado} A`,
        lado: 'inimigo',
        x: 7,
        y: 6,
        hpAtual: 20,
        hpMax: 20,
        defesa: 10,
        movimentoMax: 5,
        movimentoRestante: 5,
        acaoDisponivel: true,
        usuarioAkuma: false,
        danoBase: 5,
        aparencia: { corPele: '#f1c27d', corCabelo: '#334155', corRoupa: corUniforme, corCalca: '#334155', acessorio: acessorioInimigo },
        racaId: 'humano',
        modoZoan: false
      }
    ];

    return lista;
  }

  obterJogador() {
    return this.unidades.find(u => u.id === 'jogador');
  }

  obterUnidadeEm(x, y) {
    return this.unidades.find(u => u.hpAtual > 0 && u.x === x && u.y === y) || null;
  }

  selecionarAcao(tipo, dados = null) {
    if (this.turnoAtual !== 'jogador' || this.animando) return;
    this.acaoSelecionada = { tipo, dados };
    this.renderizarCena();
  }

  calcularCelulasValidas() {
    const jogador = this.obterJogador();
    if (!jogador || !this.acaoSelecionada) return [];

    const validas = [];
    const { tipo, dados } = this.acaoSelecionada;

    if (tipo === 'mover') {
      const alcance = jogador.movimentoRestante;
      for (let y = 0; y < this.tamanhoGrid; y++) {
        for (let x = 0; x < this.tamanhoGrid; x++) {
          const dist = Math.abs(x - jogador.x) + Math.abs(y - jogador.y);
          if (dist > 0 && dist <= alcance && !this.obterUnidadeEm(x, y)) {
            const terreno = this.grid[y][x];
            if (terreno !== TERRENOS_COMBATE.OBSTACULO) {
              // Usuário de Akuma no Mi não entra voluntariamente na água
              if (terreno === TERRENOS_COMBATE.AGUA && jogador.usuarioAkuma) continue;
              validas.push({ x, y });
            }
          }
        }
      }
    } else if ((tipo === 'atacar' || tipo === 'poder') && jogador.acaoDisponivel) {
      const alcance = dados ? (dados.alcance ?? 1) : 1;
      for (let y = 0; y < this.tamanhoGrid; y++) {
        for (let x = 0; x < this.tamanhoGrid; x++) {
          const dist = Math.abs(x - jogador.x) + Math.abs(y - jogador.y);
          if (alcance === 0 && x === jogador.x && y === jogador.y) {
            validas.push({ x, y });
          } else if (dist > 0 && dist <= alcance) {
            validas.push({ x, y });
          }
        }
      }
    }
    return validas;
  }

  async lidarCliqueGrid(gx, gy) {
    if (this.turnoAtual !== 'jogador' || this.animando || !this.acaoSelecionada) return;

    const jogador = this.obterJogador();
    const validas = this.calcularCelulasValidas();
    const ehValida = validas.some(c => c.x === gx && c.y === gy);
    if (!ehValida) return;

    const { tipo, dados } = this.acaoSelecionada;

    if (tipo === 'mover') {
      const dist = Math.abs(gx - jogador.x) + Math.abs(gy - jogador.y);
      jogador.x = gx;
      jogador.y = gy;
      jogador.movimentoRestante -= dist;
      this.callbacks.onLog(`${jogador.nome} moveu-se para (${gx}, ${gy}).`);
      this.renderizarCena();
    } else if (tipo === 'atacar') {
      const alvo = this.obterUnidadeEm(gx, gy);
      if (!alvo || alvo.lado === 'jogador') {
        this.callbacks.onLog('Selecione um inimigo válido dentro do alcance!');
        return;
      }
      await this.executarAtaqueBasico(jogador, alvo);
    } else if (tipo === 'poder') {
      await this.executarPoder(jogador, dados, gx, gy);
    }
  }

  async executarAtaqueBasico(atacante, alvo) {
    this.animando = true;
    const modForca = Math.floor(((atacante.atributos?.forca || 12) - 10) / 2);
    const bonusArmamento = atacante.armamentoAtivo ? 6 : 0;
    const dano = Math.max(3, Math.floor(Math.random() * 6) + 4 + modForca + bonusArmamento);

    await this.renderizador.animarVFX({
      tipo: 'projetil',
      origem: { x: atacante.x, y: atacante.y },
      destino: { x: alvo.x, y: alvo.y },
      cores: atacante.armamentoAtivo ? ['#1e1b4b', '#ec4899', '#000000'] : ['#f8fafc', '#94a3b8'],
      onRenderBase: () => this.renderizarCena()
    });

    this.aplicarDanoEVerificarMorte(alvo, dano, `${atacante.nome} golpeou ${alvo.nome} causando ${dano} de dano!`);
    atacante.acaoDisponivel = false;
    this.animando = false;
    this.renderizarCena();
    this.verificarFimDeBatalha();
  }

  async executarPoder(usuario, poder, alvoX, alvoY) {
    const custo = poder.custo_energia || poder.cost || 10;
    if (usuario.energiaAtual < custo) {
      this.callbacks.onLog(`Energia insuficiente para ${poder.nome} (requer ${custo}).`);
      return;
    }

    this.animando = true;
    usuario.energiaAtual -= custo;
    usuario.acaoDisponivel = false;

    const efeitoVisual = poder.efeito_visual || 'particulas_area';
    const cores = poder.paleta_cores || ['#f59e0b', '#ef4444', '#ffffff'];

    // 1. Efeito Transformação (Zoan ou Haki da Observação)
    if (efeitoVisual === 'transformacao') {
      if (poder.categoria === 'Zoan') {
        usuario.modoZoan = !usuario.modoZoan;
        usuario.movimentoRestante += 2;
        if (poder.id === 'tori_tori_fenix') {
          usuario.hpAtual = Math.min(usuario.hpMax, usuario.hpAtual + 15);
          this.callbacks.onLog(`🔥 Chamas azuis da Fênix regeneram +15 HP de ${usuario.nome}!`);
        }
        if (poder.id === 'ryu_ryu_alossauro') {
          usuario.hpMax += 15;
          usuario.hpAtual += 15;
        }
      } else if (poder.id === 'haki_observacao') {
        usuario.esquivaGarantida = true;
        this.callbacks.onLog(`👁️ ${usuario.nome} ativou Haki da Observação! O próximo ataque inimigo será esquivado.`);
      }
    }

    // 2. Efeito de Alteração de Terreno (Hie Hie, Moku Moku, Ope Ope)
    if (efeitoVisual === 'terreno') {
      const novoTerreno =
        poder.id === 'hie_hie'
          ? TERRENOS_COMBATE.GELO
          : poder.id === 'ope_ope'
          ? TERRENOS_COMBATE.SALA_OPE
          : TERRENOS_COMBATE.FUMAÇA;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const tx = alvoX + dx;
          const ty = alvoY + dy;
          if (tx >= 0 && tx < this.tamanhoGrid && ty >= 0 && ty < this.tamanhoGrid) {
            if (this.grid[ty][tx] !== TERRENOS_COMBATE.OBSTACULO) {
              this.grid[ty][tx] = novoTerreno;
            }
          }
        }
      }
      this.callbacks.onLog(`❄️ O terreno ao redor de (${alvoX}, ${alvoY}) foi alterado por ${poder.nome}!`);
    }

    // 3. Haki do Armamento buff
    if (poder.id === 'haki_armamento') {
      usuario.armamentoAtivo = true;
      usuario.defesa += 2;
      this.callbacks.onLog(`🖤 Punhos revestidos com Haki do Armamento (+2 Defesa e +6 Dano)!`);
    }

    // Executa animação procedural no Canvas (com Screen Shake e Hitstop)
    await this.renderizador.animarVFX({
      tipo: efeitoVisual,
      origem: { x: usuario.x, y: usuario.y },
      destino: { x: alvoX, y: alvoY },
      cores,
      onRenderBase: () => this.renderizarCena()
    });

    // Calcula alvos afetados pelo padrão de área
    const alvosAfetados = this.obterAlvosNaArea(usuario, alvoX, alvoY, poder.padrao_area || 'alvo_unico');
    const danoBase = poder.dano_base || 14;
    const empurrao = poder.empurrao || 0;

    if (alvosAfetados.length === 0 && danoBase > 0 && poder.alcance > 0) {
      this.callbacks.onLog(`${usuario.nome} usou ${poder.nome}, mas nenhum inimigo estava na área!`);
    }

    for (const inimigo of alvosAfetados) {
      this.aplicarDanoEVerificarMorte(
        inimigo,
        danoBase,
        `💥 ${poder.nome} atingiu ${inimigo.nome} causando ${danoBase} de dano!`
      );

      if (empurrao > 0 && inimigo.hpAtual > 0) {
        this.aplicarEmpurrao(usuario, inimigo, empurrao);
      }
    }

    this.animando = false;
    this.renderizarCena();
    this.verificarFimDeBatalha();
  }

  obterAlvosNaArea(origem, alvoX, alvoY, padrao) {
    const inimigosVivos = this.unidades.filter(u => u.lado === 'inimigo' && u.hpAtual > 0);

    if (padrao === 'ao_redor') {
      return inimigosVivos.filter(u => Math.abs(u.x - alvoX) <= 1 && Math.abs(u.y - alvoY) <= 1);
    }
    if (padrao === 'cone') {
      return inimigosVivos.filter(u => Math.abs(u.x - alvoX) <= 1 && Math.abs(u.y - alvoY) <= 1);
    }
    if (padrao === 'linha') {
      const dx = Math.sign(alvoX - origem.x);
      const dy = Math.sign(alvoY - origem.y);
      const pontosLinha = [];
      for (let i = 1; i <= 5; i++) {
        pontosLinha.push({ x: origem.x + dx * i, y: origem.y + dy * i });
      }
      return inimigosVivos.filter(u => pontosLinha.some(p => p.x === u.x && p.y === u.y));
    }

    // alvo_unico
    const unico = this.obterUnidadeEm(alvoX, alvoY);
    return unico && unico.lado === 'inimigo' ? [unico] : [];
  }

  aplicarEmpurrao(origem, alvo, distancia) {
    const dx = Math.sign(alvo.x - origem.x) || 1;
    const dy = Math.sign(alvo.y - origem.y);

    for (let passo = 0; passo < distancia; passo++) {
      const proxX = alvo.x + dx;
      const proxY = alvo.y + dy;

      // Bateu na borda ou obstáculo
      if (
        proxX < 0 || proxX >= this.tamanhoGrid ||
        proxY < 0 || proxY >= this.tamanhoGrid ||
        this.grid[proxY][proxX] === TERRENOS_COMBATE.OBSTACULO ||
        this.obterUnidadeEm(proxX, proxY)
      ) {
        this.aplicarDanoEVerificarMorte(alvo, 5, `🧱 ${alvo.nome} colidiu com um obstáculo (+5 dano de impacto)!`);
        break;
      }

      alvo.x = proxX;
      alvo.y = proxY;

      // Verifica queda na ÁGUA PROFUNDA
      if (this.grid[proxY][proxX] === TERRENOS_COMBATE.AGUA) {
        if (alvo.usuarioAkuma) {
          alvo.hpAtual = 0;
          this.callbacks.onLog(`🌊 MALDIÇÃO DO MAR! ${alvo.nome} (usuário de Akuma no Mi) caiu na água e afundou instantaneamente!`);
        } else {
          this.callbacks.onLog(`🌊 ${alvo.nome} foi arremessado na água, mas sabe nadar!`);
        }
        break;
      }
    }
  }

  aplicarDanoEVerificarMorte(alvo, dano, mensagem) {
    alvo.hpAtual = Math.max(0, alvo.hpAtual - dano);
    this.callbacks.onLog(mensagem);
    if (alvo.hpAtual === 0) {
      this.callbacks.onLog(`☠️ ${alvo.nome} foi derrotado!`);
    }
  }

  async encerrarTurnoJogador() {
    if (this.turnoAtual !== 'jogador' || this.animando) return;
    this.turnoAtual = 'inimigo';
    this.acaoSelecionada = null;
    this.renderizarCena();

    await this.executarTurnoInimigos();
  }

  async executarTurnoInimigos() {
    const jogador = this.obterJogador();
    const inimigosVivos = this.unidades.filter(u => u.lado === 'inimigo' && u.hpAtual > 0);

    for (const inimigo of inimigosVivos) {
      if (jogador.hpAtual <= 0) break;

      await new Promise(r => setTimeout(r, 400));

      // Move em direção ao jogador
      let passos = inimigo.movimentoMax;
      while (passos > 0 && Math.abs(inimigo.x - jogador.x) + Math.abs(inimigo.y - jogador.y) > 1) {
        const dx = Math.sign(jogador.x - inimigo.x);
        const dy = Math.sign(jogador.y - inimigo.y);
        const candidatos = [
          { x: inimigo.x + dx, y: inimigo.y },
          { x: inimigo.x, y: inimigo.y + dy }
        ];

        const livre = candidatos.find(
          c =>
            c.x >= 0 && c.x < this.tamanhoGrid &&
            c.y >= 0 && c.y < this.tamanhoGrid &&
            this.grid[c.y][c.x] !== TERRENOS_COMBATE.OBSTACULO &&
            !(this.grid[c.y][c.x] === TERRENOS_COMBATE.AGUA && inimigo.usuarioAkuma) &&
            !this.obterUnidadeEm(c.x, c.y)
        );

        if (!livre) break;
        inimigo.x = livre.x;
        inimigo.y = livre.y;
        passos--;
        this.renderizarCena();
      }

      // Se estiver adjacente, ataca o jogador
      const distFinal = Math.abs(inimigo.x - jogador.x) + Math.abs(inimigo.y - jogador.y);
      if (distFinal <= 1) {
        if (jogador.esquivaGarantida) {
          jogador.esquivaGarantida = false;
          this.callbacks.onLog(`👁️ HAKI DA OBSERVAÇÃO! ${jogador.nome} previu e esquivou completamente do ataque de ${inimigo.nome}!`);
        } else {
          await this.renderizador.animarVFX({
            tipo: 'projetil',
            origem: { x: inimigo.x, y: inimigo.y },
            destino: { x: jogador.x, y: jogador.y },
            cores: ['#ef4444', '#fca5a5'],
            onRenderBase: () => this.renderizarCena()
          });
          const dano = Math.max(2, inimigo.danoBase - (jogador.armamentoAtivo ? 2 : 0));
          this.aplicarDanoEVerificarMorte(jogador, dano, `💢 ${inimigo.nome} atacou ${jogador.nome} (-${dano} HP)!`);
        }
      }
    }

    if (!this.verificarFimDeBatalha()) {
      jogador.movimentoRestante = jogador.movimentoMax;
      jogador.acaoDisponivel = true;
      this.turnoAtual = 'jogador';
      this.acaoSelecionada = { tipo: 'mover', dados: null };
      this.callbacks.onLog('🔵 Seu turno começou!');
      this.renderizarCena();
    }
  }

  verificarFimDeBatalha() {
    const jogador = this.obterJogador();
    const inimigosVivos = this.unidades.filter(u => u.lado === 'inimigo' && u.hpAtual > 0);

    if (jogador.hpAtual <= 0) {
      this.callbacks.onFimCombate(false);
      return true;
    }

    if (inimigosVivos.length === 0) {
      // Sincroniza HP e Energia restantes com a ficha global
      this.estadoJogo.jogador.hpAtual = jogador.hpAtual;
      this.estadoJogo.jogador.energiaAtual = jogador.energiaAtual;
      this.estadoJogo.jogador.xp += 80;
      this.estadoJogo.jogador.berries += 1500;
      this.callbacks.onFimCombate(true);
      return true;
    }
    return false;
  }

  renderizarCena() {
    const validas = this.turnoAtual === 'jogador' ? this.calcularCelulasValidas() : [];
    this.renderizador.desenharCombateTatico(
      this.grid,
      this.unidades,
      validas,
      this.acaoSelecionada?.tipo || 'mover'
    );
  }
}
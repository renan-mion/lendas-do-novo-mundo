export const TIPOS_TILE = {
  AGUA_PROFUNDA: 0,
  AREIA: 1,
  GRAMA: 2,
  PEDRA: 3,
  TAVERNA: 4,
  PORTO: 5,
  DOJO: 6,
  BASE_MARINHA: 7,
  MAR_ABERTO: 8,
  ILHA_OCEANO: 9,
  NAUFRAGIO: 10,
  REDEMOINHO: 11,
  NAVIO_INIMIGO: 12
};

export const INFO_TILES = {
  [TIPOS_TILE.AGUA_PROFUNDA]: { nome: 'Água Profunda', caminhavel: false, navegavel: true, corBase: '#1d4ed8', corDetalhe: '#3b82f6' },
  [TIPOS_TILE.AREIA]: { nome: 'Praia', caminhavel: true, navegavel: false, corBase: '#fde047', corDetalhe: '#eab308' },
  [TIPOS_TILE.GRAMA]: { nome: 'Planície Verde', caminhavel: true, navegavel: false, corBase: '#16a34a', corDetalhe: '#15803d' },
  [TIPOS_TILE.PEDRA]: { nome: 'Rocha / Muralha', caminhavel: false, navegavel: false, corBase: '#475569', corDetalhe: '#334155' },
  [TIPOS_TILE.TAVERNA]: { nome: 'Taverna do Barril', caminhavel: true, navegavel: false, corBase: '#92400e', corDetalhe: '#f59e0b' },
  [TIPOS_TILE.PORTO]: { nome: 'Porto da Ilha', caminhavel: true, navegavel: false, corBase: '#78350f', corDetalhe: '#38bdf8' },
  [TIPOS_TILE.DOJO]: { nome: 'Dojo de Treinamento', caminhavel: true, navegavel: false, corBase: '#991b1b', corDetalhe: '#f8fafc' },
  [TIPOS_TILE.BASE_MARINHA]: { nome: 'Base da Marinha', caminhavel: true, navegavel: false, corBase: '#1e3a8a', corDetalhe: '#f8fafc' },
  [TIPOS_TILE.MAR_ABERTO]: { nome: 'Mar Aberto (East Blue)', caminhavel: false, navegavel: true, corBase: '#0369a1', corDetalhe: '#38bdf8' },
  [TIPOS_TILE.ILHA_OCEANO]: { nome: 'Ilha Inexplorada', caminhavel: false, navegavel: true, corBase: '#0369a1', corDetalhe: '#16a34a' },
  [TIPOS_TILE.NAUFRAGIO]: { nome: 'Destroços / Tesouro Flutuante', caminhavel: false, navegavel: true, corBase: '#0369a1', corDetalhe: '#d97706' },
  [TIPOS_TILE.REDEMOINHO]: { nome: 'Correnteza Violenta', caminhavel: false, navegavel: true, corBase: '#0284c7', corDetalhe: '#e0f2fe' },
  [TIPOS_TILE.NAVIO_INIMIGO]: { nome: 'Navio Hostil', caminhavel: false, navegavel: true, corBase: '#0369a1', corDetalhe: '#ef4444' }
};

export class GeradorMapas {
  constructor(largura = 15, altura = 15) {
    this.largura = largura;
    this.altura = altura;
  }

  gerarIlhaOrigem(faccaoJogador = 'pirata', nomeIlhaCustom = null) {
    const matriz = [];
    const centroX = Math.floor(this.largura / 2);
    const centroY = Math.floor(this.altura / 2);

    for (let y = 0; y < this.altura; y++) {
      const linha = [];
      for (let x = 0; x < this.largura; x++) {
        const dist = Math.hypot(x - centroX, y - centroY);
        const ruido = (Math.sin(x * 1.3) + Math.cos(y * 1.3)) * 0.7;
        const raioEfetivo = dist + ruido;

        if (raioEfetivo > 6.2) {
          linha.push(TIPOS_TILE.AGUA_PROFUNDA);
        } else if (raioEfetivo > 4.8) {
          linha.push(TIPOS_TILE.AREIA);
        } else if (raioEfetivo < 4.2 && Math.random() < 0.08 && (x !== centroX || y !== centroY)) {
          linha.push(TIPOS_TILE.PEDRA);
        } else {
          linha.push(TIPOS_TILE.GRAMA);
        }
      }
      matriz.push(linha);
    }

    matriz[centroY][centroX] = TIPOS_TILE.GRAMA;

    const pontos = {
      taverna: { x: centroX - 2, y: centroY - 1, tipo: TIPOS_TILE.TAVERNA },
      dojo: { x: centroX + 2, y: centroY - 1, tipo: TIPOS_TILE.DOJO },
      baseMarinha: { x: centroX, y: centroY - 3, tipo: TIPOS_TILE.BASE_MARINHA },
      porto: { x: centroX, y: centroY + 4, tipo: TIPOS_TILE.PORTO }
    };

    Object.values(pontos).forEach(p => {
      matriz[p.y][p.x] = p.tipo;
    });

    for (let y = centroY + 1; y <= pontos.porto.y; y++) {
      if (matriz[y][centroX] === TIPOS_TILE.AGUA_PROFUNDA || matriz[y][centroX] === TIPOS_TILE.PEDRA) {
        matriz[y][centroX] = TIPOS_TILE.AREIA;
      }
    }

    return {
      nome: nomeIlhaCustom || (faccaoJogador === 'pirata' ? 'Ilha Villa Foosha (East Blue)' : 'Ilha Shells Town (East Blue)'),
      largura: this.largura,
      altura: this.altura,
      matriz,
      posicaoInicial: { x: centroX, y: centroY },
      pontos
    };
  }

  gerarOverworldOceano() {
    const matriz = [];
    const centroX = Math.floor(this.largura / 2);
    const centroY = Math.floor(this.altura / 2);

    for (let y = 0; y < this.altura; y++) {
      const linha = [];
      for (let x = 0; x < this.largura; x++) {
        if (x === centroX && y === centroY) {
          linha.push(TIPOS_TILE.ILHA_OCEANO);
          continue;
        }

        const sorteio = Math.random();
        if (sorteio < 0.05) {
          linha.push(TIPOS_TILE.ILHA_OCEANO);
        } else if (sorteio < 0.11) {
          linha.push(TIPOS_TILE.NAUFRAGIO);
        } else if (sorteio < 0.16) {
          linha.push(TIPOS_TILE.REDEMOINHO);
        } else if (sorteio < 0.22) {
          linha.push(TIPOS_TILE.NAVIO_INIMIGO);
        } else {
          linha.push(TIPOS_TILE.MAR_ABERTO);
        }
      }
      matriz.push(linha);
    }

    return {
      nome: 'Mares do East Blue (Overworld)',
      largura: this.largura,
      altura: this.altura,
      matriz,
      posicaoInicial: { x: centroX, y: centroY }
    };
  }
}
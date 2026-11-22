export const TIPOS_TILE = {
  AGUA_PROFUNDA: 0,
  AREIA: 1,
  GRAMA: 2,
  PEDRA: 3,
  TAVERNA: 4,
  PORTO: 5,
  DOJO: 6,
  BASE_MARINHA: 7
};

export const INFO_TILES = {
  [TIPOS_TILE.AGUA_PROFUNDA]: { nome: 'Água Profunda', caminhavel: false, corBase: '#1d4ed8', corDetalhe: '#3b82f6' },
  [TIPOS_TILE.AREIA]: { nome: 'Praia', caminhavel: true, corBase: '#fde047', corDetalhe: '#eab308' },
  [TIPOS_TILE.GRAMA]: { nome: 'Planície Verde', caminhavel: true, corBase: '#16a34a', corDetalhe: '#15803d' },
  [TIPOS_TILE.PEDRA]: { nome: 'Rocha / Muralha', caminhavel: false, corBase: '#475569', corDetalhe: '#334155' },
  [TIPOS_TILE.TAVERNA]: { nome: 'Taverna do Barril', caminhavel: true, corBase: '#92400e', corDetalhe: '#f59e0b' },
  [TIPOS_TILE.PORTO]: { nome: 'Porto da Ilha', caminhavel: true, corBase: '#78350f', corDetalhe: '#38bdf8' },
  [TIPOS_TILE.DOJO]: { nome: 'Dojo de Treinamento', caminhavel: true, corBase: '#991b1b', corDetalhe: '#f8fafc' },
  [TIPOS_TILE.BASE_MARINHA]: { nome: 'Base da Marinha', caminhavel: true, corBase: '#1e3a8a', corDetalhe: '#f8fafc' }
};

export class GeradorMapas {
  constructor(largura = 15, altura = 15) {
    this.largura = largura;
    this.altura = altura;
  }

  gerarIlhaOrigem(faccaoJogador = 'pirata') {
    const matriz = [];
    const centroX = Math.floor(this.largura / 2);
    const centroY = Math.floor(this.altura / 2);

    // 1. Gera o formato orgânico da ilha (Água -> Areia -> Grama -> Rochas)
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

    // 2. Garante posição inicial livre no centro da ilha
    matriz[centroY][centroX] = TIPOS_TILE.GRAMA;

    // 3. Posiciona os Pontos de Interesse garantindo caminhos livres
    const pontos = {
      taverna: { x: centroX - 2, y: centroY - 1, tipo: TIPOS_TILE.TAVERNA },
      dojo: { x: centroX + 2, y: centroY - 1, tipo: TIPOS_TILE.DOJO },
      baseMarinha: { x: centroX, y: centroY - 3, tipo: TIPOS_TILE.BASE_MARINHA },
      porto: { x: centroX, y: centroY + 4, tipo: TIPOS_TILE.PORTO }
    };

    Object.values(pontos).forEach(p => {
      matriz[p.y][p.x] = p.tipo;
    });

    // Abre uma trilha de areia até o Porto no sul da ilha
    for (let y = centroY + 1; y <= pontos.porto.y; y++) {
      if (matriz[y][centroX] === TIPOS_TILE.AGUA_PROFUNDA || matriz[y][centroX] === TIPOS_TILE.PEDRA) {
        matriz[y][centroX] = TIPOS_TILE.AREIA;
      }
    }

    return {
      nome: faccaoJogador === 'pirata' ? 'Ilha Villa Foosha (East Blue)' : 'Ilha Shells Town (East Blue)',
      largura: this.largura,
      altura: this.altura,
      matriz,
      posicaoInicial: { x: centroX, y: centroY },
      pontos
    };
  }
}
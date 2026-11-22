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
  NAVIO_INIMIGO: 12,
  RED_LINE: 13,
  CALM_BELT: 14,
  REVERSE_MOUNTAIN: 15
};

export const PALETAS_BIOMA = {
  tropical: {
    nome: 'Tropical / Planície',
    agua: '#1d4ed8',
    borda: '#fde047',
    solo: '#16a34a',
    detalheSolo: '#15803d',
    obstaculo: '#475569'
  },
  inverno: {
    nome: 'Ilha de Inverno (Neve)',
    agua: '#1e40af',
    borda: '#cbd5e1',
    solo: '#f1f5f9',
    detalheSolo: '#94a3b8',
    obstaculo: '#38bdf8'
  },
  deserto: {
    nome: 'Reino Desértico (Dunas)',
    agua: '#0284c7',
    borda: '#f59e0b',
    solo: '#fbbf24',
    detalheSolo: '#d97706',
    obstaculo: '#92400e'
  },
  vulcanico: {
    nome: 'Vulcânico / Cinzas',
    agua: '#1e3a8a',
    borda: '#44403c',
    solo: '#292524',
    detalheSolo: '#ef4444',
    obstaculo: '#ea580c'
  },
  sombrio: {
    nome: 'Floresta Sombria / Névoa',
    agua: '#172554',
    borda: '#4c1d95',
    solo: '#312e81',
    detalheSolo: '#6d28d9',
    obstaculo: '#1e1b4b'
  },
  outonal: {
    nome: 'Terras Outonais / Cerejeiras',
    agua: '#1d4ed8',
    borda: '#fed7aa',
    solo: '#ea580c',
    detalheSolo: '#f472b6',
    obstaculo: '#7c2d12'
  },
  ceu: {
    nome: 'Ilha do Céu (Mar Branco)',
    agua: '#e0f2fe',
    borda: '#bae6fd',
    solo: '#f8fafc',
    detalheSolo: '#fde047',
    obstaculo: '#94a3b8'
  }
};

export const INFO_TILES = {
  [TIPOS_TILE.AGUA_PROFUNDA]: { nome: 'Água Profunda', caminhavel: false, navegavel: true, corBase: '#1d4ed8', corDetalhe: '#3b82f6' },
  [TIPOS_TILE.AREIA]: { nome: 'Costa / Margem', caminhavel: true, navegavel: false, corBase: '#fde047', corDetalhe: '#eab308' },
  [TIPOS_TILE.GRAMA]: { nome: 'Terreno da Ilha', caminhavel: true, navegavel: false, corBase: '#16a34a', corDetalhe: '#15803d' },
  [TIPOS_TILE.PEDRA]: { nome: 'Formação Rochosa', caminhavel: false, navegavel: false, corBase: '#475569', corDetalhe: '#334155' },
  [TIPOS_TILE.TAVERNA]: { nome: 'Taverna Local', caminhavel: true, navegavel: false, corBase: '#92400e', corDetalhe: '#f59e0b' },
  [TIPOS_TILE.PORTO]: { nome: 'Porto de Embarque', caminhavel: true, navegavel: false, corBase: '#78350f', corDetalhe: '#38bdf8' },
  [TIPOS_TILE.DOJO]: { nome: 'Dojo de Treinamento', caminhavel: true, navegavel: false, corBase: '#991b1b', corDetalhe: '#f8fafc' },
  [TIPOS_TILE.BASE_MARINHA]: { nome: 'Base da Marinha', caminhavel: true, navegavel: false, corBase: '#1e3a8a', corDetalhe: '#f8fafc' },
  [TIPOS_TILE.MAR_ABERTO]: { nome: 'Mar Aberto', caminhavel: false, navegavel: true, corBase: '#0369a1', corDetalhe: '#38bdf8' },
  [TIPOS_TILE.ILHA_OCEANO]: { nome: 'Ilha Mapeada', caminhavel: false, navegavel: true, corBase: '#0369a1', corDetalhe: '#16a34a' },
  [TIPOS_TILE.NAUFRAGIO]: { nome: 'Destroços / Tesouro', caminhavel: false, navegavel: true, corBase: '#0369a1', corDetalhe: '#d97706' },
  [TIPOS_TILE.REDEMOINHO]: { nome: 'Correnteza Violenta', caminhavel: false, navegavel: true, corBase: '#0284c7', corDetalhe: '#e0f2fe' },
  [TIPOS_TILE.NAVIO_INIMIGO]: { nome: 'Navio Hostil', caminhavel: false, navegavel: true, corBase: '#0369a1', corDetalhe: '#ef4444' },
  [TIPOS_TILE.RED_LINE]: { nome: 'Red Line (Continente Intransponível)', caminhavel: false, navegavel: false, corBase: '#991b1b', corDetalhe: '#7f1d1d' },
  [TIPOS_TILE.CALM_BELT]: { nome: 'Calm Belt (Ninho de Reis dos Mares)', caminhavel: false, navegavel: true, corBase: '#38bdf8', corDetalhe: '#bae6fd' },
  [TIPOS_TILE.REVERSE_MOUNTAIN]: { nome: 'Reverse Mountain (Entrada da Grand Line)', caminhavel: false, navegavel: true, corBase: '#b45309', corDetalhe: '#38bdf8' }
};

export class GeradorMapas {
  constructor() {
    this.larguraIlha = 28;
    this.alturaIlha = 28;
    this.larguraMundo = 42;
    this.alturaMundo = 26;
  }

  gerarIlha(ilhaConfig) {
    const largura = this.larguraIlha;
    const altura = this.alturaIlha;
    const matriz = [];
    const centroX = Math.floor(largura / 2);
    const centroY = Math.floor(altura / 2);
    const bioma = ilhaConfig?.bioma || 'tropical';

    // Semente determinística baseada no nome da ilha para manter geografia consistente
    const semente = (ilhaConfig?.nome || 'ilha')
      .split('')
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

    for (let y = 0; y < altura; y++) {
      const linha = [];
      for (let x = 0; x < largura; x++) {
        const dist = Math.hypot(x - centroX, y - centroY);
        const ruido = (Math.sin((x + semente) * 0.65) + Math.cos((y + semente) * 0.65)) * 1.4;
        const raioEfetivo = dist + ruido;

        if (raioEfetivo > 11.5) {
          linha.push(TIPOS_TILE.AGUA_PROFUNDA);
        } else if (raioEfetivo > 9.5) {
          linha.push(TIPOS_TILE.AREIA);
        } else if (raioEfetivo < 8.5 && Math.sin(x * 3.1 + y * 1.7 + semente) > 0.84 && dist > 2) {
          linha.push(TIPOS_TILE.PEDRA);
        } else {
          linha.push(TIPOS_TILE.GRAMA);
        }
      }
      matriz.push(linha);
    }

    matriz[centroY][centroX] = TIPOS_TILE.GRAMA;

    // Pontos de Interesse espalhados pelo mapa 28x28
    const pontos = {
      taverna: { x: centroX - 4, y: centroY - 2, tipo: TIPOS_TILE.TAVERNA },
      dojo: { x: centroX + 4, y: centroY - 2, tipo: TIPOS_TILE.DOJO },
      baseMarinha: { x: centroX, y: centroY - 6, tipo: TIPOS_TILE.BASE_MARINHA },
      porto: { x: centroX, y: centroY + 8, tipo: TIPOS_TILE.PORTO }
    };

    Object.values(pontos).forEach(p => {
      matriz[p.y][p.x] = p.tipo;
    });

    // Estradas de terra/areia conectando o centro aos pontos principais
    for (let y = centroY - 6; y <= centroY + 8; y++) {
      if (matriz[y][centroX] === TIPOS_TILE.PEDRA || matriz[y][centroX] === TIPOS_TILE.AGUA_PROFUNDA) {
        matriz[y][centroX] = TIPOS_TILE.AREIA;
      }
    }
    for (let x = centroX - 4; x <= centroX + 4; x++) {
      if (matriz[centroY - 2][x] === TIPOS_TILE.PEDRA) {
        matriz[centroY - 2][x] = TIPOS_TILE.AREIA;
      }
    }

    return {
      id: ilhaConfig?.id || 'ilha_origem',
      nome: ilhaConfig?.nome || 'Vila Foosha (East Blue)',
      mar: ilhaConfig?.mar || 'east_blue',
      bioma,
      nivelRecomendado: ilhaConfig?.nivel_recomendado || 1,
      largura,
      altura,
      matriz,
      posicaoInicial: { x: centroX, y: centroY },
      pontos
    };
  }

  gerarMapaMundi(dadosMundo) {
    const largura = this.larguraMundo; // 42
    const altura = this.alturaMundo;   // 26
    const matriz = [];

    // Estrutura fiel ao mapa oficial de One Piece:
    // Colunas 0..1 e 40..41: Red Line (borda externa)
    // Colunas 20..21: Red Line Central (divide North/West de East/South)
    // Linhas 10 e 14: Calm Belt (faixas que isolam a Grand Line)
    // Linhas 11..13: Grand Line (Colunas 22..39 = Paradise | Colunas 2..19 = Novo Mundo)
    // Centro (x: 20..21, y: 12): Reverse Mountain!

    for (let y = 0; y < altura; y++) {
      const linha = [];
      for (let x = 0; x < largura; x++) {
        // Red Line externa e central
        if (x <= 1 || x >= largura - 2 || x === 20 || x === 21) {
          if ((x === 20 || x === 21) && y === 12) {
            linha.push(TIPOS_TILE.REVERSE_MOUNTAIN);
          } else {
            linha.push(TIPOS_TILE.RED_LINE);
          }
          continue;
        }

        // Calm Belt norte e sul da Grand Line
        if (y === 10 || y === 14) {
          linha.push(TIPOS_TILE.CALM_BELT);
          continue;
        }

        // Eventos dinâmicos no oceano
        const sorteio = Math.random();
        if (sorteio < 0.04) {
          linha.push(TIPOS_TILE.NAUFRAGIO);
        } else if (sorteio < 0.07) {
          linha.push(TIPOS_TILE.REDEMOINHO);
        } else if (sorteio < 0.12) {
          linha.push(TIPOS_TILE.NAVIO_INIMIGO);
        } else {
          linha.push(TIPOS_TILE.MAR_ABERTO);
        }
      }
      matriz.push(linha);
    }

    // Abre canais de acesso dos 4 Blues até a Reverse Mountain (x: 20, y: 12)
    matriz[11][19] = TIPOS_TILE.REVERSE_MOUNTAIN; // Entrada North Blue
    matriz[13][19] = TIPOS_TILE.REVERSE_MOUNTAIN; // Entrada West Blue
    matriz[11][22] = TIPOS_TILE.REVERSE_MOUNTAIN; // Entrada East Blue
    matriz[13][22] = TIPOS_TILE.REVERSE_MOUNTAIN; // Entrada South Blue

    // Posiciona todas as ilhas oficiais do catálogo
    const mapaIlhasPorCoord = {};
    dadosMundo.ilhas.forEach(ilha => {
      if (matriz[ilha.y] && matriz[ilha.y][ilha.x] !== undefined) {
        matriz[ilha.y][ilha.x] = TIPOS_TILE.ILHA_OCEANO;
        mapaIlhasPorCoord[`${ilha.x},${ilha.y}`] = ilha;
      }
    });

    return {
      nome: 'Mapa-Múndi de One Piece',
      largura,
      altura,
      matriz,
      ilhasPorCoord: mapaIlhasPorCoord
    };
  }
}
import { TIPOS_TILE, INFO_TILES } from './gerador_mapas.js';

export class RenderizadorCanvas {
  constructor(canvas, configSprites) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.configSprites = configSprites;
    this.ctx.imageSmoothingEnabled = false;
  }

  limpar(corFundo = '#0f172a') {
    this.ctx.fillStyle = corFundo;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  desenharGradeFundo(tamanhoCelula = 32) {
    this.ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x <= this.canvas.width; x += tamanhoCelula) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y <= this.canvas.height; y += tamanhoCelula) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }

  desenharMapaIlha(mapa, jogadorPos, jogador) {
    const tamanhoTile = 32;
    this.limpar('#0c4a6e');

    for (let y = 0; y < mapa.altura; y++) {
      for (let x = 0; x < mapa.largura; x++) {
        const tipo = mapa.matriz[y][x];
        this.desenharTile32(x * tamanhoTile, y * tamanhoTile, tipo, x, y);
      }
    }

    // Desenha o jogador na posição atual da ilha
    this.desenharPersonagem(
      jogadorPos.x * tamanhoTile,
      jogadorPos.y * tamanhoTile,
      jogador.aparencia,
      jogador.raca.id,
      1,
      false,
      null
    );
  }

  desenharTile32(px, py, tipo, gx, gy) {
    const info = INFO_TILES[tipo];
    this.ctx.fillStyle = info.corBase;
    this.ctx.fillRect(px, py, 32, 32);

    // Detalhes Pixel Art procedurais por tipo de terreno
    this.ctx.fillStyle = info.corDetalhe;

    if (tipo === TIPOS_TILE.AGUA_PROFUNDA) {
      const onda = (gx + gy) % 2 === 0 ? 6 : 18;
      this.ctx.fillRect(px + onda, py + 10, 10, 2);
      this.ctx.fillRect(px + 4, py + 22, 12, 2);
    } else if (tipo === TIPOS_TILE.AREIA) {
      this.ctx.fillRect(px + 8, py + 8, 2, 2);
      this.ctx.fillRect(px + 22, py + 18, 2, 2);
      this.ctx.fillRect(px + 14, py + 26, 2, 2);
    } else if (tipo === TIPOS_TILE.GRAMA) {
      this.ctx.fillRect(px + 6, py + 10, 2, 4);
      this.ctx.fillRect(px + 20, py + 6, 2, 4);
      this.ctx.fillRect(px + 14, py + 22, 2, 4);
    } else if (tipo === TIPOS_TILE.PEDRA) {
      this.ctx.fillRect(px + 4, py + 4, 24, 24);
      this.ctx.fillStyle = '#64748b';
      this.ctx.fillRect(px + 6, py + 6, 10, 8);
    } else if (tipo === TIPOS_TILE.TAVERNA) {
      // Telhado e placa dourada de caneca
      this.ctx.fillStyle = '#451a03';
      this.ctx.fillRect(px + 2, py + 2, 28, 28);
      this.ctx.fillStyle = '#b45309';
      this.ctx.fillRect(px + 4, py + 4, 24, 14);
      this.ctx.fillStyle = '#facc15';
      this.ctx.fillRect(px + 12, py + 20, 8, 8);
    } else if (tipo === TIPOS_TILE.PORTO) {
      // Píer de madeira sobre a água
      this.ctx.fillStyle = '#0284c7';
      this.ctx.fillRect(px, py + 16, 32, 16);
      this.ctx.fillStyle = '#92400e';
      this.ctx.fillRect(px + 8, py, 16, 28);
      this.ctx.fillStyle = '#f8fafc';
      this.ctx.fillRect(px + 14, py + 6, 4, 12);
    } else if (tipo === TIPOS_TILE.DOJO) {
      // Telhado estilo oriental
      this.ctx.fillStyle = '#7f1d1d';
      this.ctx.fillRect(px + 2, py + 4, 28, 24);
      this.ctx.fillStyle = '#f8fafc';
      this.ctx.fillRect(px + 8, py + 14, 16, 14);
      this.ctx.fillStyle = '#dc2626';
      this.ctx.fillRect(px + 14, py + 18, 4, 10);
    } else if (tipo === TIPOS_TILE.BASE_MARINHA) {
      // Fortaleza branca com faixa azul
      this.ctx.fillStyle = '#f8fafc';
      this.ctx.fillRect(px + 3, py + 3, 26, 26);
      this.ctx.fillStyle = '#1d4ed8';
      this.ctx.fillRect(px + 3, py + 12, 26, 6);
      this.ctx.fillStyle = '#0f172a';
      this.ctx.fillRect(px + 13, py + 20, 6, 9);
    }

    // Borda sutil do tile
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    this.ctx.strokeRect(px, py, 32, 32);
  }

  desenharPersonagem(x, y, aparencia, racaId = 'humano', escalaExtra = 1, modoZoan = false, paletaZoan = null) {
    const escala = this.configSprites.escala_pixel * escalaExtra;
    const mapaCores = {
      'P': aparencia.corPele || '#f1c27d',
      'C': aparencia.corCabelo || '#1e293b',
      'R': aparencia.corRoupa || '#dc2626',
      'B': aparencia.corCalca || '#1d4ed8',
      'E': '#0f172a',
      'S': '#334155',
      'Y': '#facc15',
      'W': '#f8fafc',
      'D': '#991b1b',
      'Z': (paletaZoan && paletaZoan[0]) || '#d97706'
    };

    const matriz = modoZoan ? this.configSprites.matriz_zoan : this.configSprites.matriz_humanoide;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    this.ctx.fillRect(x + 3 * escala, y + 14 * escala, 10 * escala, 2 * escala);

    this.desenharMatriz(matriz, x, y, escala, mapaCores);

    if (!modoZoan && this.configSprites.detalhes_raciais[racaId]) {
      for (const pixel of this.configSprites.detalhes_raciais[racaId]) {
        this.ctx.fillStyle = pixel.cor;
        this.ctx.fillRect(x + pixel.x * escala, y + pixel.y * escala, escala, escala);
      }
    }

    if (!modoZoan && aparencia.acessorio && this.configSprites.acessorios[aparencia.acessorio]) {
      this.desenharMatriz(this.configSprites.acessorios[aparencia.acessorio], x, y, escala, mapaCores);
    }
  }

  desenharMatriz(matriz, offsetX, offsetY, escala, mapaCores) {
    for (let linha = 0; linha < matriz.length; linha++) {
      for (let coluna = 0; coluna < matriz[linha].length; coluna++) {
        const codigo = matriz[linha][coluna];
        if (codigo !== '.' && mapaCores[codigo]) {
          this.ctx.fillStyle = mapaCores[codigo];
          this.ctx.fillRect(
            offsetX + coluna * escala,
            offsetY + linha * escala,
            escala,
            escala
          );
        }
      }
    }
  }
}
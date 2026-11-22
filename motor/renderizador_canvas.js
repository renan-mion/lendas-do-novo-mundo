import { TIPOS_TILE, INFO_TILES, PALETAS_BIOMA } from './gerador_mapas.js';
import { TERRENOS_COMBATE } from './motor_combate.js';

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

  // Câmera centrada no jogador para mapas grandes (exibe janela 15x15 de tiles 32x32)
  calcularCamera(alvoPos, larguraMapa, alturaMapa, tilesVisiveis = 15) {
    const metade = Math.floor(tilesVisiveis / 2);
    const camX = Math.max(0, Math.min(larguraMapa - tilesVisiveis, alvoPos.x - metade));
    const camY = Math.max(0, Math.min(alturaMapa - tilesVisiveis, alvoPos.y - metade));
    return { camX, camY, tilesVisiveis };
  }

  desenharMapaIlha(mapa, jogadorPos, jogador) {
    const tamanhoTile = 32;
    const paletaBioma = PALETAS_BIOMA[mapa.bioma] || PALETAS_BIOMA.tropical;
    this.limpar(paletaBioma.agua);

    const { camX, camY, tilesVisiveis } = this.calcularCamera(jogadorPos, mapa.largura, mapa.altura, 15);

    for (let vy = 0; vy < tilesVisiveis; vy++) {
      for (let vx = 0; vx < tilesVisiveis; vx++) {
        const gx = camX + vx;
        const gy = camY + vy;
        if (gy >= mapa.altura || gx >= mapa.largura) continue;

        const tipo = mapa.matriz[gy][gx];
        this.desenharTile32(vx * tamanhoTile, vy * tamanhoTile, tipo, gx, gy, paletaBioma);
      }
    }

    const telaX = (jogadorPos.x - camX) * tamanhoTile;
    const telaY = (jogadorPos.y - camY) * tamanhoTile;

    this.desenharPersonagem(
      telaX,
      telaY,
      jogador.aparencia,
      jogador.raca.id,
      1,
      false,
      null
    );
  }

  desenharMapaOceano(mapa, navioPos, faccaoJogador = 'pirata') {
    const tamanhoTile = 32;
    this.limpar('#0369a1');

    const { camX, camY, tilesVisiveis } = this.calcularCamera(navioPos, mapa.largura, mapa.altura, 15);

    for (let vy = 0; vy < tilesVisiveis; vy++) {
      for (let vx = 0; vx < tilesVisiveis; vx++) {
        const gx = camX + vx;
        const gy = camY + vy;
        if (gy >= mapa.altura || gx >= mapa.largura) continue;

        const tipo = mapa.matriz[gy][gx];
        this.desenharTile32(vx * tamanhoTile, vy * tamanhoTile, tipo, gx, gy, null);

        // Desenha rótulo curto acima das ilhas oficiais visíveis
        if (tipo === TIPOS_TILE.ILHA_OCEANO && mapa.ilhasPorCoord[`${gx},${gy}`]) {
          const nomeCurto = mapa.ilhasPorCoord[`${gx},${gy}`].nome.split('(')[0].trim();
          this.ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
          this.ctx.fillRect(vx * tamanhoTile - 12, vy * tamanhoTile - 11, 56, 11);
          this.ctx.fillStyle = '#facc15';
          this.ctx.font = 'bold 8px sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(nomeCurto.slice(0, 12), vx * tamanhoTile + 16, vy * tamanhoTile - 3);
        }
      }
    }

    const telaX = (navioPos.x - camX) * tamanhoTile;
    const telaY = (navioPos.y - camY) * tamanhoTile;
    this.desenharNavioJogador(telaX, telaY, faccaoJogador);
  }

  desenharCombateTatico(grid, unidades, celulasValidas = [], modoAcao = 'mover') {
    const tam = 48;
    this.limpar('#0f172a');

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const px = x * tam;
        const py = y * tam;
        const terreno = grid[y][x];

        if (terreno === TERRENOS_COMBATE.AGUA) {
          this.ctx.fillStyle = '#1d4ed8';
          this.ctx.fillRect(px, py, tam, tam);
          this.ctx.fillStyle = '#60a5fa';
          this.ctx.fillRect(px + 8, py + 16, 16, 3);
          this.ctx.fillRect(px + 22, py + 32, 16, 3);
        } else if (terreno === TERRENOS_COMBATE.OBSTACULO) {
          this.ctx.fillStyle = '#78350f';
          this.ctx.fillRect(px + 4, py + 4, tam - 8, tam - 8);
          this.ctx.strokeStyle = '#d97706';
          this.ctx.strokeRect(px + 6, py + 6, tam - 12, tam - 12);
        } else if (terreno === TERRENOS_COMBATE.GELO) {
          this.ctx.fillStyle = '#67e8f9';
          this.ctx.fillRect(px, py, tam, tam);
        } else if (terreno === TERRENOS_COMBATE.SALA_OPE) {
          this.ctx.fillStyle = '#1e3a8a';
          this.ctx.fillRect(px, py, tam, tam);
          this.ctx.strokeStyle = '#2dd4bf';
          this.ctx.strokeRect(px + 3, py + 3, tam - 6, tam - 6);
        } else if (terreno === TERRENOS_COMBATE.FUMAÇA) {
          this.ctx.fillStyle = '#94a3b8';
          this.ctx.fillRect(px, py, tam, tam);
        } else {
          this.ctx.fillStyle = (x + y) % 2 === 0 ? '#334155' : '#1e293b';
          this.ctx.fillRect(px, py, tam, tam);
        }

        this.ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        this.ctx.strokeRect(px, py, tam, tam);
      }
    }

    for (const cel of celulasValidas) {
      this.ctx.fillStyle =
        modoAcao === 'mover' ? 'rgba(56, 189, 248, 0.32)' : 'rgba(239, 68, 68, 0.35)';
      this.ctx.fillRect(cel.x * tam + 2, cel.y * tam + 2, tam - 4, tam - 4);
    }

    for (const u of unidades) {
      if (u.hpAtual <= 0) continue;
      const px = u.x * tam + 8;
      const py = u.y * tam + 10;

      if (u.armamentoAtivo) {
        this.ctx.strokeStyle = '#ec4899';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(u.x * tam + 4, u.y * tam + 4, tam - 8, tam - 8);
      }

      this.desenharPersonagem(
        px,
        py,
        u.aparencia,
        u.racaId,
        1,
        u.modoZoan,
        u.akumaNoMi ? u.akumaNoMi.paleta_cores : null
      );

      const larguraBarra = 36;
      const pctHp = Math.max(0, u.hpAtual / u.hpMax);
      this.ctx.fillStyle = '#0f172a';
      this.ctx.fillRect(u.x * tam + 6, u.y * tam + 3, larguraBarra, 5);
      this.ctx.fillStyle = u.lado === 'jogador' ? '#22c55e' : '#ef4444';
      this.ctx.fillRect(u.x * tam + 6, u.y * tam + 3, larguraBarra * pctHp, 5);
    }
  }

  async animarVFX({ tipo, origem, destino, cores, onRenderBase }) {
    const tam = 48;
    const ox = origem.x * tam + 24;
    const oy = origem.y * tam + 24;
    const dx = destino.x * tam + 24;
    const dy = destino.y * tam + 24;

    const frames = 14;
    for (let f = 1; f <= frames; f++) {
      const t = f / frames;
      this.ctx.save();

      if (f > frames * 0.5) {
        const shakeX = (Math.random() - 0.5) * 8;
        const shakeY = (Math.random() - 0.5) * 8;
        this.ctx.translate(shakeX, shakeY);
      }

      onRenderBase();

      if (tipo === 'projetil') {
        const cx = ox + (dx - ox) * t;
        const cy = oy + (dy - oy) * t;
        this.ctx.fillStyle = cores[0];
        this.ctx.fillRect(cx - 8, cy - 8, 16, 16);
        this.ctx.fillStyle = cores[1] || '#ffffff';
        this.ctx.fillRect(cx - 4, cy - 4, 8, 8);
      } else {
        const qtdParticulas = 18;
        for (let p = 0; p < qtdParticulas; p++) {
          const angulo = (Math.PI * 2 * p) / qtdParticulas + t;
          const raio = t * 44;
          const px = dx + Math.cos(angulo) * raio;
          const py = dy + Math.sin(angulo) * raio;
          this.ctx.fillStyle = cores[p % cores.length];
          this.ctx.fillRect(px - 3, py - 3, 6, 6);
        }
      }

      this.ctx.restore();
      await new Promise(r => setTimeout(r, 28));
    }

    await new Promise(r => setTimeout(r, 90));
    onRenderBase();
  }

  desenharNavioJogador(px, py, faccao) {
    this.ctx.fillStyle = '#78350f';
    this.ctx.fillRect(px + 4, py + 20, 24, 6);
    this.ctx.fillRect(px + 8, py + 26, 16, 3);

    this.ctx.fillStyle = '#451a03';
    this.ctx.fillRect(px + 15, py + 4, 2, 16);

    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fillRect(px + 8, py + 6, 16, 12);

    this.ctx.fillStyle = faccao === 'pirata' ? '#dc2626' : '#1d4ed8';
    this.ctx.fillRect(px + 13, py + 9, 6, 6);
  }

  desenharTile32(px, py, tipo, gx, gy, paletaBioma = null) {
    const info = INFO_TILES[tipo];
    let corBase = info.corBase;
    let corDetalhe = info.corDetalhe;

    if (paletaBioma) {
      if (tipo === TIPOS_TILE.AGUA_PROFUNDA) corBase = paletaBioma.agua;
      if (tipo === TIPOS_TILE.AREIA) corBase = paletaBioma.borda;
      if (tipo === TIPOS_TILE.GRAMA) {
        corBase = paletaBioma.solo;
        corDetalhe = paletaBioma.detalheSolo;
      }
      if (tipo === TIPOS_TILE.PEDRA) corBase = paletaBioma.obstaculo;
    }

    this.ctx.fillStyle = corBase;
    this.ctx.fillRect(px, py, 32, 32);
    this.ctx.fillStyle = corDetalhe;

    if (tipo === TIPOS_TILE.AGUA_PROFUNDA || tipo === TIPOS_TILE.MAR_ABERTO) {
      const onda = (gx + gy) % 2 === 0 ? 6 : 16;
      this.ctx.fillRect(px + onda, py + 10, 10, 2);
      this.ctx.fillRect(px + 4, py + 22, 12, 2);
    } else if (tipo === TIPOS_TILE.CALM_BELT) {
      this.ctx.fillStyle = '#e0f2fe';
      this.ctx.fillRect(px + 4, py + 14, 24, 2);
    } else if (tipo === TIPOS_TILE.RED_LINE) {
      this.ctx.fillStyle = '#7f1d1d';
      this.ctx.fillRect(px + 4, py + 4, 10, 10);
      this.ctx.fillRect(px + 18, py + 18, 10, 10);
    } else if (tipo === TIPOS_TILE.REVERSE_MOUNTAIN) {
      this.ctx.fillStyle = '#38bdf8';
      this.ctx.fillRect(px + 10, py, 12, 32);
      this.ctx.fillStyle = '#facc15';
      this.ctx.fillRect(px + 14, py + 8, 4, 16);
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
      this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
      this.ctx.fillRect(px + 6, py + 6, 10, 8);
    } else if (tipo === TIPOS_TILE.TAVERNA) {
      this.ctx.fillStyle = '#451a03';
      this.ctx.fillRect(px + 2, py + 2, 28, 28);
      this.ctx.fillStyle = '#b45309';
      this.ctx.fillRect(px + 4, py + 4, 24, 14);
      this.ctx.fillStyle = '#facc15';
      this.ctx.fillRect(px + 12, py + 20, 8, 8);
    } else if (tipo === TIPOS_TILE.PORTO) {
      this.ctx.fillStyle = '#0284c7';
      this.ctx.fillRect(px, py + 16, 32, 16);
      this.ctx.fillStyle = '#92400e';
      this.ctx.fillRect(px + 8, py, 16, 28);
      this.ctx.fillStyle = '#f8fafc';
      this.ctx.fillRect(px + 14, py + 6, 4, 12);
    } else if (tipo === TIPOS_TILE.DOJO) {
      this.ctx.fillStyle = '#7f1d1d';
      this.ctx.fillRect(px + 2, py + 4, 28, 24);
      this.ctx.fillStyle = '#f8fafc';
      this.ctx.fillRect(px + 8, py + 14, 16, 14);
      this.ctx.fillStyle = '#dc2626';
      this.ctx.fillRect(px + 14, py + 18, 4, 10);
    } else if (tipo === TIPOS_TILE.BASE_MARINHA) {
      this.ctx.fillStyle = '#f8fafc';
      this.ctx.fillRect(px + 3, py + 3, 26, 26);
      this.ctx.fillStyle = '#1d4ed8';
      this.ctx.fillRect(px + 3, py + 12, 26, 6);
      this.ctx.fillStyle = '#0f172a';
      this.ctx.fillRect(px + 13, py + 20, 6, 9);
    } else if (tipo === TIPOS_TILE.ILHA_OCEANO) {
      this.ctx.fillStyle = '#fde047';
      this.ctx.fillRect(px + 4, py + 7, 24, 18);
      this.ctx.fillStyle = '#16a34a';
      this.ctx.fillRect(px + 7, py + 9, 18, 14);
      this.ctx.fillStyle = '#78350f';
      this.ctx.fillRect(px + 15, py + 5, 2, 6);
    } else if (tipo === TIPOS_TILE.NAUFRAGIO) {
      this.ctx.fillStyle = '#92400e';
      this.ctx.fillRect(px + 8, py + 14, 14, 10);
      this.ctx.fillStyle = '#f59e0b';
      this.ctx.fillRect(px + 11, py + 16, 8, 6);
    } else if (tipo === TIPOS_TILE.REDEMOINHO) {
      this.ctx.strokeStyle = '#bae6fd';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(px + 6, py + 6, 20, 20);
      this.ctx.strokeRect(px + 12, py + 12, 8, 8);
    } else if (tipo === TIPOS_TILE.NAVIO_INIMIGO) {
      this.ctx.fillStyle = '#1e293b';
      this.ctx.fillRect(px + 6, py + 20, 20, 6);
      this.ctx.fillStyle = '#dc2626';
      this.ctx.fillRect(px + 10, py + 7, 12, 11);
    }

    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.14)';
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
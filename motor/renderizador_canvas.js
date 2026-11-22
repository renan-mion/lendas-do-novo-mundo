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

    // Sombra no chão
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    this.ctx.fillRect(x + 3 * escala, y + 14 * escala, 10 * escala, 2 * escala);

    // Desenha corpo base
    this.desenharMatriz(matriz, x, y, escala, mapaCores);

    // Detalhes raciais
    if (!modoZoan && this.configSprites.detalhes_raciais[racaId]) {
      for (const pixel of this.configSprites.detalhes_raciais[racaId]) {
        this.ctx.fillStyle = pixel.cor;
        this.ctx.fillRect(x + pixel.x * escala, y + pixel.y * escala, escala, escala);
      }
    }

    // Acessório na cabeça
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
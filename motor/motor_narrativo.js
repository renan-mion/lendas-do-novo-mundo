import { TIPOS_TILE, PALETAS_BIOMA } from './gerador_mapas.js';

export class MotorNarrativo {
  constructor(estadoJogo, callbacks) {
    this.estadoJogo = estadoJogo;
    this.callbacks = callbacks;
  }

  gerarEventoLocal(tipoTile) {
    const jogador = this.estadoJogo.jogador;
    const mapaAtual = this.estadoJogo.mapaAtual;
    const ehPirata = jogador.faccao === 'pirata';
    const nomeBioma = PALETAS_BIOMA[mapaAtual?.bioma]?.nome || 'Tropical';

    switch (tipoTile) {
      case TIPOS_TILE.TAVERNA:
        return {
          titulo: `🍺 Taverna de ${mapaAtual.nome}`,
          texto: `Ambiente acolhedor neste clima de ${nomeBioma}. Viajantes comentam sobre as rotas para a Grand Line e os tesouros escondidos nas ilhas vizinhas.`,
          opcoes: [
            {
              texto: 'Descansar e comer carne (Recupera todo HP e Energia - ฿ 500)',
              acao: () => {
                if (jogador.berries < 500) {
                  return 'Você não tem Berries suficientes (precisa de ฿ 500).';
                }
                jogador.berries -= 500;
                jogador.hpAtual = jogador.hpMax;
                jogador.energiaAtual = jogador.energiaMax;
                return 'Banquete completo! HP e Energia totalmente restaurados.';
              }
            },
            {
              texto: 'Ouvir rumores de navegação (+30 XP)',
              acao: () => {
                jogador.xp += 30;
                return 'Um velho navegador alerta: "Para entrar na Grand Line, rume para o centro do mapa até a Reverse Mountain! Evite o Calm Belt!"';
              }
            }
          ]
        };

      case TIPOS_TILE.DOJO:
        return {
          titulo: `🥋 Dojo de ${mapaAtual.nome}`,
          texto: `Mestres locais adaptaram suas técnicas ao ambiente de ${nomeBioma}.`,
          opcoes: [
            {
              texto: 'Treinar arduamente (+45 XP, consome 15 de Energia)',
              acao: () => {
                if (jogador.energiaAtual < 15) {
                  return 'Energia insuficiente para treinar agora. Descanse na Taverna.';
                }
                jogador.energiaAtual -= 15;
                jogador.xp += 45;
                return 'Treino concluído com sucesso! (+45 XP)';
              }
            },
            {
              texto: 'Meditar para focar o espírito (Recupera 20 de Energia)',
              acao: () => {
                jogador.energiaAtual = Math.min(jogador.energiaMax, jogador.energiaAtual + 20);
                return 'Sua energia espiritual foi restaurada em +20.';
              }
            }
          ]
        };

      case TIPOS_TILE.BASE_MARINHA:
        return {
          titulo: `🏛️ Guarnição da Marinha — ${mapaAtual.nome}`,
          texto: ehPirata
            ? 'Os portões estão fortemente vigiados por soldados da Marinha com cartazes de procurado!'
            : 'Os oficiais saúdam sua chegada e oferecem apoio logístico da Marinha.',
          opcoes: ehPirata
            ? [
                {
                  texto: '⚔️ Invadir a base e enfrentar a guarnição!',
                  acao: () => {
                    this.callbacks.iniciarCombate('patrulha_marinha');
                    return 'Alarme acionado! Soldados cercam o pátio!';
                  }
                },
                {
                  texto: 'Recuar discretamente',
                  acao: () => 'Você se afasta sem chamar atenção.'
                }
              ]
            : [
                {
                  texto: 'Reabastecer suprimentos oficiais (+35 Suprimentos)',
                  acao: () => {
                    jogador.suprimentos = Math.min(100, jogador.suprimentos + 35);
                    return 'Suprimentos militares carregados no seu navio!';
                  }
                },
                {
                  texto: '⚔️ Patrulhar a costa contra piratas invasores!',
                  acao: () => {
                    this.callbacks.iniciarCombate('bando_pirata');
                    return 'Você interceptou um bando pirata tentando saquear a costa!';
                  }
                }
              ]
        };

      case TIPOS_TILE.PORTO:
        return {
          titulo: `⛵ Porto de ${mapaAtual.nome}`,
          texto: 'Seu navio aguarda atracado no cais, pronto para navegar pelo mapa-múndi.',
          opcoes: [
            {
              texto: 'Comprar suprimentos de viagem (+40 Suprimentos - ฿ 800)',
              acao: () => {
                if (jogador.berries < 800) {
                  return 'Berries insuficientes (precisa de ฿ 800).';
                }
                jogador.berries -= 800;
                jogador.suprimentos = Math.min(100, jogador.suprimentos + 40);
                return 'Porão reabastecido com +40 Suprimentos!';
              }
            },
            {
              texto: '🧭 Zarpar para o Mapa-Múndi Oceânico',
              acao: () => {
                this.callbacks.zarparOceano();
                return 'Velas içadas! Você retornou ao oceano.';
              }
            }
          ]
        };

      default:
        return null;
    }
  }

  gerarEventoMaritimo(tipoTile, posX, posY) {
    const jogador = this.estadoJogo.jogador;
    const mapaOceano = this.estadoJogo.mapaOceano;

    // 1. Ilha Oficial Mapeada
    if (tipoTile === TIPOS_TILE.ILHA_OCEANO) {
      const ilhaConfig = mapaOceano.ilhasPorCoord[`${posX},${posY}`];
      const nomeIlha = ilhaConfig ? ilhaConfig.nome : 'Ilha Desconhecida';
      const nomeBioma = PALETAS_BIOMA[ilhaConfig?.bioma || 'tropical'].nome;

      return {
        titulo: `🏝️ Terra à Vista: ${nomeIlha}`,
        texto: `Bioma: ${nomeBioma} | Nível Recomendado: ${ilhaConfig?.nivel_recomendado || 1}. O porto está visível à frente.`,
        opcoes: [
          {
            texto: `⚓ Ancorar e explorar ${nomeIlha}`,
            acao: () => {
              this.callbacks.atracarIlha(ilhaConfig);
              return `Você desembarcou em ${nomeIlha}.`;
            }
          },
          {
            texto: 'Continuar navegando',
            acao: () => 'Você segue rumo ao horizonte.'
          }
        ]
      };
    }

    // 2. Travessia da Reverse Mountain para a Grand Line (Paradise)
    if (tipoTile === TIPOS_TILE.REVERSE_MOUNTAIN) {
      const jaNaGrandLine = posX >= 22 && posY >= 11 && posY <= 13;
      return {
        titulo: '⛰️ Reverse Mountain — A Correnteza Ascendente!',
        texto: jaNaGrandLine
          ? 'Você está nos Cabos Gêmeos, na entrada da Grand Line (Paraíso)! O Log Pose aponta para frente.'
          : 'As águas dos quatro mares convergem e sobem a montanha vermelha em direção à lendária Grand Line!',
        opcoes: [
          {
            texto: '🌊 Escalar a Reverse Mountain e entrar na Grand Line (Requer Nível 2 ou ฿ 2.000)',
            acao: () => {
              if (jogador.nivel < 2 && jogador.berries < 2000) {
                return 'Sua embarcação e experiência ainda são frágeis demais! Alcance o Nível 2 ou junte ฿ 2.000 para reforçar o casco.';
              }
              if (jogador.nivel < 2) {
                jogador.berries -= 2000;
              }
              this.callbacks.atravessarReverseMountain();
              return '🎉 INCRÍVEL! Você subiu a Reverse Mountain e chegou aos Cabos Gêmeos, na entrada da GRAND LINE!';
            }
          }
        ]
      };
    }

    // 3. Calm Belt (Sem vento + Reis dos Mares)
    if (tipoTile === TIPOS_TILE.CALM_BELT) {
      return {
        titulo: '🐉 Calm Belt — Ninho de Reis dos Mares!',
        texto: 'Não há vento algum nas velas e sombras colossais emergem das profundezas!',
        opcoes: [
          {
            texto: '⚔️ Enfrentar a emboscada marítima!',
            acao: () => {
              this.callbacks.iniciarCombate('abordagem_naval');
              return 'Monstros e piratas aproveitam a calmaria para atacar seu navio!';
            }
          },
          {
            texto: 'Remar com toda força para fora (-20 Suprimentos)',
            acao: () => {
              jogador.suprimentos = Math.max(0, jogador.suprimentos - 20);
              return 'Você escapou do Calm Belt exausto (-20 Suprimentos). Use a Reverse Mountain para entrar na Grand Line com segurança!';
            }
          }
        ]
      };
    }

    // 4. Destroços
    if (tipoTile === TIPOS_TILE.NAUFRAGIO) {
      return {
        titulo: '📦 Destroços Flutuantes',
        texto: 'Barris lacrados e caixas de madeira boiam entre restos de uma antiga embarcação.',
        opcoes: [
          {
            texto: 'Içar a carga a bordo (+20 Suprimentos e +฿ 1.200)',
            acao: () => {
              jogador.suprimentos = Math.min(100, jogador.suprimentos + 20);
              jogador.berries += 1200;
              this.callbacks.limparTileOceano(posX, posY);
              return 'Você resgatou barris de comida e um cofre com ฿ 1.200!';
            }
          }
        ]
      };
    }

    // 5. Redemoinho
    if (tipoTile === TIPOS_TILE.REDEMOINHO) {
      return {
        titulo: '🌀 Redemoinho Súbito!',
        texto: 'Correntes marítimas violentas tentam girar o casco do navio.',
        opcoes: [
          {
            texto: 'Forçar o leme contra a corrente (-15 Suprimentos, +35 XP)',
            acao: () => {
              jogador.suprimentos = Math.max(0, jogador.suprimentos - 15);
              jogador.xp += 35;
              this.callbacks.limparTileOceano(posX, posY);
              return 'Você superou a correnteza! (-15 Suprimentos, +35 XP)';
            }
          }
        ]
      };
    }

    // 6. Navio Inimigo
    if (tipoTile === TIPOS_TILE.NAVIO_INIMIGO) {
      const inimigo = jogador.faccao === 'pirata' ? 'Fragata da Marinha' : 'Galeão Pirata';
      return {
        titulo: `🏴‍☠️ Abordagem Naval: ${inimigo}!`,
        texto: `Um ${inimigo} dispara canhões de advertência e lança ganchos contra seu convés!`,
        opcoes: [
          {
            texto: '⚔️ Defender o convés em combate!',
            acao: () => {
              this.callbacks.limparTileOceano(posX, posY);
              this.callbacks.iniciarCombate('abordagem_naval');
              return 'O combate no convés começou!';
            }
          },
          {
            texto: 'Manobra evasiva (-10 Suprimentos)',
            acao: () => {
              if (jogador.suprimentos < 10) {
                this.callbacks.iniciarCombate('abordagem_naval');
                return 'Sem suprimentos para manobrar, você foi abordado!';
              }
              jogador.suprimentos -= 10;
              return 'Você escapou aproveitando os ventos! (-10 Suprimentos)';
            }
          }
        ]
      };
    }

    return null;
  }
}
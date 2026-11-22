import { TIPOS_TILE } from './gerador_mapas.js';

const NOMES_ILHAS_ALEATORIAS = [
  'Ilha Orange (East Blue)',
  'Arquipélago Gecko',
  'Restaurante Baratie',
  'Ilha Loguetown',
  'Ilha Conomi',
  'Ilha Drum (Paraíso)'
];

export class MotorNarrativo {
  constructor(estadoJogo, callbacks) {
    this.estadoJogo = estadoJogo;
    this.callbacks = callbacks;
  }

  gerarEventoLocal(tipoTile) {
    const jogador = this.estadoJogo.jogador;
    const ehPirata = jogador.faccao === 'pirata';

    switch (tipoTile) {
      case TIPOS_TILE.TAVERNA:
        return {
          titulo: '🍺 Taverna do Barril Quebrado',
          texto: 'O cheiro de carne assada e rum preenche o salão. Marinheiros e piratas disfarçados trocam rumores sobre tesouros na Grand Line.',
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
                return 'Você devorou um banquete! HP e Energia totalmente restaurados.';
              }
            },
            {
              texto: 'Ouvir rumores no balcão (+25 XP)',
              acao: () => {
                jogador.xp += 25;
                return 'O taverneiro comenta: "Navios piratas e patrulhas da Marinha estão disputando suprimentos logo ao sul do Porto!"';
              }
            }
          ]
        };

      case TIPOS_TILE.DOJO:
        return {
          titulo: '🥋 Dojo Estilo Espada & Punho',
          texto: 'Discípulos treinam golpes no ar sob o olhar rigoroso do mestre do Dojo. Os bonecos de madeira estão marcados por cortes profundos.',
          opcoes: [
            {
              texto: 'Treinar arduamente (+40 XP, consome 15 de Energia)',
              acao: () => {
                if (jogador.energiaAtual < 15) {
                  return 'Você está exausto demais para treinar agora. Descanse na Taverna.';
                }
                jogador.energiaAtual -= 15;
                jogador.xp += 40;
                return 'Seu domínio técnico ficou mais afiado após o treino intenso! (+40 XP)';
              }
            },
            {
              texto: 'Meditar para focar o espírito (Recupera 20 de Energia)',
              acao: () => {
                jogador.energiaAtual = Math.min(jogador.energiaMax, jogador.energiaAtual + 20);
                return 'Sua mente se acalma e sua energia espiritual se recupera.';
              }
            }
          ]
        };

      case TIPOS_TILE.BASE_MARINHA:
        return {
          titulo: '🏛️ Base Avançada da Marinha',
          texto: ehPirata
            ? 'Guardas da Marinha patrulham o portão com rifles prontos. Entrar aqui como Pirata é pedir por encrenca!'
            : 'Os recrutas prestam continência assim que reconhecem seu uniforme oficial da Marinha.',
          opcoes: ehPirata
            ? [
                {
                  texto: '⚔️ Invadir o pátio e enfrentar os Marinheiros!',
                  acao: () => {
                    this.callbacks.iniciarCombate('patrulha_marinha');
                    return 'Alarme disparado! Capitão da Marinha e soldados bloqueiam sua saída!';
                  }
                },
                {
                  texto: 'Recuar discretamente',
                  acao: () => 'Você se afasta antes que os guardas percebam sua recompensa.'
                }
              ]
            : [
                {
                  texto: 'Reabastecer suprimentos oficiais (+30 Suprimentos)',
                  acao: () => {
                    jogador.suprimentos = Math.min(100, jogador.suprimentos + 30);
                    return 'O intendente carregou caixas de suprimentos para sua embarcação.';
                  }
                },
                {
                  texto: '⚔️ Aceitar missão de captura contra piratas invasores!',
                  acao: () => {
                    this.callbacks.iniciarCombate('bando_pirata');
                    return 'Você parte imediatamente para interceptar os piratas na costa!';
                  }
                }
              ]
        };

      case TIPOS_TILE.PORTO:
        return {
          titulo: '⛵ Porto da Ilha',
          texto: 'As ondas batem contra o píer de madeira. Seu barco está ancorado e pronto para ganhar o mar aberto.',
          opcoes: [
            {
              texto: 'Comprar suprimentos de viagem (+40 Suprimentos - ฿ 800)',
              acao: () => {
                if (jogador.berries < 800) {
                  return 'Berries insuficientes para comprar suprimentos (precisa de ฿ 800).';
                }
                jogador.berries -= 800;
                jogador.suprimentos = Math.min(100, jogador.suprimentos + 40);
                return 'Suprimentos carregados no porão do navio!';
              }
            },
            {
              texto: '🧭 Zarpar para o Oceano (Overworld Marítimo)',
              acao: () => {
                this.callbacks.zarparOceano();
                return 'Âncoras recolhidas! Você partiu para o mar aberto.';
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

    if (tipoTile === TIPOS_TILE.ILHA_OCEANO) {
      const nomeIlha = NOMES_ILHAS_ALEATORIAS[(posX + posY) % NOMES_ILHAS_ALEATORIAS.length];
      return {
        titulo: `🏝️ Terra à Vista: ${nomeIlha}`,
        texto: 'Seu vigia avistou um porto seguro e edifícios movimentados na costa desta ilha.',
        opcoes: [
          {
            texto: '⚓ Ancorar e desembarcar na ilha',
            acao: () => {
              this.callbacks.atracarIlha(nomeIlha);
              return `Você desembarcou em ${nomeIlha}.`;
            }
          },
          {
            texto: 'Continuar navegando pelo oceano',
            acao: () => 'Você mantém o leme firme e segue viagem pelos mares.'
          }
        ]
      };
    }

    if (tipoTile === TIPOS_TILE.NAUFRAGIO) {
      return {
        titulo: '📦 Destroços Flutuantes',
        texto: 'Barris lacrados e caixas de madeira boiam entre restos de uma antiga embarcação mercante.',
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

    if (tipoTile === TIPOS_TILE.REDEMOINHO) {
      return {
        titulo: '🌀 Redemoinho e Tempestade Súbita!',
        texto: 'O clima muda em segundos! Ondas gigantes atingem o casco enquanto correntes tentam puxar o navio.',
        opcoes: [
          {
            texto: 'Forçar o leme contra a corrente (-15 Suprimentos, +35 XP)',
            acao: () => {
              jogador.suprimentos = Math.max(0, jogador.suprimentos - 15);
              jogador.xp += 35;
              this.callbacks.limparTileOceano(posX, posY);
              return 'Com manobras arriscadas, você escapou do redemoinho! (-15 Suprimentos, +35 XP)';
            }
          }
        ]
      };
    }

    if (tipoTile === TIPOS_TILE.NAVIO_INIMIGO) {
      const inimigo = jogador.faccao === 'pirata' ? 'Fragata da Marinha' : 'Galeão Pirata';
      return {
        titulo: `🏴‍☠️ Abordagem Naval: ${inimigo}!`,
        texto: `Um ${inimigo} dispara tiros de advertência e lança ganchos de abordagem contra o seu convés!`,
        opcoes: [
          {
            texto: '⚔️ Preparar para o combate no convés!',
            acao: () => {
              this.callbacks.limparTileOceano(posX, posY);
              this.callbacks.iniciarCombate('abordagem_naval');
              return `Os ganchos prenderam os navios! O combate no convés vai começar!`;
            }
          },
          {
            texto: 'Tentar manobra evasiva (-10 Suprimentos)',
            acao: () => {
              if (jogador.suprimentos < 10) {
                this.callbacks.iniciarCombate('abordagem_naval');
                return 'Sem suprimentos para manobrar rápido, você foi alcançado e abordado!';
              }
              jogador.suprimentos -= 10;
              return 'Você escapou por pouco aproveitando o vento a favor! (-10 Suprimentos)';
            }
          }
        ]
      };
    }

    // Evento aleatório em mar aberto (20% de chance)
    if (tipoTile === TIPOS_TILE.MAR_ABERTO && Math.random() < 0.2) {
      const eventosAleatorios = [
        {
          titulo: '🐟 Cardume de Peixes Gigantes',
          texto: 'Um cardume de peixes saborosos acompanha o casco do navio.',
          opcoes: [
            {
              texto: 'Pescar para o estoque (+15 Suprimentos)',
              acao: () => {
                jogador.suprimentos = Math.min(100, jogador.suprimentos + 15);
                return 'Pescaria farta! O estoque de suprimentos subiu em +15%.';
              }
            }
          ]
        },
        {
          titulo: '🕊️ Gaivota Carteira do Jornal Mundial',
          texto: 'Uma gaivota pousa na amurada oferecendo a edição do dia com notícias dos mares.',
          opcoes: [
            {
              texto: 'Comprar jornal por ฿ 100 (+20 XP)',
              acao: () => {
                if (jogador.berries < 100) return 'Você não tem ฿ 100 trocados para a gaivota.';
                jogador.berries -= 100;
                jogador.xp += 20;
                return 'Você leu sobre os movimentos dos Yonkou e aprendeu novas rotas (+20 XP).';
              }
            }
          ]
        }
      ];
      return eventosAleatorios[Math.floor(Math.random() * eventosAleatorios.length)];
    }

    return null;
  }
}
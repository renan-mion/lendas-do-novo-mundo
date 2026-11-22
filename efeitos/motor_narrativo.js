import { TIPOS_TILE } from './gerador_mapas.js';

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
          titulo: '⛵ Porto da Ilha de Origem',
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
              texto: '🧭 Zarpar para o Oceano (Overworld Marítimo - Fase 4)',
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
}
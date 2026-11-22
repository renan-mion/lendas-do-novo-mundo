# 🏴‍☠️ Lendas do Novo Mundo

> *"As pessoas nunca deixarão de ter sonhos!"* — Um RPG tático 2D de mundo aberto inspirado no universo de **One Piece**, desenvolvido em **HTML5, CSS3 e JavaScript puro (ES Modules)**, sem dependências ou frameworks externos.

---

## 🧭 Sobre o Projeto

**Lendas do Novo Mundo** combina a profundidade narrativa de um RPG de texto com a estratégia de batalhas táticas por turnos em grid 2D. Todo o visual do jogo — desde os cenários das ilhas e oceanos até os personagens, transformações Zoan e explosões de Akuma no Mi — é gerado **proceduralmente em Pixel Art 32x32** diretamente no **HTML5 Canvas**.

As mecânicas de progressão, raças, estilos de luta, Haki e Akuma no Mi são adaptadas do sistema *Dungeons & Devil Fruits* para combate tático em turnos.

---

## ✨ Principais Sistemas

- **🎭 Criação de Personagem Completa:**
  - Escolha sua **Facção** (Pirata em busca de liberdade e recompensas ou Marinheiro defendendo a justiça).
  - Selecione entre **7 Raças** jogáveis (Humano, Homem-Peixe, Sereiano, Habitante do Céu, Mink, Ciborgue e Tribo Yokai).
  - Domine **8 Classes / Estilos de Luta** (Brigão, Artista Marcial, Guerreiro, Atirador, Ladino, Químico, Inventor e Escaldo).
  - Distribua atributos, desperte **Haki** e consuma uma **Akuma no Mi** (Logia, Paramecia ou Zoan), além de customizar as cores do seu sprite procedural.

- **🏝️ Exploração Terrestre Procedural:**
  - Ilhas geradas por matrizes numéricas em tileset 32x32.
  - Interação com pontos de interesse (**Taverna**, **Porto**, **Dojo** e **Base da Marinha**) que disparam eventos narrativos, recrutamento, treinamento e missões.

- **⛵ Navegação Marítima e Overworld:**
  - Navegue por um oceano procedural gerenciando **suprimentos** da tripulação.
  - Enfrente eventos aleatórios em alto-mar, tempestades e **abordagens de navios** inimigos.

- **⚔️ Combate Tático em Grid (10x10):**
  - Sistema de turnos com pontos de movimento e ação.
  - **Interação Ambiental e Empurrão (*Knockback*):** Arremesse inimigos contra obstáculos ou para dentro da água — **fatal para usuários de Akuma no Mi!**
  - **Haki e Akuma no Mi:** 12 frutas jogáveis e os 3 tipos de Haki (Armamento, Observação e Rei).

  
  - **Efeitos Visuais Procedurais (VFX):** Projéteis animados, explosões com partículas, troca dinâmica de sprite para formas Zoan, alteração de terreno no grid, *screen shake* e *hitstop*.

## 🚀 Como Executar Localmente

Como o projeto utiliza **ES Modules (`import`/`export`)** e carrega arquivos `.json` via `fetch()`, os navegadores exigem que ele seja executado através de um servidor local (para evitar bloqueios de CORS do protocolo `file://`).

1. **Clone ou baixe** a pasta do projeto.
2. **Inicie um servidor local** na pasta raiz usando uma das opções abaixo:
   - **VS Code:** Instale a extensão *Live Server*, clique com o botão direito em `index.html` e selecione **"Open with Live Server"**.
   - **Python:** Execute `python -m http.server 8000` no terminal e acesse `http://localhost:8000`.
   - **Node.js:** Execute `npx serve` no terminal e acesse o endereço exibido.

---

## 📜 Créditos e Inspiração

- Baseado na obra **One Piece**, criada por *Eiichiro Oda*.
- Mecânicas adaptadas do sistema *Dungeons & Devil Fruits (5e Homebrew).

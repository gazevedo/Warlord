# Regras de design — mapa e gestão de cidades

Este documento é a fonte de verdade visual e funcional para o mapa mundial e para a gestão de cidades do **Warlord**.

## 1. Princípio central

- O mundo 3D cartoon é a interface principal, não um conteúdo dentro de um aplicativo.
- O cenário deve ocupar aproximadamente **85–90% da experiência visual**. HUD e ações são camadas flutuantes nas bordas.
- A interação com cidades, tropas e combates acontece prioritariamente no mapa. Telas separadas devem ser exceção.
- Ordem de prioridade: mundo; cidades e exércitos; seleção e combate; informações críticas; ações; menus secundários.

## 2. Direção visual

### Obrigatório

- Diorama 3D estilizado, colorido e legível em telas pequenas.
- Formas arredondadas, proporções exageradas, materiais não realistas, iluminação e sombras suaves.
- Terreno com volume, gramados, florestas densas, montanhas, rochas, água, caminhos, clareiras e variação de relevo.
- Ocupação visual equilibrada: não deixar grandes áreas sem elementos de ambiente ou gameplay.

### Proibido

- Mapa 2D, tabuleiro, papel ou linhas topográficas como linguagem dominante.
- Estética flat, minimalista, fotorrealista, de dashboard ou aplicativo empresarial.
- Painéis laterais permanentes e grandes superfícies de interface cobrindo o mundo.

## 3. Câmera e navegação

- Câmera elevada em perspectiva 3/4, mostrando topo e laterais das construções.
- Arrastar move o mundo; gesto de pinça, roda ou botões altera o zoom; toque seleciona objetos no cenário.
- Zoom distante enfatiza território, rotas e posição das cidades.
- Zoom próximo revela construções, decoração e atividade ambiental.
- O mapa deve preservar limites de navegação para que o jogador não perca o mundo de vista.

## 4. Modelo de cidade

Uma cidade é sempre um castelo, fortaleza, vila ou cidadela construído sobre o terreno. Um marcador 2D isolado nunca substitui sua representação física.

Cada cidade precisa de silhueta forte, torres, muralhas, portão, telhados contrastantes, bandeiras, alturas variadas e proporções legíveis em mobile. A etiqueta flutuante, sempre voltada para a câmera, limita-se a:

- nome;
- nível;
- proprietário ou aliança;
- tropas, apenas quando relevante.

### Tiers visuais

| Nível | Tier | Evolução visual esperada |
| --- | --- | --- |
| 1–9 | Pequeno assentamento | núcleo simples e uma torre |
| 10–24 | Vila fortificada | paliçada/muralha e duas torres |
| 25–49 | Pequeno castelo | torre central, portão e muralha de pedra |
| 50–74 | Castelo desenvolvido | mais altura, torres e casas auxiliares |
| 75–99 | Grande castelo | muralha ampliada, quatro torres e bandeiras |
| 100–149 | Fortaleza | estrutura maciça e elementos defensivos |
| 150+ | Grande cidadela | escala máxima, múltiplas torres e ornamentação |

Dentro de um tier, bandeiras, casas, altura de muralha e decoração podem sinalizar progressão sem exigir um modelo exclusivo por nível.

## 5. Seleção e ações de cidade

1. O toque destaca a construção com halo ou anel no solo.
2. Uma ficha compacta mostra proprietário, nome, nível e tropas.
3. Ações contextuais aparecem na mesma camada do mapa (por exemplo: visitar, atacar e espionar).
4. Fechar a ficha remove o destaque sem alterar a câmera.
5. A seleção não abre automaticamente uma tela separada.

## 6. Exércitos, marchas e combate

- Uma marcha deve exibir unidade no mundo, origem, destino, trajetória, tropas e tempo restante.
- Marchas hostis usam cor e símbolos distintos das aliadas.
- Combate acontece sobre a cidade com efeitos breves: impacto, poeira, fumaça, brilho, explosões pequenas, tremor discreto e perdas.
- Nunca criar uma tela de batalha separada como fluxo principal.

## 7. HUD e controles

- Topo: perfil, nível, recursos, poder, mensagens, notificações e configurações.
- Laterais: eventos, missões, loja, recompensas e atalhos secundários.
- Base: navegação principal e ações contextuais.
- Botões usam linguagem fantasy/cartoon mobile: volume, bordas fortes, sombras, ícones grandes e estados inequívocos de foco, pressão, bloqueio, seleção e notificação.
- Nenhum painel permanente pode reduzir de modo relevante a área do mundo.

## 8. Critérios de aceite

- [ ] O mundo continua sendo o elemento dominante em viewport mobile e desktop.
- [ ] Há profundidade e perspectiva 3/4 perceptíveis.
- [ ] Toda cidade possui construção visível, tier coerente e etiqueta essencial.
- [ ] Pan, zoom, seleção e fechamento funcionam por toque/mouse e teclado quando aplicável.
- [ ] A seleção mantém o mapa visível e oferece ações contextuais.
- [ ] Marchas são visíveis no mundo, com trajetória, tropa e tempo.
- [ ] HUD ocupa principalmente as bordas e não parece um dashboard.
- [ ] Interface permanece legível a 320 px e respeita `prefers-reduced-motion`.

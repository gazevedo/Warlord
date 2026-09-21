# Regras de design — Parte 2: mapa ilustrado de fantasia

## Objetivo

Refazer visualmente o mapa mundial usando a imagem de referência anexada ao briefing como **target visual**. A referência tem prioridade sobre o design atual.

O projeto e suas funcionalidades já existem. Esta etapa é prioritariamente visual: terreno, água, cidades, vegetação, montanhas, caminhos, HUD e integração dos elementos devem se aproximar de um mapa de estratégia mobile premium.

### Limites do escopo

- Não recriar regras de cidades, batalhas, movimentação, níveis, recursos ou backend.
- Não alterar regras funcionais sem necessidade.
- Reutilizar seleção, coordenadas, zoom, pan, marchas e responsividade existentes.
- Separar apresentação da regra de negócio.

## 1. Princípio fundamental

Substituir completamente a estética atual de plataforma/tabuleiro 3D verde. O resultado deve parecer um **mapa ilustrado de fantasia**, rico em detalhes e pertencente a um jogo de estratégia mobile premium.

Remover:

- plataforma verde flutuante ou ilha retangular;
- borda física delimitando o mundo;
- relevo geométrico e perspectiva 3D exagerada;
- rio elevado, vertical, tubular ou semelhante a uma parede;
- montanhas triangulares isoladas;
- árvores feitas de círculos, bolinhas ou cones;
- cidades semelhantes a caixas;
- grandes superfícies verdes uniformes e vazias.

## 2. Linguagem visual

Adotar o estilo **painted cartoon fantasy map**: ilustração de fantasia + mapa estratégico + cartoon detalhado.

A profundidade deve ser simulada por pintura, luz, sombra, perspectiva, escala, sobreposição, textura e detalhes ambientais. O mapa não deve parecer low-poly, flat, Google Maps, mapa tático militar ou cenário fotorrealista.

Todos os assets devem compartilhar:

- mesma perspectiva e direção de iluminação;
- nível de detalhe e saturação equivalentes;
- mesma espessura e linguagem de desenho;
- acabamento de um único artista.

Não misturar pixel art, fotografia, ícones flat, 3D low-poly e estilos incompatíveis.

## 3. Mundo contínuo e enquadramento

O mundo ocupa todo o fundo disponível, sem borda, plataforma ou vazio externo. A viewport é apenas uma janela sobre um território maior; ao arrastar, o mapa continua naturalmente.

A referência principal é landscape, mas o mapa deve funcionar em desktop, tablet, mobile landscape e portrait.

No portrait, não reduzir o desktop inteiro. Reposicionar e condensar o HUD, manter o mapa em tela cheia, usar menu inferior em toda a largura e apresentar o painel selecionado como bottom sheet sem perder a cidade de vista.

## 4. Terreno

Refazer o solo com variações orgânicas de:

- verde claro, médio e escuro;
- terra, regiões secas e campos;
- vegetação, pedras e pequenas irregularidades;
- textura pintada sutil sem repetição perceptível.

O terreno não pode ser uma única superfície verde. A composição deve ter detalhe suficiente para parecer viva, mantendo áreas negativas para leitura de cidades, tropas e caminhos.

## 5. Montanhas

Substituir pirâmides e triângulos por cadeias montanhosas ilustradas:

- grandes conjuntos com vários picos irregulares;
- rocha aparente, faces iluminadas e sombreadas;
- variação de escala e algumas montanhas nevadas;
- cordilheiras, serras, paredões e vales;
- agrupamento orgânico, nunca picos geométricos isolados.

## 6. Florestas e vegetação

Usar árvores cartoon ilustradas individualmente, incluindo pinheiros, árvores de copa e vegetação baixa. Variar tamanho, tonalidade, orientação e densidade.

Florestas devem formar massas orgânicas com sobreposição e silhueta irregular, e não matrizes de círculos. Árvores podem aparecer diante de montanhas e construções para reforçar profundidade.

## 7. Água

Rios e lagos ficam integrados e nivelados com o terreno.

Rios devem:

- acompanhar curvas naturais e variar de largura;
- conectar lagos e passar entre montanhas;
- possuir margens claras, pedras, reflexos e variação tonal;
- usar azul/turquesa sem dominar a composição.

Lagos usam formas orgânicas. Pontes e margens devem conectar água, estradas e cidades de maneira coerente. Nunca usar água como objeto elevado, tubo ou parede vertical.

## 8. Estradas

Substituir linhas geométricas por caminhos de terra/bege com largura moderada, curvas suaves, bifurcações e conexão natural entre cidades.

Evitar cruzamentos perfeitos. A estrada deve acompanhar relevo, margens, florestas e pontes como parte daquele mundo.

## 9. Densidade ambiental

Compor o mundo com árvores, bosques, pedras, riachos, lagos, campos, casas, ruínas, pontes, plantações, caminhos, vegetação e detalhes decorativos.

Não distribuir itens aleatoriamente nem preencher toda a tela. Criar regiões reconhecíveis, pontos focais e respiros suficientes para gameplay.

Nuvens discretas e parcialmente transparentes podem cobrir bordas, montanhas ou regiões inexploradas, aumentando a escala sem esconder cidades importantes.

## 10. Cidades ilustradas

Substituir as construções atuais por cidades/castelos ilustrados imediatamente reconhecíveis. Cada composição deve incluir:

- castelo principal e pequenas construções;
- torres, muralhas e portões;
- telhados e bandeiras;
- sombra pintada e integração com o terreno.

Cidades devem ser proporcionalmente maiores que no design anterior, permitindo reconhecer castelo, torres, muralhas e bandeiras mesmo com zoom distante, mas sem ocultar grandes partes do mapa.

### Tiers existentes

Reutilizar os tiers funcionais já definidos:

- níveis baixos: pequena fortificação;
- níveis médios: castelo;
- níveis altos: castelo grande com várias torres;
- níveis muito altos: fortaleza ou cidadela.

Não é necessário criar um asset exclusivo por nível.

### Propriedade

Identificar propriedade principalmente pelas bandeiras e detalhes:

- jogador: azul;
- aliado: azul/ciano ou cor configurada;
- inimigo: vermelho;
- neutro: cinza.

Não pintar a arquitetura inteira com a cor do proprietário.

## 11. Labels das cidades

Usar label compacto abaixo ou próximo da cidade, sem cobrir o castelo. Priorizar nível, nome e tag da aliança:

```text
83  Aurora
    [BR1]
```

O nível aparece em medalhão circular. O fundo é azul-marinho/preto semitransparente, com borda discreta e texto branco.

## 12. Exércitos e marchas

Preservar toda a lógica existente, alterando somente sua apresentação.

Exércitos devem parecer pequenos grupos de soldados, não pontos, círculos ou ícones abstratos. O grupo representa visualmente grandes contingentes, enquanto a quantidade real continua numérica.

Linhas de marcha são discretas, pontilhadas ou tracejadas, visualmente acompanhando o terreno:

- próprias: azul;
- inimigas: vermelho.

Mostrar tempo restante próximo ao exército, por exemplo `12m 34s`, sem deixar linha ou etiqueta dominar o cenário.

## 13. HUD superior

Manter perfil, recursos, mensagens, notificações e configurações, adaptando-os à referência:

- perfil no canto superior esquerdo;
- avatar/brasão, nome, nível e poder;
- recursos distribuídos no topo;
- fundo azul-marinho escuro;
- bordas arredondadas, ícones ilustrados e números brancos;
- detalhes dourados e acabamento de interface de jogo.

Evitar componentes HTML genéricos.

## 14. Botões laterais

Eventos, Missões e Loja permanecem à esquerda, com fundo azul-marinho, bordas grossas, acabamento dourado, ícones ilustrados, texto claro e badges vermelhos.

Os botões devem parecer componentes de jogo, não botões de aplicação web.

## 15. Controles do mapa

Zoom e centralização permanecem à direita em botões circulares/ovais escuros para `+`, `−` e centralizar. Não usar aparência padrão de browser ou biblioteca de mapas.

## 16. Menu inferior

Manter Mundo, Cidades, Exército, Aliança e Mais em um HUD azul-marinho escuro, com ícones ilustrados, texto claro, divisores discretos e destaque dourado/azul no item ativo.

No desktop, a barra não deve parecer pequena demais ou desconectada. No mobile, ocupa a largura útil.

## 17. Cidade selecionada

A seleção mantém o mapa visível e apresenta painel azul-marinho com borda dourada. Posicionar no canto inferior direito em telas grandes e como bottom sheet no mobile.

Mostrar:

- nome, nível e aliança;
- quantidade de tropas;
- coordenadas;
- ações **Ver cidade**, **Enviar tropas**, **Atacar** e **Mais**.

Usar botões azuis e destacar **Atacar** em vermelho, sempre com linguagem ilustrada de jogo.

## 18. Assets obrigatórios

Não tentar construir todo o novo estilo somente com CSS. Criar ou usar assets PNG/WebP transparentes ou sprites, com resolução suficiente para zoom, para:

- árvores e florestas;
- montanhas e montanhas nevadas;
- pedras, rios e lagos;
- castelos, muralhas, torres e bandeiras;
- tropas;
- pontes, ruínas e plantações;
- nuvens.

## 19. Paleta

| Elemento | Direção de cor |
| --- | --- |
| Natureza | verdes naturais variados |
| Água | azul e turquesa |
| Montanhas | cinza, azul acinzentado e branco |
| Estradas | bege e terra |
| HUD | azul-marinho muito escuro |
| Destaques | dourado |
| Jogador | azul |
| Inimigo | vermelho |
| Premium | azul cristal ou roxo |

## 20. Prioridade de implementação

Executar nesta ordem:

1. fundo e terreno contínuo;
2. água integrada;
3. montanhas ilustradas;
4. florestas e vegetação;
5. estradas;
6. castelos/cidades;
7. labels;
8. exércitos e marchas;
9. HUD superior;
10. menus laterais;
11. menu inferior;
12. painel da cidade selecionada;
13. responsividade;
14. sombras, partículas, animações e polimento.

Não refinar o HUD antes de o mapa atingir a linguagem visual esperada.

## 21. Preservação funcional

Antes de implementar, identificar os componentes do mapa, sistema de coordenadas, seleção, zoom/pan, marchas e breakpoints responsivos.

Não quebrar:

- seleção de cidade;
- ataque e movimentação;
- níveis, tropas e recursos;
- zoom e pan;
- responsividade.

Alterar prioritariamente a camada de apresentação.

## 22. Critérios de aceitação

Comparar a implementação diretamente com a referência antes de concluir. A primeira leitura da tela deve ser um grande mapa de fantasia cartoon ilustrado, com:

- terreno natural detalhado;
- florestas densas e orgânicas;
- cordilheiras e montanhas nevadas;
- rios e lagos naturais;
- castelos detalhados e claramente reconhecíveis;
- estradas orgânicas;
- mundo amplo e contínuo;
- exércitos integrados ao terreno;
- HUD azul-marinho/dourado;
- acabamento de estratégia mobile premium.

Se ainda parecer uma plataforma 3D verde com objetos geométricos, água vertical, montanhas triangulares ou cidades-caixa, **não considerar concluído**.

## Resultado final esperado

O usuário deve enxergar primeiro uma ilustração viva e interativa de um mundo medieval, com castelos, florestas, rios, montanhas e exércitos. A sensação nunca deve ser de objetos 3D colocados sobre uma plataforma.

# Regra de escopo — batalha no mapa

Este documento é a fonte de verdade do escopo de batalha do **Warlord**. O sistema de cidades, níveis, jogadores e mapa é preexistente; esta entrega cobre somente ataque, marcha, defesa, combate, baixas, resultado, conquista e retorno.

## 1. Princípio

A batalha ocorre no mundo 3D, sem cena separada. O servidor/engine determina o resultado; animações de 2 a 4 segundos apenas o representam. Toda regra numérica pertence a uma configuração central, nunca a valores dispersos na interface.

## 2. Início do ataque

O jogador seleciona uma cidade própria como origem, uma cidade inimiga como destino, aciona **Atacar**, informa tropas, consulta distância/tempo e confirma. Antes da criação, validar atomicamente:

- origem pertence ao jogador;
- destino é inimigo e diferente da origem;
- tropas é um inteiro maior que zero;
- a origem possui o contingente solicitado.

Ao confirmar, debitar as tropas imediatamente e criar a marcha. Uma falha de criação deve reverter o débito.

## 3. Marcha persistente

Registrar identificador, jogador, origem, destino, tropas, bônus ofensivo capturado, partida, chegada, estado e tipo. A velocidade é configurável.

```text
distancia = distanciaEntreCidades(origem, destino)
tempoViagem = distancia / velocidadeExercito
progresso = clamp((agora - partida) / (chegada - partida), 0, 1)
```

Partida e chegada são timestamps persistidos; fechar o cliente não pausa a marcha. O mapa mostra unidade, trajetória, tropas e tempo. Marcha própria e ataque inimigo têm cores distintas, sendo vermelho reservado à ameaça.

## 4. Defesa dinâmica e poderes

A defesa é lida e calculada **na chegada**, em uma transação que bloqueia a cidade. Reforços, retiradas, evolução e melhorias feitas durante a viagem devem contar.

```text
PoderAtaque = TropasAtacantes × (1 + BonusAtaque)
BonusDefesaCidade = NivelCidade × DefesaPorNivel
PoderDefesaTropas = TropasDefensoras × (1 + BonusDefesaJogador + BonusDefesaCidade)
PoderDefesaTotal = PoderDefesaTropas + PoderMuralha
RazaoCombate = PoderAtaque / PoderDefesaTotal
```

`DefesaPorNivel` inicia em `0,03` (3%). O bônus da cidade vale apenas para tropas que a defendem. Sem tropas, a muralha ainda precisa ser superada. Defesa igual a zero produz razão infinita.

- razão `> 1`: atacante vence;
- razão `<= 1`: defensor vence.

## 5. Baixas

Ambos os lados sofrem perdas. Uma curva configurável e interpolada determina as taxas, mantendo maior desgaste em confrontos equilibrados. Parâmetros iniciais:

| Razão | Baixas atacantes | Baixas defensoras |
| --- | ---: | ---: |
| 0,50 ou menos | 95% | 15% |
| 0,90 | 75% | 35% |
| 1,00 | 50% | 50% |
| 1,10 | 40% | 60% |
| 1,50 | 30% | 75% |
| 2,00 ou mais | 15% | 95% |

Entre pontos, interpolar linearmente. Arredondar para tropas inteiras e limitar as baixas ao contingente. Essa tabela é balanceamento inicial, não contrato imutável.

## 6. Resultado e retorno

### Defesa vitoriosa

A propriedade é preservada, aplicam-se as baixas e sobreviventes atacantes criam uma marcha de retorno, com duração equivalente à ida. Somente ao chegar eles são creditados na origem. Caso a origem já não pertença ao atacante, uma regra de realocação do domínio deve escolher destino válido.

### Ataque vitorioso

Aplicam-se as baixas, a propriedade muda, os sobreviventes atacantes tornam-se defensores e o nível recebe penalidade configurável:

```text
NovoNivel = max(1, NivelAtual - PenalidadeConquista)
```

A penalidade inicial é um nível.

## 7. Concorrência

Chegadas são ordenadas por `horarioChegada` e, em empate, por identificador estável. Cada batalha bloqueia a cidade, carrega seu estado corrente, resolve e persiste antes da próxima. Portanto, ataques A (12:00:01), B (12:00:03) e C (12:00:05) resolvem A, B e C, e cada um encontra o resultado do anterior. É proibido resolver todos contra um snapshot comum.

## 8. Experiência no mapa

Na chegada, o exército para diante da cidade e o cliente exibe impactos, poeira/fumaça, brilho, tremor e resumo de perdas por 2–4 segundos. Cidade ameaçada recebe alerta **ATAQUE RECEBIDO**, contagem regressiva e foco por toque. A animação nunca decide o resultado.

## 9. Relatório

Persistir e apresentar: cidade, atacante, defensor, nível antes/depois, tropas iniciais, poderes, baixas, sobreviventes, vitória/derrota e conquistada/defendida. Mudança usa `Lv.103 → Lv.102`.

## 10. Configuração obrigatória

Centralizar: velocidade, defesa por nível, fórmulas, curva de baixas, muralha, penalidade de conquista e duração da animação. Alterações de balanceamento devem ser versionadas e a batalha deve registrar a versão utilizada.

## 11. Critérios de aceite

- [ ] Validações impedem origens/destinos/tropas inválidos.
- [ ] Tropas saem da origem no envio e a marcha persiste por timestamps.
- [ ] Defesa é calculada apenas na chegada.
- [ ] Muralha defende cidade vazia.
- [ ] Razão e curva configurável geram baixas nos dois lados.
- [ ] Vitória altera imediatamente tropas, propriedade e nível.
- [ ] Derrota cria retorno não instantâneo.
- [ ] Chegadas concorrentes são sequenciais e determinísticas.
- [ ] Marcha, alerta, combate e relatório permanecem sobre o mapa.

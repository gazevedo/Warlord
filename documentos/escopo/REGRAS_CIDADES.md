# Regra de escopo — cidades

Este documento é a fonte de verdade funcional do sistema de cidades do **Warlord**. A cidade é a principal unidade territorial: território permanente, base militar, depósito de tropas, centro de produção, origem e destino de marchas, estrutura defensiva e objetivo de conquista.

A progressão ocorre pelo **nível da cidade**. Não existe, neste escopo, um conjunto tradicional de prédios individuais que precisem ser construídos e evoluídos separadamente.

## 1. Identidade e permanência

Toda cidade existe permanentemente no mapa como uma construção física 3D, nunca apenas como marcador ou ícone. Seu estado persistido contém:

- `id`, nome, proprietário e aliança;
- coordenadas no mapa;
- nível e tropas estacionadas;
- poder da muralha;
- saldo e instante da última atualização de produção;
- estado atual e estado de propriedade;
- indicador de capital;
- aparência/tier visual.

Valores derivados seguros — produção por hora, bônus defensivo, muralha, custo seguinte e tier — devem preferencialmente ser calculados a partir do nível, evitando dados duplicados e inconsistentes.

## 2. Nível da cidade

O nível representa o desenvolvimento geral e não possui um limite baixo como 20, 25 ou 30. A arquitetura deve aceitar níveis elevados (`Lv.103`, `Lv.156`) e expansão futura.

Níveis maiores significam:

- maior produção de ouro e tropas;
- maior capacidade e valor militar;
- maior bônus defensivo e poder de muralha;
- maior valor estratégico e custo de evolução;
- presença visual mais fortificada, respeitando limites de escala no mapa.

Nível e tropas são independentes: perder tropas não reduz automaticamente o nível; evoluir não transforma tropas em parte permanente do nível.

## 3. Configuração central

Todos os parâmetros numéricos pertencem a uma configuração versionada equivalente a `CityConfig`:

```text
baseUpgradeCost
upgradeGrowthFactor
baseGoldPerHour
baseTroopsPerHour
goldProductionGrowth
troopsProductionGrowth
defensePerLevel
baseWallPower
wallGrowthFactor
conquestLevelPenalty
visualTierThresholds
```

Valores iniciais propostos:

- defesa por nível: `0,03` (3%);
- penalidade por conquista: `1` nível;
- tiers visuais: `1`, `10`, `20`, `30`, `40`, `50`, `60`, `70`, `80`, `90` e `100` (máximo visual).

Fórmulas são intercambiáveis e configuráveis; nenhuma constante de balanceamento deve ficar espalhada na interface ou em regras de domínio.

## 4. Evolução por nível

### Fluxo

1. Selecionar uma cidade própria.
2. Acionar **Evoluir**.
3. Exibir nível atual e próximo, custo e benefícios.
4. Validar propriedade e recursos no estado atual.
5. Confirmar em uma operação atômica.
6. Descontar o custo, aumentar o nível, recalcular derivados e atualizar o visual.
7. Exibir feedback sobre a evolução.

Exemplo de benefícios: produção de ouro `+2,4%`, tropas `+1,8%`, defesa `+3%` e muralha `+2,1%`.

### Custo

O custo cresce de forma não linear. Fórmula inicial, substituível por configuração:

```text
UpgradeCost = BaseCost × GrowthFactor^(Level - 1)
```

A progressão deve ir de muito barata nos primeiros níveis a extremamente cara em níveis 150+. O servidor é a autoridade para custo e saldo.

### Execução imediata

Inicialmente, a evolução é instantânea. Não implementar construtor, fila, tempo de obra ou segundo construtor. Esses sistemas ficam fora do escopo até decisão posterior.

## 5. Produção contínua e offline

Cada cidade produz automaticamente ouro e tropas em taxas derivadas principalmente do nível:

```text
GoldPerHour = BaseGoldProduction × GoldProductionFunction(Level)
TroopsPerHour = BaseTroopsProduction × TroopsProductionFunction(Level)
ElapsedHours = (CurrentTime - LastProductionUpdate) / 1 hora
GoldProduced = GoldPerHour × ElapsedHours
TroopsProduced = TroopsPerHour × ElapsedHours
```

Após materializar a produção, atualizar `LastProductionUpdate = CurrentTime`. Usar timestamps, não um timer permanente por cidade. O servidor calcula o valor autoritativo; o cliente pode somente estimar a apresentação (`+125K/h`, `+32,5K/h`). Frações e arredondamento devem seguir configuração comum.

Uma cidade vazia continua produzindo normalmente e mantém proprietário, nível, muralha, bônus, posição e valor estratégico.

## 6. Tropas e função militar

Tropas estacionadas podem:

- defender a cidade;
- atacar outra cidade;
- ser transferidas;
- reforçar cidade aliada;
- receber sobreviventes de uma batalha.

Ao iniciar uma marcha, debitar imediatamente o contingente da origem. Tropas em marcha não integram a defesa. Reforços e retornos só entram na guarnição quando chegam. As regras completas de resolução estão em `REGRAS_BATALHA.md`.

## 7. Defesa e muralha

O nível beneficia somente tropas que defendem a cidade:

```text
CityDefenseBonus = Level × DefensePerLevel
```

Com `DefensePerLevel = 0,03`: Lv.10 = 30%, Lv.25 = 75%, Lv.50 = 150%, Lv.75 = 225%, Lv.100 = 300% e Lv.150 = 450%. Esse bônus nunca acompanha tropas enviadas para atacar.

A muralha possui poder separado e cresce por função configurável do nível:

```text
WallPower = WallFunction(Level)
```

Uma cidade com zero tropas ainda oferece `WallPower` e só pode ser conquistada se o atacante superar essa defesa restante.

## 8. Propriedade e ações

A propriedade define cor, informações e ações disponíveis:

| Estado | Definição | Ações principais |
| --- | --- | --- |
| `OWNED` | cidade do jogador | Evoluir, Enviar tropas, Transferir, Informações |
| `ALLY` | cidade da mesma aliança | Reforçar, Informações |
| `ENEMY` | cidade de outro jogador | Atacar, Informações |
| `NEUTRAL` | cidade sem jogador | Atacar, Informações |

Não permitir ataque comum a aliados. Cidades inimigas e aliadas mostram apenas nome, proprietário, aliança e nível. Tropas exatas, muralha e outros atributos militares inimigos ficam ocultos, salvo futura mecânica de espionagem.

A cidade própria mostra nome, nível, tropas, produção, muralha, defesa e próximo nível.

## 9. Centro do reino

Cada participante inicia com cinco vilas próximas de nível 1. Exatamente uma
delas é marcada como `CAPITAL` e representa o centro do reino.

No cenário local de validação, o jogador humano inicia ao lado de seis jogadores
bot. Os sete participantes seguem a mesma regra de cinco vilas e um centro.

O centro recebe identificação visual própria e **nunca pode ser atacado, tomado
ou ter sua propriedade alterada por batalha**. O proprietário pode transferir o
centro para qualquer outra cidade que já possua. A transferência remove a marca
da cidade anterior e a aplica atomicamente ao novo destino, garantindo que cada
participante continue com exatamente um centro.

A proteção acompanha a marca de centro: depois de uma transferência, a cidade
anterior volta a poder ser conquistada e a nova cidade torna-se protegida. Nível,
produção, defesa e muralha continuam seguindo o sistema comum de cidades.

## 10. Cidades neutras

Cidades `NEUTRAL` podem ter nível, muralha, tropas NPC, produção e posição. São conquistadas pela mesma mecânica de batalha, sem combate alternativo. Após a conquista, tornam-se `OWNED` pelo vencedor e recebem os sobreviventes atacantes.

O mundo inicial inclui vilas neutras distribuídas no entorno das regiões dos
participantes. O mapa calcula suas dimensões pela quantidade de jogadores e
adiciona novas regiões quando necessário, preservando espaço para os grupos de
cinco vilas e para futuras entradas.

## 11. Conquista

Quando o atacante vence, aplicar atomicamente:

1. remover tropas defensoras derrotadas;
2. trocar proprietário e aliança;
3. atualizar estado de propriedade, bandeira e cor;
4. colocar sobreviventes atacantes como guarnição;
5. aplicar a penalidade configurável;
6. recalcular atributos e tier visual;
7. refletir o novo estado no mapa.

```text
NewLevel = max(1, CurrentLevel - ConquestLevelPenalty)
```

Com penalidade inicial `1`, uma cidade Lv.103 torna-se Lv.102. Uma cidade Lv.1 permanece Lv.1 e troca apenas de proprietário.

## 12. Representação visual

O castelo recebe uma evolução visual a cada dez níveis, até atingir sua
representação máxima no nível 100:

| Nível da cidade | Asset visual |
| --- | --- |
| 1–9 | `city01.png` |
| 10–19 | `city10.png` |
| 20–29 | `city20.png` |
| 30–39 | `city30.png` |
| 40–49 | `city40.png` |
| 50–59 | `city50.png` |
| 60–69 | `city60.png` |
| 70–79 | `city70.png` |
| 80–89 | `city80.png` |
| 90–99 | `city90.png` |
| 100+ | `city100.png` — estágio visual máximo |

O nível funcional da cidade **não possui limite máximo**. Uma cidade pode
continuar evoluindo para os níveis 101, 150, 1.000 ou superiores, conservando o
asset `city100.png`. Produção, defesa, muralha, custos e demais valores derivados
continuam sendo recalculados normalmente; somente a progressão visual fica
limitada ao estágio do nível 100.

Não é necessário um modelo por nível. Dentro de cada faixa, o mesmo asset é
preservado. A mudança de torres, muralhas, bandeiras, altura e decoração ocorre
apenas ao atravessar cada múltiplo de dez, sem fazer cidades avançadas ocuparem
áreas enormes.

O HUD flutuante deve ser compacto e priorizar nome, nível e tropas quando permitidas. Ao selecionar, aplicar halo, destaque e ações contextuais mantendo o mapa visível; não abrir imediatamente uma tela cheia nem fazer a cidade parecer um botão sobre o mundo.

## 13. Recalcular ao mudar de nível

Toda mudança de nível recalcula:

- ouro e tropas produzidos por hora;
- bônus defensivo;
- poder da muralha;
- custo do próximo nível;
- tier visual, quando um limite de dez níveis até o nível 100 for atravessado.

Produção acumulada até o instante da mudança deve ser materializada com a taxa anterior; a nova taxa vale a partir desse instante.

## 14. Concorrência e consistência

Evolução, produção, envio de tropas e batalha devem operar com transação ou controle de versão. Cada comando recarrega proprietário, nível, recursos e tropas atuais. Uma escrita antiga nunca pode sobrescrever conquista, marcha ou evolução mais recente.

Operações críticas devem ser idempotentes para impedir evolução duplicada, coleta dupla ou débito repetido após reconexão.

## 15. Regra principal

```text
RECURSOS
→ EVOLUIR CIDADE
→ AUMENTAR NÍVEL
→ AUMENTAR PRODUÇÃO
→ AUMENTAR DEFESA E MURALHA
→ GERAR MAIS RECURSOS E TROPAS
→ PERMITIR NOVAS CONQUISTAS
```

O nível é o indicador principal do desenvolvimento territorial. Uma cidade avançada deve ser mais produtiva, defensável, valiosa, estratégica e visualmente imponente, sem depender de vários prédios ou sistemas paralelos.

## 16. Critérios de aceite

- [ ] Cidade persiste no mapa com identidade, posição, nível, tropas e muralha.
- [ ] Não existe progressão obrigatória por prédios individuais.
- [ ] Evolução valida e desconta recursos atomicamente e é inicialmente instantânea.
- [ ] Custo cresce de modo não linear e toda configuração está centralizada.
- [ ] Produção de ouro e tropas funciona offline por timestamps.
- [ ] Nível e tropas permanecem valores independentes.
- [ ] Defesa por nível só beneficia guarnições.
- [ ] Muralha defende inclusive cidades sem tropas.
- [ ] `OWNED`, `ALLY`, `ENEMY` e `NEUTRAL` controlam dados e ações.
- [ ] Cada participante inicia com cinco vilas próximas de nível 1 e exatamente um centro.
- [ ] Centro não pode ser atacado ou conquistado e pode ser transferido entre cidades do proprietário.
- [ ] Mundo inclui vilas neutras conquistáveis e expande suas dimensões conforme entram participantes.
- [ ] Conquista troca proprietário, instala sobreviventes e nunca reduz abaixo de Lv.1.
- [ ] Mudanças de nível recalculam todos os derivados e o tier quando necessário.
- [ ] Seleção mantém a cidade integrada ao mundo e o mapa visível.

# Manual da cidade — lógica militar e econômica

A cidade é simultaneamente base militar, território conquistável e núcleo econômico. Este manual explica como os sistemas existentes devem se relacionar; ele não redefine cadastro, mapa, níveis ou jogadores.

## 1. Visão geral

Cada cidade mantém proprietário, nível, guarnição, muralha, bônus, recursos, capacidade de armazenamento e produção. Toda alteração relevante deve ser persistida no estado da cidade e refletida imediatamente no mapa.

## 2. Lógica militar

### Guarnição

Tropas estacionadas defendem a cidade e podem iniciar marchas. Ao enviar um exército, o contingente é debitado imediatamente. Tropas em marcha não podem defender, ser gastas nem ser enviadas novamente.

### Nível e muralha

O nível concede inicialmente 3% de defesa por nível às tropas defensoras. A muralha soma poder independente à defesa, inclusive se a guarnição estiver vazia. Melhorias concluídas antes da chegada inimiga entram no cálculo; melhorias posteriores não alteram batalha já resolvida.

### Reforços e retornos

Reforços só integram a guarnição ao chegar. Sobreviventes de uma derrota ofensiva retornam fisicamente e só voltam a ficar disponíveis no fim da marcha. Marchas devem indicar origem, destino, contingente e tempo.

### Conquista

Quando o ataque vence, a cidade muda de proprietário, perde inicialmente um nível e recebe os sobreviventes como nova guarnição. Produção, acesso e identificação visual devem mudar de forma atômica com a conquista.

## 3. Lógica econômica

### Produção

A economia deve usar taxas configuráveis por recurso. A quantidade disponível é derivada do último instante de coleta:

```text
producaoAcumulada = taxaPorHora × horasDecorridas
disponivel = min(capacidade, saldoAnterior + producaoAcumulada)
```

A produção é baseada em timestamps, portanto continua offline. O servidor é autoridade sobre saldo, capacidade e tempo; o cliente apenas estima e apresenta.

### Armazenamento e coleta

Cada recurso possui saldo e limite. Produção excedente à capacidade não é acumulada. Coleta e gasto devem ser operações atômicas, impedindo saldo negativo ou coleta duplicada.

### Custos e evolução

Treinamento, muralha e evolução consomem recursos conforme tabelas centralizadas. Antes de iniciar, validar saldo, pré-requisitos, fila e propriedade. O custo é debitado na confirmação; cancelamento segue uma política de reembolso configurável. Ao concluir uma evolução, atualizar nível, capacidade, produção, muralha e tier visual aplicáveis.

### Efeito da guerra

- Tropas em marcha deixam de compor a defesa, mas não alteram produção.
- Conquista transfere a cidade e sua produção futura ao novo proprietário.
- Recursos armazenados após conquista seguem uma política configurável de preservação/saque; nenhuma porcentagem deve ficar fixa na interface.
- A penalidade de nível pode reduzir capacidades derivadas assim que a conquista é confirmada.

## 4. Consistência e concorrência

Operações econômicas e militares sobre a mesma cidade devem usar transações/controle de versão. Antes de gastar, enviar tropas ou resolver combate, recarregar o estado atual. Uma operação com versão antiga deve ser repetida ou rejeitada, nunca sobrescrever mudanças mais recentes.

## 5. Interface

O mapa continua visível. A etiqueta apresenta somente nome, nível, proprietário/aliança e tropas quando necessário. Seleção abre ações compactas. Alertas de falta de recursos, fila, reforço ou ataque aparecem como camadas flutuantes, sem transformar a experiência em dashboard.

## 6. Boas práticas do jogador

- Mantenha guarnição compatível com o nível e a muralha.
- Não envie todas as tropas se houver ameaça próxima.
- Use o tempo de marcha inimigo para reforçar ou evoluir a defesa.
- Colete antes de atingir a capacidade máxima.
- Planeje recursos para não interromper treinamento e evolução.

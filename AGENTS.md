# Fluxo padrão de alterações

Estas regras se aplicam a todo o repositório.

## Para qualquer alteração

1. Faça uma alteração pequena e coesa.
2. Execute as verificações apropriadas e registre o resultado.
3. Revise `git diff` e confirme que somente os arquivos esperados foram alterados.
4. Crie um commit imediatamente após a alteração validada, com uma mensagem objetiva.
5. Envie o commit para o remoto com `git push` antes de iniciar outra alteração.
6. Não acumule alterações independentes no mesmo commit.

## Para alterações de design

1. Inicie a aplicação localmente e abra a tela alterada no navegador.
2. Gere um novo print da interface depois da alteração e antes do commit.
3. Confira visualmente o print em pelo menos um viewport representativo.
4. Inclua no commit o código, os assets e o print atualizado.
5. Faça `git push` logo após o commit.

## Ordem obrigatória

- Alteração funcional: **alterar → testar → revisar → commit → push**.
- Alteração de design: **alterar → testar → print → revisar → commit → push**.

Se não houver remoto configurado ou o push falhar por limitação do ambiente, registre isso explicitamente no relatório final e não afirme que o push foi concluído.

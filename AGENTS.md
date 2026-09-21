# Fluxo padrão de alterações

Estas regras se aplicam a todo o repositório.

## Branch obrigatória

1. Trabalhe, faça commits e envie alterações somente pela branch `main`.
2. Não crie nem publique branches auxiliares como `work`, `feature/*` ou similares.
3. Se uma alteração já estiver em outra branch, faça o merge em `main`, valide o resultado, envie `main` e remova a branch auxiliar.
4. Antes de começar, confirme a branch com `git branch --show-current`; se não for `main`, volte para `main` antes de editar.

## Para qualquer alteração

1. Faça uma alteração pequena e coesa.
2. Execute as verificações apropriadas e registre o resultado.
3. Revise `git diff` e confirme que somente os arquivos esperados foram alterados.
4. Crie um commit imediatamente após a alteração validada, com uma mensagem objetiva.
5. Envie o commit para `origin/main` com `git push origin main` antes de iniciar outra alteração.
6. Não acumule alterações independentes no mesmo commit.

## Para alterações de design

1. Inicie a aplicação localmente e abra a tela alterada no navegador.
2. Antes de gerar o print, remova capturas alternativas ou versionadas da mesma tela (`-v2`, `-v3` e similares).
3. Gere o novo print depois da alteração, substituindo a captura canônica existente em vez de criar outra versão.
4. Confira visualmente o print em pelo menos um viewport representativo.
5. Inclua no commit o código, os assets e somente o print canônico atualizado.
6. Faça `git push origin main` logo após o commit.

## Ordem obrigatória

- Alteração funcional: **alterar → testar → revisar → commit → push**.
- Alteração de design: **alterar → testar → print → revisar → commit → push**.

Se não houver remoto configurado ou o push falhar por limitação do ambiente, registre isso explicitamente no relatório final e não afirme que o push foi concluído.

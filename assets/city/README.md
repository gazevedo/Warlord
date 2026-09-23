# Temas visuais de cidade

Cada pasta dentro deste diretório representa um tema visual completo de cidade.
O tema inicial é `city_blue` e é registrado como `blue` em
`city-assets.js`.

Um tema deve fornecer os mesmos onze arquivos PNG transparentes:

```text
city01.png
city10.png
city20.png
city30.png
city40.png
city50.png
city60.png
city70.png
city80.png
city90.png
city100.png
```

Cada arquivo representa uma faixa de dez níveis. `city100.png` é o estágio
visual máximo e continua sendo usado acima do nível 100; o nível funcional da
cidade permanece ilimitado.

Para adicionar outro tema, crie uma pasta irmã com esse conjunto e registre seu
diretório em `THEMES`. O campo `theme` da cidade seleciona o conjunto visual do
usuário sem interferir em nível, propriedade, combate ou qualquer outra regra do
jogo.

# Kit raster da região piloto

Este diretório contém a primeira biblioteca visual do mapa. Todos os elementos
de cenário são WebP rasterizados, compartilham perspectiva elevada 3/4, contorno
suave, luz superior esquerda e sombra projetada para a direita.

O kit inclui cidades, vilas, fazendas, pontes, nuvens, estruturas especiais e
exércitos reutilizáveis. A vegetação do mapa usa os biomas de
`assets/vegetation/`; a base usa os tiles de `assets/terrain/`.

Os arquivos são reproduzíveis com:

```sh
python tools/generate_map_assets.py
```

O script renderiza em resolução dupla, aplica variação de pigmento em baixa
frequência e veladuras localizadas, e reduz a arte com antialiasing antes de
gravar os WebP finais. O CSS do jogo posiciona e anima esses assets; ele não
desenha montanhas, árvores, cidades, pontes, pedras, fazendas ou tropas.

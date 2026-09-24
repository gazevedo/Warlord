# Kit raster da região piloto

Este diretório contém a primeira biblioteca visual do mapa. Todos os elementos
de cenário são WebP rasterizados, compartilham perspectiva elevada 3/4, contorno
suave, luz superior esquerda e sombra projetada para a direita.

O kit inclui cinco cordilheiras, seis agrupamentos de floresta, sete cidades,
treze elementos de decoração e dois exércitos. A base do mundo não faz mais
parte deste kit: ela é montada dinamicamente com os tiles raster disponíveis em
`assets/map/terrain/`.

Os arquivos são reproduzíveis com:

```sh
python tools/generate_map_assets.py
```

O script renderiza em resolução dupla, aplica variação de pigmento em baixa
frequência e veladuras localizadas, e reduz a arte com antialiasing antes de
gravar os WebP finais. O CSS do jogo posiciona e anima esses assets; ele não
desenha montanhas, árvores, cidades, pontes, pedras, fazendas ou tropas.

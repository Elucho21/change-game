#!/usr/bin/env bash
# Extrae un PNG por escena del MP4 final (momento en que la escena ya "asento").
set -euo pipefail
cd "$(dirname "$0")/.."
IN=output/gv-moneyhouse-reel.mp4
mkdir -p output/frames
declare -a T=("1.6:01-cuatro-dias" "5.7:02-una-casa" "8.3:03-gv-moneyhouse" "12.6:04-fechas" "15.6:05-marcas" "21.5:06-dinamicas" "25.5:07-gran-final" "28.8:08-cta")
for e in "${T[@]}"; do
  ffmpeg -y -loglevel error -ss "${e%%:*}" -i "$IN" -frames:v 1 "output/frames/${e#*:}.png"
done
ls output/frames

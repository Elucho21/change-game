// Recomprime las texturas del globo (public/earth-*.{jpg,png}) a WebP.
// Se corre a mano cuando cambian los assets, no en cada build: no vale la
// pena depender de sharp en el pipeline de deploy por dos archivos que casi
// nunca cambian.
import sharp from 'sharp';
import { stat } from 'node:fs/promises';
import path from 'node:path';

const PUBLIC_DIR = path.join(import.meta.dirname, '..', 'public');
const TARGETS = ['earth-night.jpg', 'earth-topology.png'];

for (const file of TARGETS) {
  const src = path.join(PUBLIC_DIR, file);
  const dest = src.replace(/\.(jpg|png)$/, '.webp');
  const before = (await stat(src)).size;
  await sharp(src).webp({ quality: 82 }).toFile(dest);
  const after = (await stat(dest)).size;
  console.log(`${file} -> ${path.basename(dest)}: ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB`);
}

console.log('\nListo. Actualizar GlobeView.tsx para usar los .webp y borrar los .jpg/.png viejos.');

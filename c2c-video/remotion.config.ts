import {Config} from '@remotion/cli/config';
import fs from 'node:fs';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');

// Si hay un Chromium local (ej. REMOTION_BROWSER o el de Playwright), usarlo
// en vez de descargar chrome-headless-shell.
const localBrowser =
  process.env.REMOTION_BROWSER ??
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
if (fs.existsSync(localBrowser)) {
  Config.setBrowserExecutable(localBrowser);
}

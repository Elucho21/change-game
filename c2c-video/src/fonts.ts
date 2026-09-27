import {continueRender, delayRender, staticFile} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Poppins';

export const WEIGHTS = ['300', '400', '500', '600', '700', '800'] as const;

/**
 * Poppins 300–800.
 * Por defecto se carga con @remotion/google-fonts.
 * Con REMOTION_FONTS=local usa las copias de /public/fonts (render offline o
 * detrás de un proxy que el Chromium de render no acepta).
 */
const loadLocalPoppins = (): string => {
  const family = 'Poppins';
  if (typeof FontFace === 'undefined') return family;
  const handle = delayRender('Cargando Poppins local');
  Promise.all(
    WEIGHTS.map((w) => {
      const face = new FontFace(family, `url(${staticFile(`fonts/poppins-${w}.woff2`)}) format('woff2')`, {
        weight: w,
        style: 'normal',
      });
      document.fonts.add(face);
      return face.load();
    }),
  )
    .then(() => continueRender(handle))
    .catch((err: unknown) => {
      console.error(err);
      continueRender(handle);
    });
  return family;
};

export const fontFamily: string =
  process.env.REMOTION_FONTS === 'local'
    ? loadLocalPoppins()
    : loadFont('normal', {weights: [...WEIGHTS], subsets: ['latin', 'latin-ext']}).fontFamily;

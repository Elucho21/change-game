import { configDefaults, defineConfig } from 'vitest/config';

// Las skills de HyperFrames (.agents, .claude) y los proyectos de video traen
// sus propios *.test.mjs, que no son tests del juego.
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '.agents/**', '.claude/**', 'videos/**'],
  },
});

import path from 'node:path';
import {defineConfig} from 'vite';
import eslint from 'vite-plugin-eslint';
import webExtension, {readJsonFile} from 'vite-plugin-web-extension';

function generateManifest() {
  const manifest = readJsonFile('src/manifest.json');
  const pkg = readJsonFile('package.json');
  return {
    name: pkg.name,
    description: pkg.description,
    version: pkg.version,
    author: pkg.author,
    homepage_url: pkg.homepage,
    ...manifest,
  };
}

const browser = process.env.BROWSER ?? 'chrome';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: path.join(__dirname, 'dist', browser),
    emptyOutDir: true,
  },
  plugins: [
    eslint(),
    webExtension({
      disableAutoLaunch: true,
      manifest: generateManifest,
      browser,
    }),
  ],
});

import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    entry: 'src/index.ts',
    platform: 'node',
    dts: true,
    minify: false,
    target: 'node22',
    exports: true,
  },
]);

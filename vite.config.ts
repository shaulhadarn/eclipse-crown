import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      // three.js changes rarely, so a separate chunk stays cached between game updates.
      output: { manualChunks: { three: ['three'] } },
    },
    chunkSizeWarningLimit: 700,
  },
});

import { build } from 'vite';

// Compile the actual lab entry without editing production/Vite configuration.
await build({ build: { outDir: 'outputs/redesign/r4.1/lab-build', emptyOutDir: false,
  rollupOptions: { input: '3d-lab.html' } } });

import { build, preview } from 'vite';

// Freeze this shared checkout for QA: concurrent HMR must not restart assertions.
const outDir = 'outputs/task-3.10/site';
await build({ build: { outDir, rollupOptions: { input: ['index.html', 'outputs/task-3.10/qa.html'] } } });
await preview({ build: { outDir }, preview: { host: '127.0.0.1', port: 5184, strictPort: true, open: false } });
console.log('QA ready: http://127.0.0.1:5184/outputs/task-3.10/qa.html');

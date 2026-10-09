import { build, preview } from 'vite';
const outDir = 'outputs/task-3.5/site';
await build({ build: { outDir, rollupOptions: { input: ['index.html', 'outputs/task-3.5/qa.html'] } } });
await preview({ build: { outDir }, preview: { host: '127.0.0.1', port: 5185, strictPort: true, open: false } });
console.log('QA ready: http://127.0.0.1:5185/outputs/task-3.5/qa.html');

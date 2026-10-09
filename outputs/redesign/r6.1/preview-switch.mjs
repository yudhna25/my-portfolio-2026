import fs from 'node:fs';
import assert from 'node:assert/strict';
const file='src/App.jsx',mode=process.argv[2],prefix="import Edura from '@/components/pages/Edura';\n";
const suffix="\n// R6.1 temporary preview in the existing App entry; removed before handoff.\nexport default function App() {\n  return new URLSearchParams(window.location.search).get('reader-preview') === 'edura'\n    ? <Edura onReturn={() => { window.__readerReturnClicks = (window.__readerReturnClicks ?? 0) + 1; }} />\n    : <PortfolioApp />;\n}\n";
let code=fs.readFileSync(file,'utf8');
if(mode==='on'){
  assert(!code.includes('R6.1 temporary preview'));assert(code.includes('export default function App()'));
  code=prefix+code.replace('export default function App()','function PortfolioApp()')+suffix;
}else if(mode==='off'){
  assert(code.startsWith(prefix));assert(code.endsWith(suffix));
  code=code.slice(prefix.length,-suffix.length).replace('function PortfolioApp()','export default function App()');
  assert.equal(code,fs.readFileSync('outputs/redesign/r6.1/before/src/App.jsx','utf8'));
}else throw new Error('Use on/off');
fs.writeFileSync(file,code);console.log(mode==='on'?'Temporary reader preview enabled in existing App':'Preview removed; App exact baseline restored');

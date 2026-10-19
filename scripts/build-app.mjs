// 把網頁版整理成 App 版放進 www/（Capacitor 從這裡打包）。
// 網頁版（GitHub Pages）維持原樣；App 版差異：
//   1. 不連 Google Fonts，改用 app-shell/ 內建字型
//   2. 不註冊 service worker（App 本身就離線可用）
//   3. 不帶測試檔
import { rmSync, mkdirSync, cpSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';

const OUT = 'www';
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);

const rootFiles = readdirSync('.').filter(
  (f) => (f.endsWith('.js') && !f.endsWith('.test.js') && f !== 'sw.js') || f === 'styles.css'
);
for (const f of rootFiles) cpSync(f, `${OUT}/${f}`);
for (const dir of ['assets', 'icons']) cpSync(dir, `${OUT}/${dir}`, { recursive: true });
cpSync('app-shell/fonts', `${OUT}/fonts`, { recursive: true });
cpSync('app-shell/app-fonts.css', `${OUT}/app-fonts.css`);

let html = readFileSync('index.html', 'utf8');
const before = html;
html = html.replace(/^.*fonts\.(googleapis|gstatic)\.com.*\n/gm, '');
html = html.replace(
  /(<link rel="stylesheet" href="styles\.css[^"]*">)/,
  '<link rel="stylesheet" href="app-fonts.css">\n$1'
);
html = html.replace(/^.*<link rel="manifest"[^>]*>\n/m, '');
html = html.replace(/<script>\s*if \('serviceWorker' in navigator\)[\s\S]*?<\/script>\n?/, '');
if (html === before) throw new Error('index.html 沒有任何替換，結構可能改過了，請檢查 build-app.mjs');
writeFileSync(`${OUT}/index.html`, html);

console.log(`App 版已輸出到 ${OUT}/（${rootFiles.length} 個根目錄檔 + assets、icons、fonts）`);

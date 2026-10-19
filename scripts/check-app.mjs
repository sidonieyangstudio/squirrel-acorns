// App 版送審前檢查：不能有外連、追蹤碼、service worker，必要檔案要在。
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'www';
const problems = [];

const required = ['index.html', 'app.js', 'styles.css', 'app-fonts.css', 'fonts/ChironGoRoundTC.woff2', 'fonts/OFL.txt'];
for (const f of required) if (!existsSync(join(OUT, f))) problems.push(`缺少必要檔案：${f}`);

const banned = [
  [/fonts\.(googleapis|gstatic)\.com/, 'Google Fonts 外連'],
  [/googletagmanager|google-analytics|gtag\(/, 'Google 追蹤碼'],
  [/connect\.facebook\.net|fbq\(/, 'Meta 追蹤碼'],
  [/serviceWorker\.register/, 'service worker 註冊'],
  [/<(script|link|img|iframe)[^>]+(src|href)=["']https?:\/\//, '外部資源載入'],
];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(html|css|js)$/.test(name)) {
      const text = readFileSync(p, 'utf8');
      for (const [re, label] of banned) if (re.test(text)) problems.push(`${p}：發現${label}`);
    }
  }
}
if (existsSync(OUT)) walk(OUT);
else problems.push('還沒有 www/，請先跑 npm run build:app');

if (problems.length) {
  console.log('App 版檢查沒過：\n- ' + problems.join('\n- '));
  process.exit(1);
}
console.log('App 版檢查通過：無外連、無追蹤碼、無 service worker，必要檔案齊全');

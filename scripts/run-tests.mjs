// 一次跑完根目錄所有 *.test.js，任何一個失敗就整體失敗。
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const tests = readdirSync('.').filter((f) => f.endsWith('.test.js')).sort();
let failed = 0;
for (const t of tests) {
  const r = spawnSync(process.execPath, [t], { stdio: 'pipe', encoding: 'utf8' });
  if (r.status === 0) {
    console.log(`PASS ${t}`);
  } else {
    failed++;
    console.log(`FAIL ${t}\n${r.stdout}${r.stderr}`);
  }
}
console.log(`\n${tests.length - failed}/${tests.length} 個測試檔通過`);
process.exit(failed ? 1 : 0);

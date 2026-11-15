// 網頁版的版本號（index.html 的 app-version）要跟 iOS App 的 MARKETING_VERSION 一樣。
// 為什麼：每天有程式拿網頁版版本號跟 App Store 比對，兩邊寫的不一樣就會誤報（2026-11-15 Sidonie 要求網頁版與 App 對齊）。
// 改版時兩個地方一起改：index.html 的 <meta name="app-version">、Xcode 專案的 MARKETING_VERSION。
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');

test('網頁版版本號跟 iOS App 版本號一樣', () => {
  const html = readFileSync('index.html', 'utf8');
  const web = html.match(/<meta name="app-version" content="([^"]+)">/);
  assert.ok(web, 'index.html 少了 <meta name="app-version">');
  const pbx = readFileSync('ios/App/App.xcodeproj/project.pbxproj', 'utf8');
  const ios = [...new Set([...pbx.matchAll(/MARKETING_VERSION = ([^;]+);/g)].map((m) => m[1].trim()))];
  assert.equal(ios.length, 1, `Xcode 專案的 MARKETING_VERSION 不只一種：${ios.join(', ')}`);
  assert.equal(web[1], ios[0], `網頁版 ${web[1]} 跟 App ${ios[0]} 不一樣`);
});

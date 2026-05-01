# 松鼠點數收集 PWA

歐的樂星球 · 給孩子的習慣養成 PWA。把這個 `pwa/` 資料夾整包丟到任何靜態主機就能跑。

## 檔案結構

```
pwa/
├── index.html          # 主頁（三個畫面：今日清單 / 獎勵 / 解鎖撒花）
├── styles.css          # 樣式
├── app.js              # 全部邏輯（state / CRUD / localStorage）
├── manifest.json       # PWA manifest
├── sw.js               # service worker（cache-first 離線）
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icon-maskable-512.png
└── assets/
    ├── squirrel-normal.svg
    ├── squirrel-happy.svg
    └── squirrel-cheer.svg
```

## 本機跑起來

PWA 需要走 HTTP（不能直接 `file://`），任選一個：

```bash
cd pwa
python3 -m http.server 8080
# 然後手機連到 http://<電腦 IP>:8080
```

或：

```bash
npx serve pwa
```

## 加到 iPhone 主畫面

1. iPhone Safari 開頁面（**HTTPS** 才能 install；本機測試用 ngrok / Cloudflare Tunnel）
2. 分享 → 加到主畫面
3. 開啟後就是全螢幕、無瀏覽器列、橘色 status bar

## 資料儲存

所有狀態存在 `localStorage`，key 是 `squirrel-points-v1`：

```js
{
  userName: '小寶',
  habits: [{ id, title, icon, points }, ...],
  rewards: [{ id, title, icon, cost }, ...],
  points: 23,                       // 累積總橡實
  log: { '2025-05-01': { habitId: true, ... } },
  streak: 3,
  lastActiveDate: '2025-05-01'
}
```

清掉重來：DevTools → Application → Local Storage → 刪除該 key。

## 功能

- ✅ 新增 / 編輯 / 刪除習慣（5–10 個，圖示 16 選 1，1–20 點）
- ✅ 新增 / 編輯 / 刪除獎勵（含點數門檻）
- ✅ 勾選習慣 → 累積橡實（取消勾選會扣回去）
- ✅ 點數 ≥ 門檻 → 卡片變橘色「已解鎖」狀態，按兌換 → 自動撒花畫面
- ✅ 連續天數計算（lastActiveDate 比對）
- ✅ Service Worker 離線可用
- ✅ iOS Safe Area / standalone display

## 給 Claude Code 的後續工作建議

1. **資料同步**：目前純 localStorage；可以加 Supabase / Firebase auth + cloud sync
2. **多帳號 / 家庭模式**：一個家長帳號管理多個小孩
3. **每日重置邏輯**：目前點數是累積的，可加「每日歸零」或「每週結算」模式
4. **通知**：iOS PWA 從 16.4 起支援 Web Push，可加「該勾選了！」提醒
5. **歷史紀錄畫面**：state.log 已有完整資料，可加月曆視覺化
6. **音效**：勾選 / 解鎖時播音
7. **測試**：可改寫成 React + Vite + Vitest，把 app.js 拆成 hooks

---

設計系統：見 `../Design System.html`
原始三畫面設計稿：見 `../App Screens.html`

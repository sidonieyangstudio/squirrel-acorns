/* Backup / restore helper shared by the app and tests.
   備份檔不含家長密碼與秘密題答案：檔案可能被傳來傳去，還原時保留這台裝置原本的家長設定。 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.SquirrelBackup = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const APP_ID = 'squirrel-acorns';
  const FORMAT = 1;
  const NOT_BACKUP = '這個檔案不是松鼠橡實的備份檔，請重新選擇。';

  function buildBackup(appState, now) {
    return {
      app: APP_ID,
      format: FORMAT,
      exportedAt: now.toISOString(),
      data: {
        version: appState.version,
        activeChildId: appState.activeChildId,
        children: structuredClone(appState.children || [])
      }
    };
  }

  function parseBackup(text) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return { ok: false, error: NOT_BACKUP };
    }
    if (!parsed || parsed.app !== APP_ID || !parsed.data) return { ok: false, error: NOT_BACKUP };
    if (parsed.format !== FORMAT) {
      return { ok: false, error: '這個備份檔是比較新的版本做的，請先把松鼠橡實更新到最新版再還原。' };
    }
    const children = parsed.data.children;
    if (!Array.isArray(children) || !children.length || children.some(c => !c || typeof c !== 'object' || !c.id)) {
      return { ok: false, error: '備份檔內容不完整，沒辦法還原。' };
    }
    const activeChildId = children.some(c => c.id === parsed.data.activeChildId)
      ? parsed.data.activeChildId
      : children[0].id;
    return {
      ok: true,
      exportedAt: parsed.exportedAt || '',
      childCount: children.length,
      data: { version: parsed.data.version, activeChildId, children }
    };
  }

  function backupFileName(date) {
    const d = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return `松鼠橡實備份-${d}.json`;
  }

  return { buildBackup, parseBackup, backupFileName };
});

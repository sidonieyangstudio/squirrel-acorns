/* 首頁松鼠表情：依今天任務完成進度換圖。shared by the app and tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.SquirrelMood = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function squirrelMood(done, total) {
    if (!total) return 'normal';
    if (done >= total) return 'happy';
    if (done === 0) return 'wave';
    if (done * 2 >= total) return 'proud';
    return 'normal';
  }
  return { squirrelMood };
});

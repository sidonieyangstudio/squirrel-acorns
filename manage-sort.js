/* Manage-list sorting helpers shared by the app and tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.SquirrelManageSort = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function shouldCancelLongPress(deltaY, threshold) {
    return Math.abs(deltaY) > threshold;
  }

  return { shouldCancelLongPress };
});

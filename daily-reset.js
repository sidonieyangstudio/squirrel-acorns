/* Daily rollover helper shared by the app and tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.SquirrelDailyReset = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function createDayRolloverTracker(getDay, onChange) {
    let currentDay = getDay();
    return {
      check() {
        const nextDay = getDay();
        if (nextDay === currentDay) return false;
        const previousDay = currentDay;
        currentDay = nextDay;
        onChange(nextDay, previousDay);
        return true;
      }
    };
  }

  return { createDayRolloverTracker };
});

/* After-school alarm helpers shared by the app and tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.SquirrelAfterSchoolAlarm = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function clockMinutes(text) {
    if (!text || !/^\d{2}:\d{2}$/.test(text)) return null;
    const [h, m] = text.split(':').map(Number);
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return h * 60 + m;
  }

  function isReminderDue(reminderTime, now = new Date()) {
    const target = clockMinutes(reminderTime);
    if (target === null) return false;
    return now.getHours() * 60 + now.getMinutes() >= target;
  }

  function isSnoozeDue(entry, nowMs = Date.now()) {
    return !!(entry && entry.snoozeUntil && nowMs >= entry.snoozeUntil);
  }

  function nextAlarmPhase(plan, log, daily, isPhaseDone, now = new Date(), nowMs = Date.now()) {
    return plan.find(phase => {
      if (!phase || (phase.id !== 'ticket' && phase.id !== 'evening')) return false;
      if (!phase.reminderTime || isPhaseDone(phase, log)) return false;
      const entry = daily && daily[phase.id];
      if (entry === true) return false;
      if (entry && entry.dismissed) return false;
      if (entry && entry.active) return true;
      if (isSnoozeDue(entry, nowMs)) return true;
      if (entry && entry.snoozeUntil) return false;
      return isReminderDue(phase.reminderTime, now);
    }) || null;
  }

  function resolveAlarmPhaseId(activeId, plan, log, daily, isPhaseDone, now = new Date(), nowMs = Date.now()) {
    if (activeId) return activeId;
    const activeEntry = Object.entries(daily || {}).find(([, entry]) => entry && entry.active);
    if (activeEntry) return activeEntry[0];
    const phase = nextAlarmPhase(plan, log, daily, isPhaseDone, now, nowMs);
    return phase ? phase.id : null;
  }

  function toggleAlarmReady(isReady) {
    return !isReady;
  }

  return { clockMinutes, isReminderDue, isSnoozeDue, nextAlarmPhase, resolveAlarmPhaseId, toggleAlarmReady };
});

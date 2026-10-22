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

  // App 版手機通知：算出接下來要排哪些通知（時間全在手機上，不連網）。
  // children：[{ plan, todayLog, todayDaily }]，每個孩子各自的放學設定與今天紀錄。
  // 今天：已完成、已按「知道了」、已在 App 內響過、或時間已過，就不排；按過「等 5 分鐘」就排在那個時間。
  // 之後幾天：照提醒時間排。iOS 最多同時排 64 則，所以只留最早的 limit 則。
  const NATIVE_ID_BASE = 1000;

  function planNativeReminders(children, isPhaseDone, now = new Date(), days = 14, limit = 60) {
    const nowMs = now.getTime();
    const items = [];
    (children || []).forEach((child, childIndex) => {
      const plan = (child && child.plan) || [];
      const daily = (child && child.todayDaily) || {};
      ['ticket', 'evening'].forEach((phaseId, phaseIndex) => {
        const phase = plan.find(item => item && item.id === phaseId);
        const minutes = phase ? clockMinutes(phase.reminderTime) : null;
        if (minutes === null) return;
        for (let day = 0; day < days; day++) {
          const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + day, Math.floor(minutes / 60), minutes % 60).getTime();
          let fireAt = at;
          if (day === 0) {
            if (isPhaseDone(phase, child.todayLog || {})) continue;
            const entry = daily[phaseId];
            if (entry === true || (entry && (entry.dismissed || entry.active))) continue;
            if (entry && entry.snoozeUntil) fireAt = entry.snoozeUntil;
          }
          if (fireAt <= nowMs) continue;
          items.push({
            id: NATIVE_ID_BASE + childIndex * 100 + day * 2 + phaseIndex,
            childIndex,
            phaseId,
            at: fireAt
          });
        }
      });
    });
    return items.sort((a, b) => a.at - b.at).slice(0, limit);
  }

  function isNativeReminderId(id) {
    return Number.isInteger(id) && id >= NATIVE_ID_BASE;
  }

  return {
    clockMinutes, isReminderDue, isSnoozeDue, nextAlarmPhase, resolveAlarmPhaseId, toggleAlarmReady,
    planNativeReminders, isNativeReminderId
  };
});

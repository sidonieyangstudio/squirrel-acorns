const test = require('node:test');
const assert = require('node:assert/strict');

const { nextAlarmPhase } = require('./after-school-alarm.js');

const plan = [
  { id: 'ticket', title: '遊戲機門票', reminderTime: '18:15', tasks: [{ id: 'story' }] },
  { id: 'evening', title: '晚上整理', reminderTime: '20:15', tasks: [{ id: 'brush' }] }
];

const notDone = () => false;

test('finds the first due after-school alarm phase', () => {
  const due = nextAlarmPhase(plan, {}, {}, notDone, new Date('2026-05-06T18:16:00'), 1000);
  assert.equal(due.id, 'ticket');
});

test('does not repeat a dismissed alarm', () => {
  const due = nextAlarmPhase(plan, {}, { ticket: { dismissed: true } }, notDone, new Date('2026-05-06T18:30:00'), 1000);
  assert.equal(due, null);
});

test('keeps an active alarm visible until the user responds', () => {
  const due = nextAlarmPhase(plan, {}, { ticket: { active: true } }, notDone, new Date('2026-05-06T18:30:00'), 1000);
  assert.equal(due.id, 'ticket');
});

test('fires snoozed alarm only after snooze time', () => {
  const before = nextAlarmPhase(plan, {}, { ticket: { snoozeUntil: 2000 } }, notDone, new Date('2026-05-06T18:30:00'), 1500);
  const after = nextAlarmPhase(plan, {}, { ticket: { snoozeUntil: 2000 } }, notDone, new Date('2026-05-06T18:30:00'), 2500);

  assert.equal(before, null);
  assert.equal(after.id, 'ticket');
});

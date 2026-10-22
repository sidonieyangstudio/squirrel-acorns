const test = require('node:test');
const assert = require('node:assert/strict');

const { nextAlarmPhase, resolveAlarmPhaseId, toggleAlarmReady } = require('./after-school-alarm.js');

const plan = [
  { id: 'ticket', title: '桌遊門票', reminderTime: '18:15', tasks: [{ id: 'story' }] },
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

test('recovers the alarm phase when a visible overlay lost its active id', () => {
  const phaseId = resolveAlarmPhaseId(null, plan, {}, { ticket: { active: true } }, notDone, new Date('2026-05-06T18:30:00'), 1000);

  assert.equal(phaseId, 'ticket');
});

test('toggles alarm sound on and off from the same button', () => {
  assert.equal(toggleAlarmReady(false), true);
  assert.equal(toggleAlarmReady(true), false);
});

const { planNativeReminders, isNativeReminderId } = require('./after-school-alarm.js');
const at = (s) => new Date(s).getTime();
const child = (extra = {}) => ({ plan, todayLog: {}, todayDaily: {}, ...extra });

test('native reminders: schedules today and the following days at the reminder times', () => {
  const list = planNativeReminders([child()], notDone, new Date('2026-05-06T15:00:00'), 3);
  assert.deepEqual(list.map(item => [item.phaseId, item.at]), [
    ['ticket', at('2026-05-06T18:15:00')],
    ['evening', at('2026-05-06T20:15:00')],
    ['ticket', at('2026-05-07T18:15:00')],
    ['evening', at('2026-05-07T20:15:00')],
    ['ticket', at('2026-05-08T18:15:00')],
    ['evening', at('2026-05-08T20:15:00')]
  ]);
  assert.equal(new Set(list.map(item => item.id)).size, list.length);
  assert.ok(list.every(item => isNativeReminderId(item.id)));
});

test('native reminders: skips times that already passed today', () => {
  const list = planNativeReminders([child()], notDone, new Date('2026-05-06T19:00:00'), 1);
  assert.deepEqual(list.map(item => item.phaseId), ['evening']);
});

test('native reminders: skips today when the phase is already done, keeps tomorrow', () => {
  const ticketDone = (phase) => phase.id === 'ticket';
  const list = planNativeReminders([child()], ticketDone, new Date('2026-05-06T15:00:00'), 2);
  assert.deepEqual(list.map(item => [item.phaseId, item.at]), [
    ['evening', at('2026-05-06T20:15:00')],
    ['ticket', at('2026-05-07T18:15:00')],
    ['evening', at('2026-05-07T20:15:00')]
  ]);
});

test('native reminders: dismissed or already-rung alarms are not scheduled again today', () => {
  const daily = { ticket: { dismissed: true }, evening: { active: true } };
  const list = planNativeReminders([child({ todayDaily: daily })], notDone, new Date('2026-05-06T15:00:00'), 1);
  assert.deepEqual(list, []);
});

test('native reminders: a snoozed alarm is scheduled at the snooze time', () => {
  const snoozeUntil = at('2026-05-06T18:20:00');
  const list = planNativeReminders([child({ todayDaily: { ticket: { snoozeUntil } } })], notDone, new Date('2026-05-06T18:16:00'), 1);
  assert.deepEqual(list.map(item => [item.phaseId, item.at]), [['ticket', snoozeUntil], ['evening', at('2026-05-06T20:15:00')]]);
});

test('native reminders: a cleared reminder time schedules nothing for that phase', () => {
  const noTicket = [{ ...plan[0], reminderTime: '' }, plan[1]];
  const list = planNativeReminders([child({ plan: noTicket })], notDone, new Date('2026-05-06T15:00:00'), 1);
  assert.deepEqual(list.map(item => item.phaseId), ['evening']);
});

test('native reminders: several children get separate ids and the total stays under the iOS limit', () => {
  const list = planNativeReminders([child(), child(), child()], notDone, new Date('2026-05-06T15:00:00'), 14, 60);
  assert.equal(list.length, 60);
  assert.equal(new Set(list.map(item => item.id)).size, 60);
  assert.deepEqual([...new Set(list.map(item => item.childIndex))].sort(), [0, 1, 2]);
});

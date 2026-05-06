const test = require('node:test');
const assert = require('node:assert/strict');

const {
  AFTER_SCHOOL_PLAN,
  getAfterSchoolStatus,
  setAfterSchoolTaskDone
} = require('./after-school-mode.js');

test('game ticket opens only after story and piano are done', () => {
  let log = {};
  let status = getAfterSchoolStatus(AFTER_SCHOOL_PLAN, log);
  assert.equal(status.gameTicket.done, false);
  assert.equal(status.nextTask.id, 'snack-clothes');

  log = setAfterSchoolTaskDone(log, 'snack-clothes', true, 1000);
  log = setAfterSchoolTaskDone(log, 'chinese-story', true, 2000);
  status = getAfterSchoolStatus(AFTER_SCHOOL_PLAN, log);
  assert.equal(status.gameTicket.done, false);
  assert.equal(status.gameTicket.doneCount, 1);
  assert.equal(status.nextTask.id, 'piano');

  log = setAfterSchoolTaskDone(log, 'piano', true, 3000);
  status = getAfterSchoolStatus(AFTER_SCHOOL_PLAN, log);
  assert.equal(status.gameTicket.done, true);
  assert.equal(status.gameTicket.doneCount, 2);
  assert.equal(status.nextTask.id, 'lunchbox');
});

test('turning a task off removes its earned points from the route status', () => {
  let log = {};
  log = setAfterSchoolTaskDone(log, 'snack-clothes', true, 1000);
  log = setAfterSchoolTaskDone(log, 'chinese-story', true, 2000);

  let status = getAfterSchoolStatus(AFTER_SCHOOL_PLAN, log);
  assert.equal(status.doneCount, 2);
  assert.equal(status.earnedPoints, 6);

  log = setAfterSchoolTaskDone(log, 'chinese-story', false, 3000);
  status = getAfterSchoolStatus(AFTER_SCHOOL_PLAN, log);
  assert.equal(status.doneCount, 1);
  assert.equal(status.earnedPoints, 1);
  assert.equal(status.nextTask.id, 'chinese-story');
});

test('finishing every after-school task unlocks bedtime story', () => {
  let log = {};
  for (const task of AFTER_SCHOOL_PLAN.flatMap(phase => phase.tasks)) {
    log = setAfterSchoolTaskDone(log, task.id, true, 1000);
  }

  const status = getAfterSchoolStatus(AFTER_SCHOOL_PLAN, log);
  assert.equal(status.doneCount, status.totalCount);
  assert.equal(status.nextTask, null);
  assert.equal(status.storyReady, true);
});

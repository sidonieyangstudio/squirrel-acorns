const test = require('node:test');
const assert = require('node:assert/strict');

const { createDayRolloverTracker } = require('./daily-reset.js');

test('day rollover tracker notices when the app resumes on a new day', () => {
  let day = '2026-05-05';
  const changes = [];
  const tracker = createDayRolloverTracker(() => day, (nextDay, previousDay) => {
    changes.push({ nextDay, previousDay });
  });

  assert.equal(tracker.check(), false);
  assert.deepEqual(changes, []);

  day = '2026-05-06';

  assert.equal(tracker.check(), true);
  assert.deepEqual(changes, [{ nextDay: '2026-05-06', previousDay: '2026-05-05' }]);
  assert.equal(tracker.check(), false);
});

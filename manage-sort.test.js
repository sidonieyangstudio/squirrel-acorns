const test = require('node:test');
const assert = require('node:assert/strict');

const { shouldCancelLongPress } = require('./manage-sort.js');

test('long press allows normal finger drift before sorting starts', () => {
  assert.equal(shouldCancelLongPress(15, 30), false);
});

test('long press still cancels when the user is clearly scrolling', () => {
  assert.equal(shouldCancelLongPress(48, 30), true);
});

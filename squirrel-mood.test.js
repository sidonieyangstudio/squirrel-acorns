const test = require('node:test');
const assert = require('node:assert/strict');

const { squirrelMood } = require('./squirrel-mood.js');

test('no tasks done yet: squirrel waves hello', () => {
  assert.equal(squirrelMood(0, 8), 'wave');
});

test('some tasks done but under half: normal smile', () => {
  assert.equal(squirrelMood(1, 8), 'normal');
  assert.equal(squirrelMood(3, 8), 'normal');
});

test('half or more done: proud with an armful of acorns', () => {
  assert.equal(squirrelMood(4, 8), 'proud');
  assert.equal(squirrelMood(7, 8), 'proud');
});

test('everything done: big laugh', () => {
  assert.equal(squirrelMood(8, 8), 'happy');
  assert.equal(squirrelMood(9, 8), 'happy');
});

test('no tasks set up: just the normal squirrel', () => {
  assert.equal(squirrelMood(0, 0), 'normal');
});

const test = require('node:test');
const assert = require('node:assert/strict');

const { buildBackup, parseBackup, backupFileName } = require('./backup-rules.js');

const sampleState = {
  version: 4,
  activeChildId: 'c1',
  children: [{ id: 'c1', userName: '小寶', points: 12 }, { id: 'c2', userName: '二寶', points: 3 }],
  parentPin: '1234',
  parentSecretQ: '最喜歡的動物',
  parentSecretA: '松鼠'
};

test('backup keeps children data and leaves out the parent PIN and secret answer', () => {
  const backup = buildBackup(sampleState, new Date('2026-10-19T10:00:00Z'));
  assert.equal(backup.app, 'squirrel-acorns');
  assert.equal(backup.format, 1);
  assert.equal(backup.exportedAt, '2026-10-19T10:00:00.000Z');
  assert.deepEqual(backup.data.children, sampleState.children);
  assert.equal(backup.data.activeChildId, 'c1');
  const text = JSON.stringify(backup);
  assert.ok(!text.includes('1234'));
  assert.ok(!text.includes('松鼠'));
});

test('backup is a deep copy, so later changes do not leak into it', () => {
  const state = structuredClone(sampleState);
  const backup = buildBackup(state, new Date());
  state.children[0].points = 999;
  assert.equal(backup.data.children[0].points, 12);
});

test('a backup file can be read back', () => {
  const text = JSON.stringify(buildBackup(sampleState, new Date()));
  const result = parseBackup(text);
  assert.equal(result.ok, true);
  assert.deepEqual(result.data.children, sampleState.children);
  assert.equal(result.data.activeChildId, 'c1');
  assert.equal(result.childCount, 2);
});

test('broken or unrelated files are rejected with a plain message', () => {
  assert.equal(parseBackup('not json').ok, false);
  assert.equal(parseBackup('{"hello":1}').ok, false);
  assert.equal(parseBackup(JSON.stringify({ app: 'squirrel-acorns', format: 1, data: { children: [] } })).ok, false);
  assert.equal(parseBackup(JSON.stringify({ app: 'squirrel-acorns', format: 1, data: { children: [{ points: 1 }] } })).ok, false);
  assert.equal(parseBackup(JSON.stringify({ app: 'squirrel-acorns', format: 99, data: { children: [{ id: 'a' }] } })).ok, false);
  assert.match(parseBackup('not json').error, /不是松鼠橡實的備份檔/);
});

test('an active child id that does not exist falls back to the first child', () => {
  const backup = buildBackup(sampleState, new Date());
  backup.data.activeChildId = 'gone';
  const result = parseBackup(JSON.stringify(backup));
  assert.equal(result.data.activeChildId, 'c1');
});

test('file name carries the local date', () => {
  assert.equal(backupFileName(new Date(2026, 9, 5)), '松鼠橡實備份-2026-10-05.json');
});

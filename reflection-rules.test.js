const test = require('node:test');
const assert = require('node:assert/strict');

const {
  STICKERS,
  saveDailyReflection,
  stickerForDate,
  collectedStickers
} = require('./reflection-rules.js');

test('daily reflection awards one stable sticker after all answers are selected', () => {
  const dateKey = '2026-05-23';
  const reflections = saveDailyReflection({}, dateKey, {
    mood: 'proud',
    blocker: 'homework'
  }, 'child-a');

  const saved = reflections[dateKey];

  assert.equal(saved.mood, 'proud');
  assert.equal(saved.blocker, 'homework');
  assert.equal(saved.completed, true);
  assert.equal(saved.sticker.id, stickerForDate(dateKey, 'child-a').id);
});

test('updating today reflection keeps the same sticker', () => {
  const dateKey = '2026-05-23';
  const first = saveDailyReflection({}, dateKey, {
    mood: 'smile',
    blocker: 'bath'
  }, 'child-a');
  const updated = saveDailyReflection(first, dateKey, {
    mood: 'proud',
    blocker: 'toys'
  }, 'child-a');

  assert.equal(updated[dateKey].mood, 'proud');
  assert.equal(updated[dateKey].blocker, 'toys');
  assert.equal(updated[dateKey].sticker.id, first[dateKey].sticker.id);
});

test('incomplete reflection does not award a sticker', () => {
  const reflections = saveDailyReflection({}, '2026-05-23', {
    mood: 'proud',
    blocker: ''
  }, 'child-a');

  assert.equal(reflections['2026-05-23'].completed, false);
  assert.equal(reflections['2026-05-23'].sticker, null);
});

test('sticker collection only includes completed reflection days', () => {
  const withSticker = saveDailyReflection({}, '2026-05-23', {
    mood: 'proud',
    blocker: 'homework'
  }, 'child-a');
  const mixed = saveDailyReflection(withSticker, '2026-05-24', {
    mood: 'smile',
    blocker: ''
  }, 'child-a');

  const stickers = collectedStickers(mixed);

  assert.equal(STICKERS.length, 12);
  assert.equal(stickers.length, 1);
  assert.equal(stickers[0].dateKey, '2026-05-23');
  assert.ok(stickers[0].sticker.label);
});

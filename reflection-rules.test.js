const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_BLOCKERS,
  MOODS,
  STICKER_THEMES,
  stickerPoolForTheme,
  normalizeBlockers,
  saveDailyReflection,
  stickerForDate,
  collectedStickers,
  stickerCollectionBoard
} = require('./reflection-rules.js');

test('mood choices use kaomoji faces', () => {
  assert.deepEqual(
    MOODS.map(item => [item.id, item.face]),
    [
      ['proud', '٩(ˊᗜˋ*)و'],
      ['smile', '(˶ᵔ ᵕ ᵔ˶)'],
      ['unsatisfied', '(｡•́︿•̀｡)']
    ]
  );
});

test('sticker themes can switch between daily, vehicle, and mixed pools', () => {
  assert.equal(STICKER_THEMES.daily.stickers.length, 24);
  assert.equal(STICKER_THEMES.vehicle.stickers.length, 14);
  assert.equal(stickerPoolForTheme('mixed').length, 38);
  assert.equal(stickerPoolForTheme('unknown').length, 24);
});

test('custom blockers are normalized while keeping the defaults as fallback', () => {
  const blockers = normalizeBlockers([
    { id: 'homework', label: '回家功課' },
    { label: '整理書包' },
    { id: 'blank', label: '' }
  ]);

  assert.equal(DEFAULT_BLOCKERS.length, 4);
  assert.deepEqual(blockers.map(item => item.label), ['回家功課', '整理書包']);
  assert.ok(blockers[1].id.startsWith('blocker-'));
  assert.deepEqual(normalizeBlockers([]), DEFAULT_BLOCKERS);
});

test('daily reflection awards one stable sticker after all answers are selected', () => {
  const dateKey = '2026-05-23';
  const reflections = saveDailyReflection({}, dateKey, {
    mood: 'proud',
    blocker: 'homework'
  }, { childId: 'child-a' });

  const saved = reflections[dateKey];

  assert.equal(saved.mood, 'proud');
  assert.equal(saved.blocker, 'homework');
  assert.equal(saved.completed, true);
  assert.equal(saved.sticker.id, stickerForDate(dateKey, { childId: 'child-a' }).id);
});

test('updating today reflection keeps the same sticker', () => {
  const dateKey = '2026-05-23';
  const first = saveDailyReflection({}, dateKey, {
    mood: 'smile',
    blocker: 'bath'
  }, { childId: 'child-a' });
  const updated = saveDailyReflection(first, dateKey, {
    mood: 'proud',
    blocker: 'toys'
  }, { childId: 'child-a' });

  assert.equal(updated[dateKey].mood, 'proud');
  assert.equal(updated[dateKey].blocker, 'toys');
  assert.equal(updated[dateKey].sticker.id, first[dateKey].sticker.id);
});

test('incomplete reflection does not award a sticker', () => {
  const reflections = saveDailyReflection({}, '2026-05-23', {
    mood: 'proud',
    blocker: ''
  }, { childId: 'child-a' });

  assert.equal(reflections['2026-05-23'].completed, false);
  assert.equal(reflections['2026-05-23'].sticker, null);
});

test('reflection accepts parent customized blocker options', () => {
  const blockers = normalizeBlockers([{ id: 'bag', label: '整理書包' }]);
  const reflections = saveDailyReflection({}, '2026-05-23', {
    mood: 'smile',
    blocker: 'bag'
  }, { childId: 'child-a', blockers });

  assert.equal(reflections['2026-05-23'].completed, true);
  assert.equal(reflections['2026-05-23'].blocker, 'bag');
});

test('reflection chooses stickers from the selected theme', () => {
  const vehicle = stickerForDate('2026-05-23', { childId: 'child-a', theme: 'vehicle' });
  const mixed = stickerForDate('2026-05-23', { childId: 'child-a', theme: 'mixed' });

  assert.equal(vehicle.theme, 'vehicle');
  assert.ok(vehicle.src.startsWith('assets/stickers/vehicle/'));
  assert.ok(['daily', 'vehicle'].includes(mixed.theme));
});

test('sticker collection only includes completed reflection days', () => {
  const withSticker = saveDailyReflection({}, '2026-05-23', {
    mood: 'proud',
    blocker: 'homework'
  }, { childId: 'child-a' });
  const mixed = saveDailyReflection(withSticker, '2026-05-24', {
    mood: 'smile',
    blocker: ''
  }, { childId: 'child-a' });

  const stickers = collectedStickers(mixed);

  assert.equal(stickers.length, 1);
  assert.equal(stickers[0].dateKey, '2026-05-23');
  assert.ok(stickers[0].sticker.label);
});

test('sticker collection board follows the selected theme and keeps empty slots', () => {
  const sticker = STICKER_THEMES.vehicle.stickers[2];
  const reflections = {
    '2026-05-23': {
      completed: true,
      sticker,
      mood: 'proud',
      blocker: 'homework'
    }
  };

  const board = stickerCollectionBoard(reflections, 'vehicle');
  const filled = board.filter(slot => slot.collected);

  assert.equal(board.length, 14);
  assert.equal(filled.length, 1);
  assert.equal(filled[0].sticker.id, sticker.id);
  assert.equal(filled[0].dateKey, '2026-05-23');
  assert.equal(board.filter(slot => !slot.collected).length, 13);
});

test('sticker collection board uses the first collected date for repeated stickers', () => {
  const sticker = STICKER_THEMES.daily.stickers[0];
  const reflections = {
    '2026-05-23': { completed: true, sticker },
    '2026-05-24': { completed: true, sticker }
  };

  const board = stickerCollectionBoard(reflections, 'daily');
  const filled = board.filter(slot => slot.collected);

  assert.equal(board.length, 24);
  assert.equal(filled.length, 1);
  assert.equal(filled[0].dateKey, '2026-05-23');
});

const test = require('node:test');
const assert = require('node:assert/strict');

const rules = require('./reflection-rules.js');

test('each festival has 8 stickers and no sticker repeats anywhere', () => {
  const all = rules.SPECIAL_SETS.concat([rules.BIRTHDAY_SET]).flatMap(set => set.stickers.map(s => s.code));
  const everyday = rules.STICKER_THEMES.mixed.stickers.map(s => s.code);
  rules.SPECIAL_SETS.forEach(set => assert.equal(set.stickers.length, 8, set.id));
  assert.equal(new Set(all).size, all.length);
  all.forEach(code => assert.ok(!everyday.includes(code), code));
});

test('festival windows pick the right set, including the first and last day', () => {
  assert.equal(rules.activeSpecialSet('2026-10-11').id, 'halloween');
  assert.equal(rules.activeSpecialSet('2026-10-31').id, 'halloween');
  assert.equal(rules.activeSpecialSet('2026-10-10').id, 'midautumn');
  assert.equal(rules.activeSpecialSet('2027-01-15').id, 'newyear');
  assert.equal(rules.activeSpecialSet('2027-02-28').id, 'newyear');
  assert.equal(rules.activeSpecialSet('2026-08-31').id, 'summer');
  assert.equal(rules.activeSpecialSet('2026-12-25').id, 'christmas');
  assert.equal(rules.activeSpecialSet('2026-11-15'), null);
  assert.equal(rules.activeSpecialSet('2026-05-20'), null);
});

test('birthday week is 3 days before to 3 days after and wins over a festival', () => {
  const bday = { month: 12, day: 24 };
  assert.equal(rules.activeSpecialSet('2026-12-21', bday).id, 'birthday');
  assert.equal(rules.activeSpecialSet('2026-12-27', bday).id, 'birthday');
  assert.equal(rules.activeSpecialSet('2026-12-20', bday).id, 'christmas');
  assert.equal(rules.activeSpecialSet('2026-12-28', bday).id, 'christmas');
});

test('birthday week crosses the new year', () => {
  const bday = { month: 1, day: 1 };
  assert.equal(rules.activeSpecialSet('2026-12-29', bday).id, 'birthday');
  assert.equal(rules.activeSpecialSet('2027-01-04', bday).id, 'birthday');
  assert.equal(rules.activeSpecialSet('2027-01-05', bday), null);
});

test('Feb 29 birthday is celebrated on Feb 28 in non-leap years', () => {
  const bday = { month: 2, day: 29 };
  assert.equal(rules.isBirthdayToday('2027-02-28', bday), true);
  assert.equal(rules.isBirthdayToday('2028-02-29', bday), true);
  assert.equal(rules.isBirthdayToday('2028-02-28', bday), false);
});

test('bad or empty birthdays are ignored', () => {
  assert.equal(rules.normalizeBirthday(null), null);
  assert.equal(rules.normalizeBirthday({ month: 2, day: 30 }), null);
  assert.equal(rules.normalizeBirthday({ month: 13, day: 1 }), null);
  assert.equal(rules.normalizeBirthday({ month: '', day: '' }), null);
  assert.deepEqual(rules.normalizeBirthday({ month: '5', day: '12' }), { month: 5, day: 12 });
  assert.equal(rules.activeSpecialSet('2026-05-20', { month: 2, day: 30 }), null);
});

test('reflection during a festival gives a festival sticker, outside gives the chosen theme', () => {
  const inSeason = rules.stickerForDate('2026-10-22', { childId: 'c1', theme: 'vehicle' });
  assert.equal(inSeason.theme, 'halloween');
  assert.match(inSeason.src, /^assets\/stickers\/special\/halloween\//);
  const normal = rules.stickerForDate('2026-11-15', { childId: 'c1', theme: 'vehicle' });
  assert.equal(normal.theme, 'vehicle');
  const bday = rules.stickerForDate('2026-11-15', { childId: 'c1', theme: 'vehicle', birthday: { month: 11, day: 14 } });
  assert.equal(bday.theme, 'birthday');
});

test('album keeps collected special stickers after the season and shows the rest as not collected', () => {
  let reflections = {};
  reflections = rules.saveDailyReflection(reflections, '2026-10-22', { mood: rules.MOODS[0].id, blocker: rules.DEFAULT_BLOCKERS[0].id }, { childId: 'c1' });
  const got = reflections['2026-10-22'].sticker;
  const later = rules.specialAlbums(reflections, '2026-11-15', null);
  assert.equal(later.length, 1);
  assert.equal(later[0].set.id, 'halloween');
  assert.equal(later[0].active, false);
  assert.equal(later[0].slots.filter(s => s.collected).length, 1);
  assert.equal(later[0].slots.find(s => s.collected).sticker.id, got.id);

  const now = rules.specialAlbums({}, '2026-12-05', null);
  assert.deepEqual(now.map(a => [a.set.id, a.active]), [['christmas', true]]);
  assert.deepEqual(rules.specialAlbums({}, '2026-11-15', null), []);
});

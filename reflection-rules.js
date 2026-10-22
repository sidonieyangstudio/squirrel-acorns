/* =========================================================
   松鼠點數收集 · 每日小回顧規則
   ========================================================= */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SquirrelReflection = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MOODS = [
    { id: 'proud', label: '自豪', face: '٩(ˊᗜˋ)و' },
    { id: 'smile', label: '微笑', face: '(˶ᵔ ᵕ ᵔ˶)' },
    { id: 'unsatisfied', label: '不滿意', face: '(｡•́︿•̀｡)' }
  ];

  const DEFAULT_BLOCKERS = [
    { id: 'homework', label: '寫功課' },
    { id: 'bath', label: '洗澡' },
    { id: 'toys', label: '收起玩具' },
    { id: 'other', label: '其他' }
  ];

  const DAILY_STICKERS = [
    '1F308', '1F33A', '1F344', '1F347', '1F349', '1F34A',
    '1F34E', '1F352', '1F353', '1F361', '1F3A1', '1F3AA',
    '1F41E', '1F420', '1F422', '1F427', '1F433',
    '1F43B-200D-2744-FE0F', '1F99C', '1F9AB', '1F9C1',
    '1FA85', '1FAA9', '2603'
  ];

  const VEHICLE_STICKERS = [
    '1F680', '1F681', '1F682', '1F683', '1F688', '1F68E',
    '1F691', '1F692', '1F693', '1F695', '1F69C', '1F69E',
    '1F6E9', '1F6FB'
  ];

  const STICKER_THEMES = {
    daily: {
      id: 'daily',
      label: '可愛日常',
      stickers: DAILY_STICKERS.map(code => makeSticker('daily', code))
    },
    vehicle: {
      id: 'vehicle',
      label: '交通工具',
      stickers: VEHICLE_STICKERS.map(code => makeSticker('vehicle', code))
    }
  };
  STICKER_THEMES.mixed = {
    id: 'mixed',
    label: '全部混合',
    stickers: STICKER_THEMES.daily.stickers.concat(STICKER_THEMES.vehicle.stickers)
  };

  // 節慶與生日限定貼紙：期間內小回顧抽到的是限定貼紙，拿到就永久留在收藏冊。
  // 日期用每年固定區間（月-日，含頭尾），過年與中秋放寬區間，免得每年手動調整。
  const SPECIAL_SETS = [
    { id: 'newyear', label: '過年', start: '01-15', end: '02-28',
      codes: ['1F9E7', '1F9E8', '1F386', '1F387', '1F3EE', '1F409', '1F95F', '1F38A'] },
    { id: 'summer', label: '夏日放暑假', start: '07-01', end: '08-31',
      codes: ['1F3D6', '1F30A', '1F41A', '1F366', '1F9A9', '1F31E', '1F3A3', '1F3D5'] },
    { id: 'midautumn', label: '中秋與秋天', start: '09-01', end: '10-10',
      codes: ['1F96E', '1F315', '1F407', '1F391', '1F375', '1F342', '1F341', '1F330'] },
    { id: 'halloween', label: '萬聖節', start: '10-11', end: '10-31',
      codes: ['1F383', '1F47B', '1F987', '1F578', '1F36C', '1F36D', '1F9D9', '1F9DB'] },
    { id: 'christmas', label: '聖誕節', start: '12-01', end: '12-31',
      codes: ['1F384', '1F385', '1F381', '2744', '1F98C', '1F514', '1F36A', '1F9E6'] }
  ].map(set => Object.assign({}, set, { stickers: set.codes.map(code => makeSpecialSticker(set.id, code)) }));

  const BIRTHDAY_SET = {
    id: 'birthday',
    label: '生日',
    stickers: ['1F382', '1F388', '1F389', '1F380', '1F451', '1F973', '1F31F', '1F36B']
      .map(code => makeSpecialSticker('birthday', code))
  };
  const BIRTHDAY_WEEK_RADIUS = 3; // 生日前後各 3 天，共 7 天

  function makeSpecialSticker(setId, code) {
    return {
      id: `special-${setId}-${code}`,
      code,
      label: code,
      theme: setId,
      src: `assets/stickers/special/${setId}/${code}.svg`
    };
  }

  function normalizeBirthday(birthday) {
    const month = Number(birthday && birthday.month);
    const day = Number(birthday && birthday.day);
    if (!Number.isInteger(month) || !Number.isInteger(day) || month < 1 || month > 12 || day < 1) return null;
    const maxDay = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
    if (day > maxDay) return null;
    return { month, day };
  }

  function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  function birthdayInYear(birthday, year) {
    // 2/29 生日在平年改成 2/28 過
    const day = birthday.month === 2 && birthday.day === 29 && !isLeapYear(year) ? 28 : birthday.day;
    return Date.UTC(year, birthday.month - 1, day);
  }

  function daysFromBirthday(dateKey, birthday) {
    const b = normalizeBirthday(birthday);
    if (!b) return null;
    const [y, m, d] = String(dateKey).split('-').map(Number);
    const today = Date.UTC(y, m - 1, d);
    let best = null;
    for (const year of [y - 1, y, y + 1]) {
      const diff = Math.round((today - birthdayInYear(b, year)) / 86400000);
      if (best === null || Math.abs(diff) < Math.abs(best)) best = diff;
    }
    return best;
  }

  function isBirthdayToday(dateKey, birthday) {
    return daysFromBirthday(dateKey, birthday) === 0;
  }

  function seasonalSetForDate(dateKey) {
    const md = String(dateKey).slice(5, 10);
    return SPECIAL_SETS.find(set => set.start <= md && md <= set.end) || null;
  }

  function activeSpecialSet(dateKey, birthday) {
    const distance = daysFromBirthday(dateKey, birthday);
    if (distance !== null && Math.abs(distance) <= BIRTHDAY_WEEK_RADIUS) return BIRTHDAY_SET;
    return seasonalSetForDate(dateKey);
  }

  function collectedMap(reflections) {
    const collected = new Map();
    collectedStickers(reflections).forEach(item => {
      const id = item.sticker && item.sticker.id;
      if (id && !collected.has(id)) collected.set(id, item.dateKey);
    });
    return collected;
  }

  function makeBook(set, kind, collected) {
    const slots = set.stickers.map(sticker => ({
      sticker,
      dateKey: collected.get(sticker.id) || '',
      collected: collected.has(sticker.id)
    }));
    const count = slots.filter(slot => slot.collected).length;
    const firstGot = slots.find(slot => slot.collected);
    return {
      id: set.id,
      label: set.label,
      kind,
      start: set.start || '',
      end: set.end || '',
      collectedCount: count,
      total: slots.length,
      full: count === slots.length,
      cover: (firstGot || slots[0]).sticker,
      slots
    };
  }

  // 正在進行的限定貼紙（節慶或生日週）：直接展開在書架上方，還沒拿到也顯示。
  function currentSpecialBook(reflections, dateKey, birthday) {
    const active = activeSpecialSet(dateKey, birthday);
    if (!active) return null;
    return makeBook(active, active.id === 'birthday' ? 'birthday' : 'season', collectedMap(reflections));
  }

  // 貼紙書架：每組貼紙是一本。日常主題（可愛日常、交通工具）固定出現；
  // 限定本子拿到第一張才上架，正在進行的那組不在書架上（期間結束才收成本子）。
  function stickerBookshelf(reflections, dateKey, birthday) {
    const collected = collectedMap(reflections);
    const active = activeSpecialSet(dateKey, birthday);
    const themeBooks = ['daily', 'vehicle'].map(id => makeBook(STICKER_THEMES[id], 'theme', collected));
    const specialBooks = SPECIAL_SETS.map(set => makeBook(set, 'season', collected))
      .concat([makeBook(BIRTHDAY_SET, 'birthday', collected)])
      .filter(book => book.collectedCount > 0 && !(active && active.id === book.id));
    return themeBooks.concat(specialBooks);
  }

  function makeSticker(theme, code) {
    return {
      id: `${theme}-${code}`,
      code,
      label: code,
      theme,
      src: `assets/stickers/${theme}/${code}.svg`
    };
  }

  function hashString(input) {
    return String(input || '').split('').reduce((hash, char) => {
      return ((hash << 5) - hash + char.charCodeAt(0)) | 0;
    }, 0);
  }

  function stickerPoolForTheme(theme) {
    return (STICKER_THEMES[theme] || STICKER_THEMES.daily).stickers;
  }

  function stickerForDate(dateKey, options) {
    const opts = typeof options === 'string' ? { childId: options } : (options || {});
    const theme = opts.theme || 'daily';
    const special = activeSpecialSet(dateKey, opts.birthday);
    const pool = special ? special.stickers : stickerPoolForTheme(theme);
    const hash = Math.abs(hashString(`${dateKey}:${opts.childId || 'child'}:${theme}`));
    return pool[hash % pool.length];
  }

  function normalizeBlockers(blockers) {
    const source = Array.isArray(blockers) ? blockers : [];
    const seen = new Set();
    const normalized = source
      .map((item, index) => {
        const label = String((item && item.label) || '').trim();
        if (!label) return null;
        const rawId = String((item && item.id) || '').trim();
        const id = rawId || `blocker-${hashString(`${label}:${index}`).toString(36).replace('-', 'x')}`;
        return { id, label };
      })
      .filter(Boolean)
      .filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    return normalized.length ? normalized : DEFAULT_BLOCKERS.map(item => Object.assign({}, item));
  }

  function validId(list, id) {
    return list.some(item => item.id === id);
  }

  function saveDailyReflection(reflections, dateKey, input, options) {
    const opts = typeof options === 'string' ? { childId: options } : (options || {});
    const blockers = normalizeBlockers(opts.blockers || DEFAULT_BLOCKERS);
    const next = Object.assign({}, reflections || {});
    const previous = next[dateKey] || {};
    const mood = validId(MOODS, input && input.mood) ? input.mood : '';
    const blocker = validId(blockers, input && input.blocker) ? input.blocker : '';
    const completed = !!(mood && blocker);
    const sticker = completed
      ? (previous.sticker || stickerForDate(dateKey, opts))
      : null;

    next[dateKey] = {
      mood,
      blocker,
      completed,
      sticker,
      updatedAt: new Date().toISOString()
    };
    return next;
  }

  function collectedStickers(reflections) {
    return Object.entries(reflections || {})
      .filter(([, entry]) => entry && entry.completed && entry.sticker)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, entry]) => ({ dateKey, sticker: entry.sticker }));
  }

  function stickerCollectionBoard(reflections, theme) {
    const collectedBySticker = new Map();
    collectedStickers(reflections).forEach(item => {
      const id = item.sticker && item.sticker.id;
      if (id && !collectedBySticker.has(id)) collectedBySticker.set(id, item.dateKey);
    });
    return stickerPoolForTheme(theme).map(sticker => {
      const dateKey = collectedBySticker.get(sticker.id) || '';
      return {
        sticker,
        dateKey,
        collected: !!dateKey
      };
    });
  }

  return {
    MOODS,
    DEFAULT_BLOCKERS,
    BLOCKERS: DEFAULT_BLOCKERS,
    STICKER_THEMES,
    SPECIAL_SETS,
    BIRTHDAY_SET,
    normalizeBirthday,
    daysFromBirthday,
    isBirthdayToday,
    activeSpecialSet,
    stickerBookshelf,
    currentSpecialBook,
    stickerPoolForTheme,
    normalizeBlockers,
    stickerForDate,
    saveDailyReflection,
    collectedStickers,
    stickerCollectionBoard
  };
});

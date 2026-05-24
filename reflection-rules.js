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
    { id: 'proud', label: '自豪', face: 'ᕙ( •̀ ᗜ •́ )ᕗ' },
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
    const pool = stickerPoolForTheme(theme);
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

  return {
    MOODS,
    DEFAULT_BLOCKERS,
    BLOCKERS: DEFAULT_BLOCKERS,
    STICKER_THEMES,
    stickerPoolForTheme,
    normalizeBlockers,
    stickerForDate,
    saveDailyReflection,
    collectedStickers
  };
});

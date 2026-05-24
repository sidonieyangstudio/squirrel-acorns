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
    { id: 'proud', label: '自豪', face: ':D' },
    { id: 'smile', label: '微笑', face: ':)' },
    { id: 'unsatisfied', label: '不滿意', face: ':|' }
  ];

  const BLOCKERS = [
    { id: 'homework', label: '寫功課' },
    { id: 'bath', label: '洗澡' },
    { id: 'toys', label: '收起玩具' },
    { id: 'other', label: '其他' }
  ];

  const STICKERS = [
    { id: 'acorn', label: '橡實', icon: 'ic-squirrel', color: '#DA844F' },
    { id: 'star', label: '星星', icon: 'ic-star', color: '#EBB95E' },
    { id: 'rainbow', label: '彩虹', icon: 'ic-sparkles', color: '#95B8C8' },
    { id: 'heart', label: '愛心', icon: 'ic-heart', color: '#D97973' },
    { id: 'crown', label: '皇冠', icon: 'ic-queen', color: '#B99A5B' },
    { id: 'rocket', label: '火箭', icon: 'ic-rocket', color: '#8C9EC6' },
    { id: 'book', label: '書本', icon: 'ic-bookopen', color: '#9A8F72' },
    { id: 'music', label: '音符', icon: 'ic-piano', color: '#A989B7' },
    { id: 'paint', label: '畫筆', icon: 'ic-palette', color: '#D98D68' },
    { id: 'bag', label: '背包', icon: 'ic-backpack', color: '#7EA083' },
    { id: 'moon', label: '月亮', icon: 'ic-sparkles', color: '#7F8BAA' },
    { id: 'trophy', label: '獎盃', icon: 'ic-gift', color: '#CFA24A' }
  ];

  function hashString(input) {
    return String(input || '').split('').reduce((hash, char) => {
      return ((hash << 5) - hash + char.charCodeAt(0)) | 0;
    }, 0);
  }

  function stickerForDate(dateKey, childId) {
    const hash = Math.abs(hashString(`${dateKey}:${childId || 'child'}`));
    return STICKERS[hash % STICKERS.length];
  }

  function validId(list, id) {
    return list.some(item => item.id === id);
  }

  function saveDailyReflection(reflections, dateKey, input, childId) {
    const next = Object.assign({}, reflections || {});
    const previous = next[dateKey] || {};
    const mood = validId(MOODS, input && input.mood) ? input.mood : '';
    const blocker = validId(BLOCKERS, input && input.blocker) ? input.blocker : '';
    const completed = !!(mood && blocker);
    const sticker = completed
      ? (previous.sticker || stickerForDate(dateKey, childId))
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
    BLOCKERS,
    STICKERS,
    stickerForDate,
    saveDailyReflection,
    collectedStickers
  };
});

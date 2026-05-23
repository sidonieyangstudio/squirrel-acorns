/* =========================================================
   松鼠點數收集 · 好手氣賓果規則
   ========================================================= */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SquirrelBingo = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function isLogDone(entry) {
    return entry === true || (entry && entry.done === true);
  }

  function createBingoRng(seed) {
    let value = Math.max(1, Number(seed) || 1) % 2147483647;
    return function next() {
      value = value * 16807 % 2147483647;
      return (value - 1) / 2147483646;
    };
  }

  function dailyCompletionCount(habits, log) {
    return (habits || []).filter(habit => isLogDone((log || {})[habit.id])).length;
  }

  function bingoGridConfig(doneCount) {
    if ((doneCount || 0) >= 10) {
      return { total: 16, cols: 4, rows: 4, maxDone: 12, maxLines: 4 };
    }
    return { total: 9, cols: 3, rows: 3, maxDone: 7, maxLines: 3 };
  }

  function shuffled(list, rng) {
    const random = typeof rng === 'function' ? rng : Math.random;
    const arr = list.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function pickBingoHabits(habits, log, cfg, rng) {
    const done = [];
    const undone = [];
    (habits || []).forEach(habit => {
      if (isLogDone((log || {})[habit.id])) done.push(habit);
      else undone.push(habit);
    });

    const selectedDone = shuffled(done, rng).slice(0, Math.min(done.length, cfg.maxDone));
    const selected = selectedDone.concat(
      shuffled(undone, rng).slice(0, Math.max(0, cfg.total - selectedDone.length))
    );
    return shuffled(selected, rng);
  }

  function makeCells(habits, log, cfg, rng) {
    const doneCount = dailyCompletionCount(habits, log);
    const habitsForBoard = pickBingoHabits(habits, log, cfg, rng);
    const cells = habitsForBoard.slice(0, cfg.total).map(habit => ({
      habitId: habit.id,
      title: habit.title,
      icon: habit.icon,
      done: isLogDone((log || {})[habit.id]),
      empty: false
    }));

    const keepBlanks = cfg.total === 16 || doneCount > cfg.maxDone;
    let useFree = !keepBlanks;
    while (cells.length < cfg.total) {
      if (keepBlanks) {
        cells.push({ title: '橡實', done: false, empty: true, acorn: true });
      } else if (useFree) {
        cells.push({ title: 'FREE', icon: 'ic-star', done: true, empty: false, free: true });
      } else {
        cells.push({ title: '橡實', done: false, empty: true, acorn: true });
      }
      useFree = !useFree;
    }
    return shuffled(cells, rng);
  }

  function bingoLineCandidates(cfg) {
    const lines = [];
    for (let r = 0; r < cfg.rows; r++) {
      const indexes = [];
      for (let c = 0; c < cfg.cols; c++) indexes.push(r * cfg.cols + c);
      lines.push({ indexes, x1: 6, y1: ((r + 0.5) / cfg.rows) * 100, x2: 94, y2: ((r + 0.5) / cfg.rows) * 100 });
    }
    for (let c = 0; c < cfg.cols; c++) {
      const indexes = [];
      for (let r = 0; r < cfg.rows; r++) indexes.push(r * cfg.cols + c);
      lines.push({ indexes, x1: ((c + 0.5) / cfg.cols) * 100, y1: 6, x2: ((c + 0.5) / cfg.cols) * 100, y2: 94 });
    }
    if (cfg.rows === cfg.cols) {
      const down = [];
      const up = [];
      for (let i = 0; i < cfg.rows; i++) {
        down.push(i * cfg.cols + i);
        up.push(i * cfg.cols + (cfg.cols - 1 - i));
      }
      lines.push({ indexes: down, x1: 8, y1: 8, x2: 92, y2: 92 });
      lines.push({ indexes: up, x1: 92, y1: 8, x2: 8, y2: 92 });
    }
    return lines;
  }

  function completedBingoLines(cells, cfg) {
    return bingoLineCandidates(cfg).filter(line =>
      line.indexes.every(i => cells[i] && cells[i].done && !cells[i].empty)
    );
  }

  function buildBingoCells({ habits, log, rng }) {
    const cfg = bingoGridConfig(dailyCompletionCount(habits, log));
    let bestCells = null;
    let bestLineCount = Infinity;

    for (let attempt = 0; attempt < 80; attempt++) {
      const cells = makeCells(habits, log, cfg, rng);
      const lineCount = completedBingoLines(cells, cfg).length;
      if (lineCount <= cfg.maxLines) return cells;
      if (lineCount < bestLineCount) {
        bestCells = cells;
        bestLineCount = lineCount;
      }
    }
    return bestCells || makeCells(habits, log, cfg, rng);
  }

  function bingoConfigFromCells(cells) {
    return (cells || []).length <= 9
      ? { total: 9, cols: 3, rows: 3, maxDone: 7, maxLines: 3 }
      : { total: 16, cols: 4, rows: 4, maxDone: 12, maxLines: 4 };
  }

  return {
    createBingoRng,
    dailyCompletionCount,
    bingoGridConfig,
    bingoConfigFromCells,
    buildBingoCells,
    bingoLineCandidates,
    completedBingoLines
  };
});

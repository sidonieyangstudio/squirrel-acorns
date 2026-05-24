const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createBingoRng,
  dailyCompletionCount,
  bingoGridConfig,
  buildBingoCells,
  completedBingoLines,
  calculateBingoBonus,
  bingoOverflowCount
} = require('./bingo-rules.js');

function habit(id) {
  return { id, title: id, icon: 'ic-star' };
}

function completed(ids) {
  return Object.fromEntries(ids.map(id => [id, { done: true, points: 1 }]));
}

test('bingo size follows today completed task count, not total task count', () => {
  const habits = Array.from({ length: 14 }, (_, index) => habit(`h${index + 1}`));

  assert.equal(dailyCompletionCount(habits, completed(['h1', 'h2', 'h3', 'h4', 'h5'])), 5);
  assert.deepEqual(
    bingoGridConfig(dailyCompletionCount(habits, completed(['h1', 'h2', 'h3', 'h4', 'h5']))),
    { total: 9, cols: 3, rows: 3, bonusCap: 5 }
  );

  assert.deepEqual(
    bingoGridConfig(dailyCompletionCount(habits, completed(['h1','h2','h3','h4','h5','h6','h7','h8','h9','h10']))),
    { total: 16, cols: 4, rows: 4, bonusCap: 5 }
  );
});

test('nine-cell bingo shows all nine completed tasks', () => {
  const habits = Array.from({ length: 9 }, (_, index) => habit(`h${index + 1}`));
  const log = completed(habits.map(item => item.id));
  const cfg = bingoGridConfig(dailyCompletionCount(habits, log));

  const cells = buildBingoCells({ habits, log, rng: createBingoRng(9) });
  const doneCells = cells.filter(cell => cell.done && !cell.free).length;
  const openCells = cells.filter(cell => !cell.done).length;
  const lines = completedBingoLines(cells, cfg);

  assert.equal(cfg.total, 9);
  assert.equal(doneCells, 9);
  assert.equal(openCells, 0);
  assert.equal(lines.length, 8);
  assert.equal(calculateBingoBonus(lines, cfg), 5);
});

test('sixteen-cell bingo shows all sixteen completed tasks but caps the bonus', () => {
  const habits = Array.from({ length: 16 }, (_, index) => habit(`h${index + 1}`));
  const log = completed(habits.map(item => item.id));
  const cfg = bingoGridConfig(dailyCompletionCount(habits, log));

  const cells = buildBingoCells({ habits, log, rng: createBingoRng(16) });
  const doneCells = cells.filter(cell => cell.done && !cell.free).length;
  const openCells = cells.filter(cell => !cell.done).length;
  const lines = completedBingoLines(cells, cfg);

  assert.equal(cfg.total, 16);
  assert.equal(doneCells, 16);
  assert.equal(openCells, 0);
  assert.equal(lines.length, 10);
  assert.equal(calculateBingoBonus(lines, cfg), 5);
});

test('bingo adds one free space after completed tasks when twelve or fewer are done', () => {
  const nineHabits = Array.from({ length: 14 }, (_, index) => habit(`n${index + 1}`));
  const nineLog = completed(nineHabits.slice(0, 8).map(item => item.id));
  const nineCells = buildBingoCells({ habits: nineHabits, log: nineLog, rng: createBingoRng(8) });

  assert.equal(nineCells.length, 9);
  assert.equal(nineCells.filter(cell => cell.done && !cell.free).length, 8);
  assert.equal(nineCells.filter(cell => cell.free).length, 1);

  const sixteenHabits = Array.from({ length: 14 }, (_, index) => habit(`s${index + 1}`));
  const sixteenLog = completed(sixteenHabits.slice(0, 12).map(item => item.id));
  const sixteenCells = buildBingoCells({ habits: sixteenHabits, log: sixteenLog, rng: createBingoRng(12) });

  assert.equal(sixteenCells.length, 16);
  assert.equal(sixteenCells.filter(cell => cell.done && !cell.free).length, 12);
  assert.equal(sixteenCells.filter(cell => cell.free).length, 1);
});

test('bingo does not replace completed tasks with a free space', () => {
  const nineHabits = Array.from({ length: 9 }, (_, index) => habit(`n${index + 1}`));
  const nineLog = completed(nineHabits.map(item => item.id));
  const nineCells = buildBingoCells({ habits: nineHabits, log: nineLog, rng: createBingoRng(9) });

  assert.equal(nineCells.filter(cell => cell.done && !cell.free).length, 9);
  assert.equal(nineCells.filter(cell => cell.free).length, 0);

  const sixteenHabits = Array.from({ length: 16 }, (_, index) => habit(`s${index + 1}`));
  const sixteenLog = completed(sixteenHabits.slice(0, 13).map(item => item.id));
  const sixteenCells = buildBingoCells({ habits: sixteenHabits, log: sixteenLog, rng: createBingoRng(13) });

  assert.equal(sixteenCells.filter(cell => cell.done && !cell.free).length, 13);
  assert.equal(sixteenCells.filter(cell => cell.free).length, 0);
});

test('sixteen-cell bingo fills remaining slots with empty spaces after the free space', () => {
  const habits = Array.from({ length: 14 }, (_, index) => habit(`h${index + 1}`));
  const log = completed(habits.slice(0, 10).map(item => item.id));
  const cfg = bingoGridConfig(dailyCompletionCount(habits, log));

  const cells = buildBingoCells({ habits, log, rng: createBingoRng(14) });

  assert.equal(cfg.total, 16);
  assert.equal(cells.filter(cell => cell.done && !cell.free).length, 10);
  assert.equal(cells.filter(cell => cell.free).length, 1);
  assert.equal(cells.filter(cell => !cell.done).length, 5);
});

test('sixteen-cell bingo acknowledges completed tasks that cannot fit on the board', () => {
  const habits = Array.from({ length: 20 }, (_, index) => habit(`h${index + 1}`));
  const log = completed(habits.map(item => item.id));
  const cfg = bingoGridConfig(dailyCompletionCount(habits, log));

  const cells = buildBingoCells({ habits, log, rng: createBingoRng(20) });

  assert.equal(cfg.total, 16);
  assert.equal(cells.filter(cell => cell.done && !cell.free).length, 16);
  assert.equal(bingoOverflowCount(habits, log, cells), 4);
});

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createBingoRng,
  dailyCompletionCount,
  bingoGridConfig,
  buildBingoCells,
  completedBingoLines
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
    { total: 9, cols: 3, rows: 3, maxDone: 7, maxLines: 3 }
  );

  assert.deepEqual(
    bingoGridConfig(dailyCompletionCount(habits, completed(['h1','h2','h3','h4','h5','h6','h7','h8','h9','h10']))),
    { total: 16, cols: 4, rows: 4, maxDone: 12, maxLines: 4 }
  );
});

test('nine-cell bingo keeps at least two unfinished spaces when many tasks are done', () => {
  const habits = Array.from({ length: 9 }, (_, index) => habit(`h${index + 1}`));
  const log = completed(habits.map(item => item.id));
  const cfg = bingoGridConfig(dailyCompletionCount(habits, log));

  const cells = buildBingoCells({ habits, log, rng: createBingoRng(9) });
  const doneCells = cells.filter(cell => cell.done && !cell.free).length;
  const openCells = cells.filter(cell => !cell.done).length;

  assert.equal(cfg.total, 9);
  assert.equal(doneCells, 7);
  assert.equal(openCells, 2);
  assert.ok(completedBingoLines(cells, cfg).length <= 3);
});

test('sixteen-cell bingo keeps four unfinished spaces and caps daily bonus lines', () => {
  const habits = Array.from({ length: 16 }, (_, index) => habit(`h${index + 1}`));
  const log = completed(habits.map(item => item.id));
  const cfg = bingoGridConfig(dailyCompletionCount(habits, log));

  const cells = buildBingoCells({ habits, log, rng: createBingoRng(16) });
  const doneCells = cells.filter(cell => cell.done && !cell.free).length;
  const openCells = cells.filter(cell => !cell.done).length;

  assert.equal(cfg.total, 16);
  assert.equal(doneCells, 12);
  assert.equal(openCells, 4);
  assert.ok(completedBingoLines(cells, cfg).length <= 4);
});

test('sixteen-cell bingo fills missing tasks with empty spaces instead of free spaces', () => {
  const habits = Array.from({ length: 14 }, (_, index) => habit(`h${index + 1}`));
  const log = completed(habits.slice(0, 10).map(item => item.id));
  const cfg = bingoGridConfig(dailyCompletionCount(habits, log));

  const cells = buildBingoCells({ habits, log, rng: createBingoRng(14) });

  assert.equal(cfg.total, 16);
  assert.equal(cells.filter(cell => cell.done && !cell.free).length, 10);
  assert.equal(cells.filter(cell => cell.free).length, 0);
  assert.equal(cells.filter(cell => !cell.done).length, 6);
});

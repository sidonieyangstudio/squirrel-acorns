const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('after-school alarm overlay stays hidden until an alarm opens it', () => {
  const styles = fs.readFileSync('styles.css', 'utf8');

  assert.match(styles, /\.alarm-overlay\[hidden\]\s*\{[^}]*display:\s*none\s*!important;[^}]*\}/s);
});

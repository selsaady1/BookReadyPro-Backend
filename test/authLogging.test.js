const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('authentication code does not log credentials or user records', () => {
  const root = path.resolve(__dirname, '..');
  for (const filename of ['auth.js', 'routes/auth.js']) {
    const source = fs.readFileSync(path.join(root, filename), 'utf8');
    assert.doesNotMatch(source, /console\.log/);
  }
});

test('ORM query logging is disabled in every environment', () => {
  const config = require('../config/config.json');
  for (const environment of ['development', 'test', 'production']) {
    assert.equal(config[environment].logging, false);
  }
});

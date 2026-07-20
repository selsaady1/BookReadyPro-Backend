const test = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULT_STALE_AFTER_MS, publicFile } = require('../utils/fileStatus');

function file(overrides = {}) {
  return {
    id: 1,
    createdAt: new Date(1_000).toISOString(),
    error: null,
    children: [],
    ...overrides,
  };
}

test('reports processing for a recent file without outputs', () => {
  const result = publicFile(file(), 1_000 + 30_000);
  assert.equal(result.status, 'processing');
  assert.equal(result.canRetry, false);
  assert.equal(result.processingSeconds, 30);
});

test('reports ready only when both output workbooks exist', () => {
  const result = publicFile(file({ children: [{ id: 1 }, { id: 2 }] }), 2_000);
  assert.equal(result.status, 'ready');
  assert.equal(result.canRetry, false);
});

test('reports failed records as retryable', () => {
  const result = publicFile(file({ error: 'processor failed' }), 2_000);
  assert.equal(result.status, 'failed');
  assert.equal(result.canRetry, true);
});

test('reports old incomplete records as stale and retryable', () => {
  const result = publicFile(file({ children: [{ id: 1 }] }), 1_000 + DEFAULT_STALE_AFTER_MS);
  assert.equal(result.status, 'stale');
  assert.equal(result.canRetry, true);
});

test('ages a retried file from its latest update', () => {
  const retryStartedAt = 1_000 + DEFAULT_STALE_AFTER_MS + 5_000;
  const result = publicFile(file({ updatedAt: new Date(retryStartedAt).toISOString() }), retryStartedAt + 2_000);
  assert.equal(result.status, 'processing');
  assert.equal(result.processingSeconds, 2);
  assert.equal(result.processingStartedAt, new Date(retryStartedAt).toISOString());
});

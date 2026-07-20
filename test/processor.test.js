const test = require('node:test');
const assert = require('node:assert/strict');
const { createDocumentJobHandler } = require('../jobs/processor');

function record(values) {
  return { ...values, async save() { this.saved = true; return this; } };
}

function harness({ responses, maxAttempts = 3 } = {}) {
  const outputs = [];
  const parent = record({ id: 7, error: null });
  const user = record({ id: 3, credit: 4 });
  let calls = 0;
  const axios = {
    async post(endpoint, data, config) {
      calls += 1;
      const next = responses[calls - 1];
      if (next instanceof Error) throw next;
      return next;
    },
  };
  const OutputFile = {
    async findOne({ where }) {
      return outputs.find((item) => item.name === where.name) || null;
    },
    async create(values) {
      const item = record(values);
      outputs.push(item);
      return item;
    },
  };
  const File = { async findOne() { return parent; } };
  const User = { async findOne() { return user; } };
  const logger = { log() {}, error() {} };
  const handler = createDocumentJobHandler({
    axios, File, OutputFile, User, endpoint: 'https://processor.test',
    timeoutMs: 1234, maxAttempts, wait: async () => {}, logger,
  });
  const job = { id: 'job-1', data: { realName: 'input.csv', userId: 3, fileId: 7, exists: false } };
  return { handler, job, outputs, parent, user, get calls() { return calls; } };
}

const success = {
  data: { transaction_analysis: 's3://transactions', grouped_sheet: 's3://categorized' },
};

test('awaits and persists both outputs before completing', async () => {
  const h = harness({ responses: [success] });
  const result = await h.handler(h.job);
  assert.deepEqual(result, { ok: true });
  assert.equal(h.outputs.length, 2);
  assert.match(h.outputs[0].name, /Transaction Analysis/);
  assert.match(h.outputs[1].name, /Categorized Items/);
});

test('retries transient processor failures and then succeeds', async () => {
  const h = harness({ responses: [new Error('temporary'), success] });
  const result = await h.handler(h.job);
  assert.deepEqual(result, { ok: true });
  assert.equal(h.calls, 2);
  assert.equal(h.outputs.length, 2);
  assert.equal(h.user.credit, 4);
});

test('records terminal failure and refunds a charged upload exactly once', async () => {
  const h = harness({ responses: [new Error('down')], maxAttempts: 1 });
  const first = await h.handler(h.job);
  assert.deepEqual(first, { ok: false });
  assert.match(h.parent.error, /failed after 1 attempts/);
  assert.equal(h.user.credit, 5);

  await h.handler(h.job);
  assert.equal(h.user.credit, 5);
});

test('upserts outputs so a redelivered job does not create duplicates', async () => {
  const h = harness({ responses: [success, success] });
  await h.handler(h.job);
  await h.handler(h.job);
  assert.equal(h.outputs.length, 2);
});

test('rejects an incomplete processor response instead of creating broken downloads', async () => {
  const h = harness({ responses: [{ data: { transaction_analysis: '', grouped_sheet: 's3://categorized' } }], maxAttempts: 1 });
  const result = await h.handler(h.job);
  assert.deepEqual(result, { ok: false });
  assert.equal(h.outputs.length, 0);
  assert.match(h.parent.error, /incomplete response/);
});

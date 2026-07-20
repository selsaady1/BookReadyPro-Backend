const PgBoss = require('pg-boss');
const axios = require('axios');
const { User, File, OutputFile } = require('../models');
const { createDocumentJobHandler } = require('./processor');

const boss = new PgBoss({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

let ready = false;
let startPromise = null;

async function init() {
  if (startPromise) return startPromise;
  startPromise = (async () => {
    const documentJobHandler = createDocumentJobHandler({
      axios,
      User,
      File,
      OutputFile,
      endpoint: process.env.excel_processing_endpoint,
    });
    boss.on('error', (error) => console.error('[bookreadypro/queue]', error));
    await boss.start();
    await boss.subscribe('excel', documentJobHandler);
    ready = true;
    console.log('[bookreadypro/queue] subscribed', { queue: 'excel' });
  })();
  return startPromise;
}

async function publishDocumentJob(data) {
  const jobId = await boss.publish('excel', data);
  if (!jobId) throw new Error('Queue did not return a job id');
  console.log('[bookreadypro/queue] published', { jobId, fileId: data.fileId });
  return jobId;
}

function isReady() {
  return ready;
}

module.exports = { boss, init, isReady, publishDocumentJob };

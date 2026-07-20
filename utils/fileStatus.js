const DEFAULT_STALE_AFTER_MS = 16 * 60 * 1000;

function staleAfterMs() {
  const configured = Number.parseInt(String(process.env.BRP_STALE_AFTER_MS || ''), 10);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_STALE_AFTER_MS;
}

function publicFile(file, now = Date.now()) {
  const data = typeof file.toJSON === 'function' ? file.toJSON() : { ...file };
  const children = Array.isArray(data.children) ? data.children : [];
  const createdAt = new Date(data.createdAt).getTime();
  const updatedAt = new Date(data.updatedAt).getTime();
  const processingStartedAt = Number.isFinite(updatedAt) && updatedAt > createdAt ? updatedAt : createdAt;
  const ageMs = Number.isFinite(processingStartedAt) ? Math.max(0, now - processingStartedAt) : 0;

  let status = 'processing';
  if (data.error) status = 'failed';
  else if (children.length >= 2) status = 'ready';
  else if (ageMs >= staleAfterMs()) status = 'stale';

  return {
    ...data,
    children,
    status,
    canRetry: status === 'failed' || status === 'stale',
    processingStartedAt: Number.isFinite(processingStartedAt) ? new Date(processingStartedAt).toISOString() : null,
    processingSeconds: Math.floor(ageMs / 1000),
  };
}

module.exports = { DEFAULT_STALE_AFTER_MS, publicFile };

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 3;

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function errorSummary(error) {
  const status = error && error.response && error.response.status;
  const code = error && error.code;
  const message = error && error.message ? error.message : String(error);
  return [status ? `HTTP ${status}` : null, code || null, message].filter(Boolean).join(' - ');
}

async function upsertOutput(OutputFile, values) {
  const existing = await OutputFile.findOne({
    where: {
      parentFileId: values.parentFileId,
      userId: values.userId,
      name: values.name,
    },
  });
  if (!existing) return OutputFile.create(values);
  existing.url = values.url;
  return existing.save();
}

async function markSuccessful(File, fileId) {
  const file = await File.findOne({ where: { id: fileId } });
  if (file && file.error) {
    file.error = null;
    await file.save();
  }
}

async function markFailed({ File, User, data, message }) {
  const file = await File.findOne({ where: { id: data.fileId } });
  if (!file) throw new Error(`Parent file ${data.fileId} no longer exists`);

  const alreadyFailed = Boolean(file.error);
  file.error = message;
  await file.save();

  if (!data.exists && !alreadyFailed) {
    const user = await User.findOne({ where: { id: data.userId } });
    if (user) {
      user.credit = Number(user.credit || 0) + 1;
      await user.save();
    }
  }
}

function validateProcessorResponse(response) {
  const data = response && response.data;
  if (!data || typeof data.transaction_analysis !== 'string' || !data.transaction_analysis.trim()
    || typeof data.grouped_sheet !== 'string' || !data.grouped_sheet.trim()) {
    throw new Error('Processor returned an incomplete response');
  }
  return data;
}

function createDocumentJobHandler({
  axios,
  File,
  OutputFile,
  User,
  endpoint,
  timeoutMs = positiveInt(process.env.EXCEL_PROCESSING_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
  maxAttempts = positiveInt(process.env.EXCEL_PROCESSING_MAX_ATTEMPTS, DEFAULT_MAX_ATTEMPTS),
  wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  logger = console,
}) {
  if (!endpoint) throw new Error('excel_processing_endpoint is not set');

  return async function documentJobHandler(job) {
    const data = job.data;
    const startedAt = Date.now();
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        logger.log('[bookreadypro/job] processor request started', {
          jobId: job.id,
          fileId: data.fileId,
          attempt,
          maxAttempts,
        });
        const response = await axios.post(endpoint, data, { timeout: timeoutMs });
        const output = validateProcessorResponse(response);
        const baseName = String(data.realName || 'statement').replace(/\.[^.]+$/, '');

        await Promise.all([
          upsertOutput(OutputFile, {
            name: `${baseName}_Transaction Analysis.xlsx`,
            url: output.transaction_analysis,
            userId: data.userId,
            parentFileId: data.fileId,
          }),
          upsertOutput(OutputFile, {
            name: `${baseName}_Categorized Items / Breakdown.xlsx`,
            url: output.grouped_sheet,
            userId: data.userId,
            parentFileId: data.fileId,
          }),
        ]);
        await markSuccessful(File, data.fileId);
        logger.log('[bookreadypro/job] completed', {
          jobId: job.id,
          fileId: data.fileId,
          attempt,
          durationMs: Date.now() - startedAt,
        });
        return { ok: true };
      } catch (error) {
        lastError = error;
        logger.error('[bookreadypro/job] attempt failed', {
          jobId: job.id,
          fileId: data.fileId,
          attempt,
          maxAttempts,
          error: errorSummary(error),
        });
        if (attempt < maxAttempts) await wait(Math.min(1000 * (2 ** (attempt - 1)), 5000));
      }
    }

    const message = `Processing failed after ${maxAttempts} attempts: ${errorSummary(lastError)}`;
    await markFailed({ File, User, data, message });
    logger.error('[bookreadypro/job] failed permanently', {
      jobId: job.id,
      fileId: data.fileId,
      durationMs: Date.now() - startedAt,
      error: errorSummary(lastError),
    });
    return { ok: false };
  };
}

module.exports = {
  createDocumentJobHandler,
  errorSummary,
  positiveInt,
  validateProcessorResponse,
};

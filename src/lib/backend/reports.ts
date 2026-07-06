import type { ContentReportInput, ContentReportResult } from './contracts';
import { getBackendProvider } from './config';
import { stradaApiFetch } from './httpClient';
import { readAppStorage, writeAppStorage } from '../persistentStorage';

const REPORTS_QUEUE_KEY = 'strada_reports_queue';

type QueuedReport = ContentReportInput & { id: string; createdAt: string };

async function queueReport(input: ContentReportInput): Promise<void> {
  const raw = readAppStorage(REPORTS_QUEUE_KEY);
  const queue: QueuedReport[] = raw ? (JSON.parse(raw) as QueuedReport[]) : [];
  queue.unshift({
    ...input,
    id: `rep_${Date.now()}`,
    createdAt: new Date().toISOString(),
  });
  await writeAppStorage(REPORTS_QUEUE_KEY, JSON.stringify(queue.slice(0, 50)));
}

export async function submitContentReport(input: ContentReportInput): Promise<ContentReportResult> {
  if (!input.targetEmail?.trim()) {
    return { ok: false, error: 'Indica a quién quieres reportar.' };
  }
  if (!input.reason) return { ok: false, error: 'Elige un motivo.' };

  if (getBackendProvider() === 'strada-api') {
    const res = await stradaApiFetch<{ received: boolean }>('/api/v1/reports', {
      method: 'POST',
      body: input,
    });
    if (res.ok) return { ok: true };
    await queueReport(input);
    return { ok: false, error: res.error };
  }

  await queueReport(input);
  return { ok: true };
}

export async function flushQueuedReports(): Promise<number> {
  if (getBackendProvider() !== 'strada-api') return 0;
  const raw = readAppStorage(REPORTS_QUEUE_KEY);
  if (!raw) return 0;
  const queue = JSON.parse(raw) as QueuedReport[];
  let sent = 0;
  const remaining: QueuedReport[] = [];
  for (const item of queue) {
    const { id: _id, createdAt: _c, ...payload } = item;
    const res = await stradaApiFetch('/api/v1/reports', { method: 'POST', body: payload });
    if (res.ok) sent += 1;
    else remaining.push(item);
  }
  await writeAppStorage(REPORTS_QUEUE_KEY, JSON.stringify(remaining));
  return sent;
}

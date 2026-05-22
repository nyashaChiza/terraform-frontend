import { apiFetch } from './api';

// AI generation can take 15-30 seconds (Gemini call + DB write + serialization).
// Give it 60 seconds before giving up — beyond that, something is genuinely wrong
// (network drop, AI provider outage) and we should let the user retry instead of
// leaving the spinner up indefinitely.
const GENERATE_TIMEOUT_MS = 60_000;

export async function generatePlan() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);
  try {
    return await apiFetch('/api/planner/generate', {
      method: 'GET',
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return {
        ok: false,
        status: 408,
        body: { detail: 'Generation took too long. Please try again.' } as any,
      };
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export default { generatePlan };

import { fireNotifications } from '@/lib/notifications-sender';

// Sends an alert (WhatsApp and/or email) when a CRITICAL error is logged, such as a customer
// who paid but whose order wasn't saved. Who gets it, by which channel and with what wording
// is set in Admin -> Notifications, on the rule with the trigger "Critical error logged"
// (seeded, switched off and with no recipients, by critical-error-alert-migration.sql).
// With no active rule nothing is sent, and the error is still in Admin -> System.

const MAX_ALERTS_PER_HOUR = 5;
const HOUR_MS = 60 * 60 * 1000;
const recentAlerts: number[] = [];   // per server instance: enough to stop a storm, not a precise count

/** Turns the saved details into a few readable lines, e.g. "customer: Asha Verma, +91..., a@b.com". */
export function formatDetails(details: Record<string, unknown> | undefined): string {
  if (!details) return 'No further details.';
  const lines: string[] = [];
  for (const [key, value] of Object.entries(details)) {
    if (value === undefined || value === null || value === '') continue;
    let text: string;
    if (Array.isArray(value)) {
      text = value
        .map((v) => (v && typeof v === 'object'
          ? Object.values(v as Record<string, unknown>).filter((x) => x !== undefined && x !== null).join(' x ')
          : String(v)))
        .join('; ');
    } else if (typeof value === 'object') {
      text = Object.values(value as Record<string, unknown>).filter((x) => x !== undefined && x !== null && x !== '').join(', ');
    } else {
      text = String(value);
    }
    if (text) lines.push(`${key}: ${text}`);
  }
  const joined = lines.join('\n');
  return joined.length > 700 ? `${joined.slice(0, 700)}…` : joined || 'No further details.';
}

/** Never throws: an alert that can't be sent must not turn into a second failure. */
export async function sendCriticalAlert(
  source: string,
  message: string,
  details?: Record<string, unknown>,
): Promise<void> {
  const now = Date.now();
  while (recentAlerts.length && now - recentAlerts[0] > HOUR_MS) recentAlerts.shift();
  if (recentAlerts.length >= MAX_ALERTS_PER_HOUR) {
    console.warn('[critical-alert] too many alerts this hour; not sending another (still listed in Admin -> System).');
    return;
  }
  recentAlerts.push(now);

  try {
    await fireNotifications('critical_error', {
      source,
      message,
      details: formatDetails(details),
      time: `${new Date(now).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })} IST`,
    });
  } catch (err) {
    console.error('[critical-alert] could not send the alert:', err instanceof Error ? err.message : err);
  }
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Download, RefreshCw, Trash2, Undo2 } from 'lucide-react';

interface ErrorRow {
  id: number;
  source: string;
  severity: 'critical' | 'error' | 'warning';
  message: string;
  details: Record<string, unknown> | null;
  occurrences: number;
  first_seen: string;
  last_seen: string;
  resolved: boolean;
}

const SEVERITY_STYLE: Record<ErrorRow['severity'], string> = {
  critical: 'bg-red-500/15 text-red-300 border-red-500/40',
  error:    'bg-amber-500/15 text-amber-300 border-amber-500/40',
  warning:  'bg-blue-500/15 text-blue-300 border-blue-500/30',
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function SystemPage() {
  const [errors, setErrors]           = useState<ErrorRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [loadError, setLoadError]     = useState('');
  const [showResolved, setShowResolved] = useState(false);
  const [openId, setOpenId]           = useState<number | null>(null);
  const [backupBusy, setBackupBusy]   = useState(false);
  const [backupError, setBackupError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/admin/errors');
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setLoadError(body.error ?? 'Could not load errors.'); return; }
      setErrors(body.errors ?? []);
      setTableMissing(!!body.tableMissing);
    } catch {
      setLoadError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setResolved = async (id: number, resolved: boolean) => {
    setErrors((rows) => rows.map((r) => (r.id === id ? { ...r, resolved } : r)));
    const res = await fetch('/api/admin/errors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, resolved }),
    });
    if (!res.ok) load();
  };

  const clearResolved = async () => {
    await fetch('/api/admin/errors', { method: 'DELETE' });
    load();
  };

  const downloadBackup = async () => {
    setBackupBusy(true);
    setBackupError('');
    try {
      const res = await fetch('/api/admin/backup');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setBackupError(body.error ?? 'Backup failed.');
        return;
      }
      const blob = await res.blob();
      const name = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') ?? '')?.[1] ?? 'ssp-backup.json';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setBackupError('Could not reach the server.');
    } finally {
      setBackupBusy(false);
    }
  };

  const open = errors.filter((e) => !e.resolved);
  const resolved = errors.filter((e) => e.resolved);
  const visible = showResolved ? errors : open;

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-cinzel text-gold text-xl font-bold">System</h1>
        <p className="text-cream/45 text-sm mt-1">Errors the shop has run into, and a copy of your data.</p>
      </div>

      {/* ── Errors ───────────────────────────────────────────────── */}
      <section className="gold-border rounded-xl bg-[#0F0000] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-cinzel text-cream font-semibold">Errors</h2>
            <p className="text-cream/40 text-xs mt-0.5">
              {open.length === 0 ? 'Nothing needs attention.' : `${open.length} open`}
              {resolved.length > 0 && ` · ${resolved.length} resolved`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <label className="flex items-center gap-1.5 text-cream/60 cursor-pointer">
              <input type="checkbox" className="accent-[#C9A84C]" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
              Show resolved
            </label>
            {resolved.length > 0 && (
              <button onClick={clearResolved} className="flex items-center gap-1 text-cream/50 hover:text-red-400">
                <Trash2 size={12} /> Clear resolved
              </button>
            )}
            <button onClick={load} className="flex items-center gap-1 text-gold/80 hover:text-gold">
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {tableMissing && (
          <p className="text-amber-300/90 text-sm bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
            The error log isn’t switched on yet. Run <code>error-logs.sql</code> once in the Supabase SQL editor. Until then,
            errors are only kept in Vercel’s own logs.
          </p>
        )}
        {loadError && <p className="text-red-400 text-sm mb-4">{loadError}</p>}

        {!loading && !tableMissing && visible.length === 0 && (
          <div className="flex items-center gap-2 text-emerald-400/90 text-sm py-6 justify-center">
            <CheckCircle size={16} /> All clear.
          </div>
        )}

        <ul className="space-y-2">
          {visible.map((e) => (
            <li key={e.id} className={`rounded-lg border ${e.resolved ? 'border-gold/5 opacity-60' : 'border-gold/15'} bg-[#060000]`}>
              <button
                type="button"
                onClick={() => setOpenId(openId === e.id ? null : e.id)}
                className="w-full text-left px-4 py-3 flex items-start gap-3"
              >
                <span className={`mt-0.5 text-[10px] font-cinzel font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border flex-shrink-0 ${SEVERITY_STYLE[e.severity]}`}>
                  {e.severity}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-cream text-sm break-words">{e.message}</span>
                  <span className="block text-cream/35 text-[11px] mt-0.5">
                    {e.source} · {fmt(e.last_seen)}
                    {e.occurrences > 1 && ` · happened ${e.occurrences} times since ${fmt(e.first_seen)}`}
                  </span>
                </span>
                {e.severity === 'critical' && !e.resolved && <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />}
              </button>

              {openId === e.id && (
                <div className="px-4 pb-4 border-t border-gold/5 pt-3">
                  {e.details && (
                    <pre className="text-[11px] text-cream/70 bg-black/40 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words">
                      {JSON.stringify(e.details, null, 2)}
                    </pre>
                  )}
                  <div className="mt-3">
                    {e.resolved ? (
                      <button onClick={() => setResolved(e.id, false)} className="flex items-center gap-1 text-xs text-cream/60 hover:text-cream">
                        <Undo2 size={12} /> Reopen
                      </button>
                    ) : (
                      <button onClick={() => setResolved(e.id, true)} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300">
                        <CheckCircle size={12} /> Mark as resolved
                      </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* ── Backup ───────────────────────────────────────────────── */}
      <section className="gold-border rounded-xl bg-[#0F0000] p-5">
        <h2 className="font-cinzel text-cream font-semibold">Backup</h2>
        <p className="text-cream/50 text-sm mt-1 mb-4">
          Download a copy of your orders, books, notification rules, saved addresses and wishlists as one file. Keep it somewhere
          private, because it contains customers’ names, phone numbers and addresses. Customer login accounts are not part of
          it; Supabase keeps those.
        </p>
        <button
          onClick={downloadBackup}
          disabled={backupBusy}
          className="flex items-center gap-2 bg-gold hover:bg-gold-300 disabled:opacity-50 text-dark font-cinzel font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          <Download size={16} /> {backupBusy ? 'Preparing…' : 'Download backup'}
        </button>
        {backupError && <p className="text-red-400 text-sm mt-3">{backupError}</p>}
      </section>
    </div>
  );
}

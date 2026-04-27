'use client';

import { useState } from 'react';
import { Bell, Plus, Trash2, Pause, Play, Mail, Edit3, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import {
  useNotificationsStore,
  parseDescription,
  TEMPLATES,
  type NotificationRule,
  type NotificationTrigger,
} from '@/lib/notifications-store';

const TRIGGER_LABELS: Record<NotificationTrigger, string> = {
  order_placed:   'Every new order',
  daily_digest:   'Daily at 8:00 AM',
  weekly_digest:  'Every Monday 8:00 AM',
  cart_abandoned: 'Cart abandoned (1h)',
};

const TRIGGER_COLORS: Record<NotificationTrigger, string> = {
  order_placed:   'bg-green-500/15 text-green-300 border-green-500/30',
  daily_digest:   'bg-blue-500/15 text-blue-300 border-blue-500/30',
  weekly_digest:  'bg-purple-500/15 text-purple-300 border-purple-500/30',
  cart_abandoned: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
};

function EmailPreview({ subject, body }: { subject: string; body: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 text-sm font-sans">
      {/* Email client chrome */}
      <div className="bg-gray-100 px-4 py-2.5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="ml-2 text-gray-500 text-xs font-medium">Email Preview</span>
        </div>
      </div>
      {/* Header */}
      <div className="bg-white px-5 py-3 border-b border-gray-100">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-gray-400 text-xs w-16">From:</span>
          <span className="text-gray-700 text-xs">Sangit Shree Prakashan &lt;noreply@sangitshreeprakashan.com&gt;</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-gray-400 text-xs w-16">Subject:</span>
          <span className="text-gray-900 text-xs font-semibold">{subject}</span>
        </div>
      </div>
      {/* Body */}
      <div className="bg-white px-5 py-4 min-h-[160px]">
        <pre className="text-gray-700 text-xs leading-relaxed whitespace-pre-wrap font-sans">{body}</pre>
      </div>
      {/* Footer */}
      <div className="bg-gray-50 px-5 py-2.5 border-t border-gray-100">
        <p className="text-gray-400 text-[10px]">Sangit Shree Prakashan, Kanpur, UP - 208002, India</p>
      </div>
    </div>
  );
}

function RuleCard({ rule }: { rule: NotificationRule }) {
  const { updateRule, deleteRule, toggleRule } = useNotificationsStore();
  const [expanded, setExpanded] = useState(false);
  const [editSubject, setEditSubject] = useState(rule.subject);
  const [editBody,    setEditBody]    = useState(rule.body);
  const [editEmails,  setEditEmails]  = useState(rule.recipients.join(', '));
  const [editing,     setEditing]     = useState(false);

  const saveEdit = () => {
    updateRule(rule.id, {
      subject:    editSubject,
      body:       editBody,
      recipients: editEmails.split(',').map((e) => e.trim()).filter(Boolean),
    });
    setEditing(false);
  };

  return (
    <div className={`bg-[#0A0000] border rounded-2xl transition-colors ${rule.active ? 'border-gold/15' : 'border-white/5 opacity-60'}`}>
      {/* Summary row */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${rule.active ? 'bg-gold/15' : 'bg-white/5'}`}>
          <Bell size={14} className={rule.active ? 'text-gold' : 'text-cream/30'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-cinzel text-cream text-sm font-semibold truncate">{rule.name}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className={`text-[9px] font-cinzel font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${TRIGGER_COLORS[rule.trigger]}`}>
              {TRIGGER_LABELS[rule.trigger]}
            </span>
            <span className="text-cream/35 text-[10px] flex items-center gap-1">
              <Mail size={9} /> {rule.recipients.length} recipient{rule.recipients.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => toggleRule(rule.id)}
            title={rule.active ? 'Pause' : 'Activate'}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${rule.active ? 'text-gold/60 hover:text-yellow-400 hover:bg-yellow-400/10' : 'text-green-400/60 hover:text-green-400 hover:bg-green-400/10'}`}
          >
            {rule.active ? <Pause size={12} /> : <Play size={12} />}
          </button>
          <button
            onClick={() => setExpanded((p) => !p)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-cream/30 hover:text-cream transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={() => deleteRule(rule.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-gold/8 pt-4 space-y-4">
          {!editing ? (
            <>
              <EmailPreview subject={rule.subject} body={rule.body} />
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-cream/35 text-[10px] font-cinzel uppercase tracking-widest mb-1">Recipients</p>
                  <div className="flex flex-wrap gap-1.5">
                    {rule.recipients.map((email) => (
                      <span key={email} className="border border-gold/20 rounded-full px-2.5 py-0.5 text-cream/60 text-[11px] font-cinzel">
                        {email}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => { setEditing(true); setEditSubject(rule.subject); setEditBody(rule.body); setEditEmails(rule.recipients.join(', ')); }}
                  className="flex items-center gap-1.5 border border-gold/25 hover:border-gold/50 text-gold/70 hover:text-gold font-cinzel text-xs px-3 py-1.5 rounded-lg transition-all"
                >
                  <Edit3 size={11} /> Edit Template
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-cream/40 text-[10px] font-cinzel uppercase tracking-widest mb-1">Subject</label>
                <input
                  className="input-gold text-sm"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-cream/40 text-[10px] font-cinzel uppercase tracking-widest mb-1">
                  Body <span className="normal-case text-cream/25">(use {'{{variables}}'} as placeholders)</span>
                </label>
                <textarea
                  className="input-gold text-sm h-52 resize-none font-mono text-xs leading-relaxed"
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-cream/40 text-[10px] font-cinzel uppercase tracking-widest mb-1">
                  Recipients (comma separated)
                </label>
                <input
                  className="input-gold text-sm"
                  value={editEmails}
                  onChange={(e) => setEditEmails(e.target.value)}
                  placeholder="owner@example.com, backup@example.com"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={saveEdit} className="flex items-center gap-1.5 bg-gold hover:bg-gold-300 text-dark font-cinzel font-bold text-xs px-4 py-2 rounded-lg transition-colors">
                  <Check size={12} /> Save Changes
                </button>
                <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 border border-white/10 text-cream/50 hover:text-cream font-cinzel text-xs px-4 py-2 rounded-lg transition-colors">
                  <X size={12} /> Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const { rules, addRule } = useNotificationsStore();

  const [desc,      setDesc]      = useState('');
  const [parsed,    setParsed]    = useState<ReturnType<typeof parseDescription> | null>(null);
  const [subject,   setSubject]   = useState('');
  const [body,      setBody]      = useState('');
  const [emails,    setEmails]    = useState('');
  const [newEmail,  setNewEmail]  = useState('');
  const [saved,     setSaved]     = useState(false);

  const handleParse = () => {
    if (!desc.trim()) return;
    const result = parseDescription(desc);
    setParsed(result);
    setSubject(result.subject);
    setBody(result.body);
    setEmails(result.detectedEmails.join(', '));
    setSaved(false);
  };

  const handleAddEmail = () => {
    if (!newEmail.trim()) return;
    const existing = emails.split(',').map((e) => e.trim()).filter(Boolean);
    if (!existing.includes(newEmail.trim())) {
      setEmails([...existing, newEmail.trim()].join(', '));
    }
    setNewEmail('');
  };

  const handleCreate = () => {
    if (!parsed) return;
    const rule: NotificationRule = {
      id:          `notif-${Date.now()}`,
      name:        parsed.name,
      description: desc,
      trigger:     parsed.trigger,
      recipients:  emails.split(',').map((e) => e.trim()).filter(Boolean),
      subject,
      body,
      active:      true,
      createdAt:   new Date().toISOString(),
    };
    addRule(rule);
    setSaved(true);
    setDesc('');
    setParsed(null);
    setSubject('');
    setBody('');
    setEmails('');
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="font-cinzel text-2xl font-bold text-cream">Notifications</h1>
        <p className="text-cream/40 text-sm mt-1">Define when and how you want to be notified about store activity.</p>
      </div>

      {/* Creator */}
      <div className="bg-[#0A0000] border border-gold/15 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Plus size={15} className="text-gold" />
          <h2 className="font-cinzel text-cream font-semibold text-sm">Create a Notification</h2>
        </div>

        {/* Natural language input */}
        <div>
          <label className="block text-cream/40 text-[10px] font-cinzel uppercase tracking-widest mb-2">
            Describe what you want
          </label>
          <textarea
            className="input-gold h-24 resize-none text-sm leading-relaxed"
            placeholder={`Examples:\n"Email me every time an order is placed with full order details"\n"Send a daily digest every morning at 8 AM to owner@shop.com"`}
            value={desc}
            onChange={(e) => { setDesc(e.target.value); setParsed(null); setSaved(false); }}
          />
          <button
            onClick={handleParse}
            disabled={!desc.trim()}
            className="mt-2 bg-gold/10 hover:bg-gold/20 disabled:opacity-40 border border-gold/25 text-gold font-cinzel text-xs px-4 py-2 rounded-lg transition-all"
          >
            Parse and Preview
          </button>
        </div>

        {/* Parsed result + preview */}
        {parsed && (
          <div className="space-y-4 pt-2 border-t border-gold/10">
            {/* Detected */}
            <div className="flex flex-wrap gap-3 items-center">
              <div>
                <p className="text-cream/35 text-[10px] font-cinzel uppercase tracking-widest mb-1">Detected Trigger</p>
                <span className={`text-[10px] font-cinzel font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${TRIGGER_COLORS[parsed.trigger]}`}>
                  {TRIGGER_LABELS[parsed.trigger]}
                </span>
              </div>
              <div>
                <p className="text-cream/35 text-[10px] font-cinzel uppercase tracking-widest mb-1">Notification Name</p>
                <p className="text-cream/70 text-xs font-cinzel">{parsed.name}</p>
              </div>
            </div>

            {/* Subject edit */}
            <div>
              <label className="block text-cream/40 text-[10px] font-cinzel uppercase tracking-widest mb-1.5">Email Subject</label>
              <input
                className="input-gold text-sm"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Body edit */}
            <div>
              <label className="block text-cream/40 text-[10px] font-cinzel uppercase tracking-widest mb-1.5">
                Email Body <span className="normal-case text-cream/25 ml-1">(edit if needed)</span>
              </label>
              <textarea
                className="input-gold h-52 resize-none font-mono text-xs leading-relaxed"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            {/* Preview */}
            <div>
              <p className="text-cream/35 text-[10px] font-cinzel uppercase tracking-widest mb-2">Preview</p>
              <EmailPreview subject={subject} body={body} />
            </div>

            {/* Recipients */}
            <div>
              <label className="block text-cream/40 text-[10px] font-cinzel uppercase tracking-widest mb-1.5">
                Recipients
              </label>
              <div className="flex gap-2 flex-wrap mb-2">
                {emails.split(',').map((e) => e.trim()).filter(Boolean).map((email) => (
                  <span key={email} className="flex items-center gap-1.5 border border-gold/20 rounded-full px-2.5 py-0.5 text-cream/60 text-xs font-cinzel">
                    <Mail size={9} className="text-gold/50" /> {email}
                    <button
                      onClick={() => setEmails(emails.split(',').map((e) => e.trim()).filter((e) => e !== email).join(', '))}
                      className="text-cream/30 hover:text-red-400 ml-0.5"
                    >
                      <X size={9} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className="input-gold text-sm flex-1"
                  type="email"
                  placeholder="Add email address..."
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
                />
                <button
                  onClick={handleAddEmail}
                  className="border border-gold/25 hover:border-gold/50 text-gold/70 hover:text-gold font-cinzel text-xs px-4 py-2 rounded-xl transition-all flex-shrink-0"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Create button */}
            <button
              onClick={handleCreate}
              disabled={!emails.trim() || saved}
              className="w-full bg-gold hover:bg-gold-300 disabled:opacity-50 text-dark font-cinzel font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {saved ? <><Check size={16} /> Notification Created!</> : <><Bell size={15} /> Create Notification</>}
            </button>
          </div>
        )}
      </div>

      {/* Active notifications */}
      <div>
        <h2 className="font-cinzel text-cream font-semibold text-sm mb-4 flex items-center gap-2">
          <Bell size={14} className="text-gold" />
          Active Notifications
          {rules.length > 0 && (
            <span className="bg-gold/15 text-gold text-[10px] font-bold px-2 py-0.5 rounded-full border border-gold/20">
              {rules.length}
            </span>
          )}
        </h2>

        {rules.length === 0 ? (
          <div className="bg-[#0A0000] border border-gold/8 rounded-2xl p-12 text-center">
            <Bell size={32} className="text-cream/15 mx-auto mb-3" />
            <p className="font-cinzel text-cream/30 text-sm">No notifications configured yet.</p>
            <p className="text-cream/20 text-xs mt-1">Use the form above to create your first notification.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => <RuleCard key={rule.id} rule={rule} />)}
          </div>
        )}
      </div>
    </div>
  );
}

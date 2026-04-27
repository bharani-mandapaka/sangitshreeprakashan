'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Bell, Plus, Trash2, Pause, Play, Mail, MessageCircle,
  Edit3, Check, X, ChevronDown, ChevronUp, Layers, Users,
  CheckCircle, Phone,
} from 'lucide-react';
import {
  useNotificationsStore,
  parseDescription,
  type NotificationRule,
  type NotificationTrigger,
  type NotificationChannel,
} from '@/lib/notifications-store';
import { useUsersStore, initials, type AppUser } from '@/lib/users-store';

// ── Constants ──────────────────────────────────────────────────────────────────
const TRIGGER_LABELS: Record<NotificationTrigger, string> = {
  order_placed:   'Every new order',
  daily_digest:   'Daily at 8:00 AM',
  weekly_digest:  'Every Monday 8:00 AM',
  cart_abandoned: 'Cart abandoned (1 h)',
};

const TRIGGER_COLORS: Record<NotificationTrigger, string> = {
  order_placed:   'bg-green-500/15 text-green-300 border-green-500/30',
  daily_digest:   'bg-blue-500/15 text-blue-300 border-blue-500/30',
  weekly_digest:  'bg-purple-500/15 text-purple-300 border-purple-500/30',
  cart_abandoned: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
};

const CHANNEL_META: Record<NotificationChannel, { label: string; icon: React.ReactNode; color: string }> = {
  email:    { label: 'Email',            icon: <Mail size={11} />,          color: 'text-blue-300' },
  whatsapp: { label: 'WhatsApp',         icon: <MessageCircle size={11} />, color: 'text-green-300' },
  both:     { label: 'Email + WhatsApp', icon: <Layers size={11} />,        color: 'text-gold' },
};

// ── Email preview ──────────────────────────────────────────────────────────────
function EmailPreview({ subject, body }: { subject: string; body: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 text-sm font-sans">
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="ml-2 text-gray-400 text-[10px] font-medium flex items-center gap-1">
          <Mail size={9} /> Email Preview
        </span>
      </div>
      <div className="bg-white px-5 py-3 border-b border-gray-100">
        <div className="flex gap-2 mb-1">
          <span className="text-gray-400 text-xs w-14">From:</span>
          <span className="text-gray-600 text-xs">Sangit Shree Prakashan &lt;noreply@sangitshreeprakashan.com&gt;</span>
        </div>
        <div className="flex gap-2">
          <span className="text-gray-400 text-xs w-14">Subject:</span>
          <span className="text-gray-900 text-xs font-semibold">{subject}</span>
        </div>
      </div>
      <div className="bg-white px-5 py-4">
        <pre className="text-gray-700 text-xs leading-relaxed whitespace-pre-wrap font-sans">{body}</pre>
      </div>
      <div className="bg-gray-50 px-5 py-2 border-t border-gray-100">
        <p className="text-gray-400 text-[10px]">Sangit Shree Prakashan, Kanpur, UP 208002, India</p>
      </div>
    </div>
  );
}

// ── WhatsApp preview ───────────────────────────────────────────────────────────
function WhatsAppPreview({ message }: { message: string }) {
  const renderLine = (line: string, idx: number) => {
    const parts = line.split(/(\*[^*]+\*)/g);
    return (
      <span key={idx}>
        {parts.map((p, i) =>
          p.startsWith('*') && p.endsWith('*')
            ? <strong key={i} className="font-semibold">{p.slice(1, -1)}</strong>
            : p.startsWith('_') && p.endsWith('_')
              ? <em key={i}>{p.slice(1, -1)}</em>
              : <span key={i}>{p}</span>
        )}
      </span>
    );
  };

  const lines = message.split('\n');

  return (
    <div className="rounded-xl overflow-hidden border border-[#1a1a1a] font-sans">
      <div className="bg-[#075E54] px-4 py-2.5 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4" fill="white" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.771.469 3.53 1.36 5.07L2.05 22l5.077-1.29A10.01 10.01 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.378-1.232l-.314-.187-3.012.765.793-2.93-.203-.328A8 8 0 1112 20z" />
          </svg>
        </div>
        <div>
          <p className="text-white text-xs font-semibold">Sangit Shree Prakashan</p>
          <p className="text-[#b2dfdb] text-[10px]">WhatsApp Business</p>
        </div>
        <span className="ml-auto text-[#b2dfdb] text-[10px]">Preview</span>
      </div>
      <div className="bg-[#ECE5DD] px-4 py-4 min-h-[160px]"
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d4c4b0\' fill-opacity=\'0.3\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
        <div className="flex justify-end">
          <div className="bg-[#DCF8C6] rounded-tl-xl rounded-bl-xl rounded-tr-sm rounded-br-xl px-3.5 py-2.5 max-w-xs shadow-sm">
            <p className="text-[#111] text-xs leading-relaxed whitespace-pre-wrap">
              {lines.map((line, i) => (
                <span key={i}>{renderLine(line, i)}{i < lines.length - 1 ? '\n' : ''}</span>
              ))}
            </p>
            <div className="flex items-center justify-end gap-1 mt-1.5">
              <span className="text-[#8d9fa0] text-[9px]">
                {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <svg className="w-3 h-2.5" viewBox="0 0 16 11" fill="none">
                <path d="M1 5.5L5 9.5L10 1M6 9.5L15 1" stroke="#4FC3F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Channel badge ──────────────────────────────────────────────────────────────
function ChannelBadge({ channel }: { channel: NotificationChannel }) {
  const m = CHANNEL_META[channel];
  return (
    <span className={`flex items-center gap-1 text-[9px] font-cinzel font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/10 bg-white/5 ${m.color}`}>
      {m.icon} {m.label}
    </span>
  );
}

// ── User picker dropdown ───────────────────────────────────────────────────────
type PickerMode = 'email' | 'phone';

function UserPicker({
  mode,
  onSelect,
}: {
  mode: PickerMode;
  onSelect: (value: string) => void;
}) {
  const users = useUsersStore((s) => s.users);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const eligible = users.filter((u) =>
    mode === 'email' ? !!u.email : !!u.phone
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 border border-gold/20 hover:border-gold/40 text-gold/60 hover:text-gold font-cinzel text-xs px-3 py-2 rounded-xl transition-all flex-shrink-0"
        title="Select from users"
      >
        <Users size={11} />
        Users
        <ChevronDown size={9} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-64 bg-[#0F0000] border border-gold/20 rounded-xl shadow-2xl overflow-hidden">
          <div className="px-3 py-2 border-b border-gold/10">
            <p className="text-[10px] font-cinzel text-cream/40 uppercase tracking-widest">
              Select {mode === 'email' ? 'email recipient' : 'WhatsApp number'}
            </p>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {eligible.length === 0 ? (
              <p className="px-3 py-4 text-center text-cream/25 text-xs font-cinzel">No users with {mode === 'email' ? 'email' : 'phone'}</p>
            ) : (
              eligible.map((user) => {
                const value = mode === 'email' ? user.email : user.phone;
                const verified = mode === 'email' ? user.emailVerified : user.phoneVerified;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => { onSelect(value); setOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
                  >
                    {/* Mini avatar */}
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-cinzel font-bold text-white"
                      style={{ background: user.color, fontSize: 8 }}
                    >
                      {initials(user.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-cream text-xs font-cinzel truncate">{user.name}</p>
                      <p className="text-cream/40 text-[10px] truncate">{value}</p>
                    </div>
                    {verified && <CheckCircle size={10} className="text-green-400 flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Rule card ──────────────────────────────────────────────────────────────────
function RuleCard({ rule }: { rule: NotificationRule }) {
  const { updateRule, deleteRule, toggleRule } = useNotificationsStore();
  const [expanded,    setExpanded]    = useState(false);
  const [editing,     setEditing]     = useState(false);
  const [editSubject, setEditSubject] = useState(rule.subject);
  const [editBody,    setEditBody]    = useState(rule.body);
  const [editWaMsg,   setEditWaMsg]   = useState(rule.whatsappMessage);
  const [editEmails,  setEditEmails]  = useState(rule.recipients.join(', '));
  const [editPhones,  setEditPhones]  = useState(rule.whatsappNumbers.join(', '));
  const [newEmail,    setNewEmail]    = useState('');
  const [newPhone,    setNewPhone]    = useState('');

  const addChip = (
    list: string, setter: (v: string) => void,
    newVal: string, clearNew: (v: string) => void,
  ) => {
    if (!newVal.trim()) return;
    const arr = list.split(',').map((x) => x.trim()).filter(Boolean);
    if (!arr.includes(newVal.trim())) setter([...arr, newVal.trim()].join(', '));
    clearNew('');
  };

  const removeChip = (list: string, setter: (v: string) => void, val: string) =>
    setter(list.split(',').map((x) => x.trim()).filter((x) => x && x !== val).join(', '));

  const saveEdit = () => {
    updateRule(rule.id, {
      subject:         editSubject,
      body:            editBody,
      whatsappMessage: editWaMsg,
      recipients:      editEmails.split(',').map((e) => e.trim()).filter(Boolean),
      whatsappNumbers: editPhones.split(',').map((p) => p.trim()).filter(Boolean),
    });
    setEditing(false);
  };

  const showEmail    = rule.channel === 'email'    || rule.channel === 'both';
  const showWhatsApp = rule.channel === 'whatsapp' || rule.channel === 'both';

  return (
    <div className={`bg-[#0A0000] border rounded-2xl transition-colors ${rule.active ? 'border-gold/15' : 'border-white/5 opacity-60'}`}>
      {/* Summary */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${rule.active ? 'bg-gold/15' : 'bg-white/5'}`}>
          <Bell size={14} className={rule.active ? 'text-gold' : 'text-cream/30'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-cinzel text-cream text-sm font-semibold truncate">{rule.name}</p>
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            <span className={`text-[9px] font-cinzel font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${TRIGGER_COLORS[rule.trigger]}`}>
              {TRIGGER_LABELS[rule.trigger]}
            </span>
            <ChannelBadge channel={rule.channel} />
            {showEmail && rule.recipients.length > 0 && (
              <span className="text-cream/35 text-[10px] flex items-center gap-1">
                <Mail size={9} /> {rule.recipients.length}
              </span>
            )}
            {showWhatsApp && rule.whatsappNumbers.length > 0 && (
              <span className="text-cream/35 text-[10px] flex items-center gap-1">
                <MessageCircle size={9} /> {rule.whatsappNumbers.length}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={() => toggleRule(rule.id)} title={rule.active ? 'Pause' : 'Activate'}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${rule.active ? 'text-gold/60 hover:text-yellow-400 hover:bg-yellow-400/10' : 'text-green-400/60 hover:text-green-400 hover:bg-green-400/10'}`}>
            {rule.active ? <Pause size={12} /> : <Play size={12} />}
          </button>
          <button onClick={() => setExpanded((p) => !p)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-cream/30 hover:text-cream transition-colors">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button onClick={() => deleteRule(rule.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400/40 hover:text-red-400 hover:bg-red-400/10 transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-gold/8 pt-4 space-y-5">
          {!editing ? (
            <>
              {showEmail && (
                <div>
                  <p className="text-cream/35 text-[10px] font-cinzel uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Mail size={10} /> Email Template
                  </p>
                  <EmailPreview subject={rule.subject} body={rule.body} />
                  {rule.recipients.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {rule.recipients.map((e) => (
                        <span key={e} className="border border-blue-500/20 bg-blue-500/5 rounded-full px-2.5 py-0.5 text-blue-300 text-[11px] font-cinzel">
                          {e}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {showWhatsApp && (
                <div>
                  <p className="text-cream/35 text-[10px] font-cinzel uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <MessageCircle size={10} /> WhatsApp Message
                  </p>
                  <WhatsAppPreview message={rule.whatsappMessage} />
                  {rule.whatsappNumbers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {rule.whatsappNumbers.map((p) => (
                        <span key={p} className="border border-green-500/20 bg-green-500/5 rounded-full px-2.5 py-0.5 text-green-300 text-[11px] font-cinzel">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button onClick={() => {
                setEditing(true);
                setEditSubject(rule.subject);
                setEditBody(rule.body);
                setEditWaMsg(rule.whatsappMessage);
                setEditEmails(rule.recipients.join(', '));
                setEditPhones(rule.whatsappNumbers.join(', '));
              }}
                className="flex items-center gap-1.5 border border-gold/25 hover:border-gold/50 text-gold/70 hover:text-gold font-cinzel text-xs px-3 py-1.5 rounded-lg transition-all">
                <Edit3 size={11} /> Edit Templates
              </button>
            </>
          ) : (
            <div className="space-y-4">
              {showEmail && (
                <div className="space-y-3">
                  <p className="text-blue-300/70 text-[10px] font-cinzel uppercase tracking-widest flex items-center gap-1.5"><Mail size={10} /> Email</p>
                  <div>
                    <label className="block text-cream/40 text-[10px] font-cinzel uppercase tracking-widest mb-1">Subject</label>
                    <input className="input-gold text-sm" value={editSubject} onChange={(e) => setEditSubject(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-cream/40 text-[10px] font-cinzel uppercase tracking-widest mb-1">Body</label>
                    <textarea className="input-gold text-xs h-44 resize-none font-mono leading-relaxed" value={editBody} onChange={(e) => setEditBody(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-cream/40 text-[10px] font-cinzel uppercase tracking-widest mb-1.5">Recipients</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {editEmails.split(',').map((e) => e.trim()).filter(Boolean).map((em) => (
                        <span key={em} className="flex items-center gap-1.5 border border-blue-500/20 bg-blue-500/5 rounded-full px-2.5 py-0.5 text-blue-300 text-[11px] font-cinzel">
                          <Mail size={9} /> {em}
                          <button onClick={() => removeChip(editEmails, setEditEmails, em)} className="text-cream/30 hover:text-red-400 ml-0.5"><X size={9} /></button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input className="input-gold text-sm flex-1" type="email" placeholder="Add email..." value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addChip(editEmails, setEditEmails, newEmail, setNewEmail)} />
                      <button onClick={() => addChip(editEmails, setEditEmails, newEmail, setNewEmail)} className="border border-gold/25 hover:border-gold/50 text-gold/70 hover:text-gold font-cinzel text-xs px-3 py-2 rounded-xl transition-all flex-shrink-0">+ Add</button>
                      <UserPicker mode="email" onSelect={(v) => addChip(editEmails, setEditEmails, v, () => {})} />
                    </div>
                  </div>
                </div>
              )}
              {showWhatsApp && (
                <div className="space-y-3">
                  <p className="text-green-300/70 text-[10px] font-cinzel uppercase tracking-widest flex items-center gap-1.5"><MessageCircle size={10} /> WhatsApp</p>
                  <div>
                    <label className="block text-cream/40 text-[10px] font-cinzel uppercase tracking-widest mb-1">Message <span className="normal-case text-cream/25">(use *bold* _italic_)</span></label>
                    <textarea className="input-gold text-xs h-44 resize-none font-mono leading-relaxed" value={editWaMsg} onChange={(e) => setEditWaMsg(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-cream/40 text-[10px] font-cinzel uppercase tracking-widest mb-1.5">Phone Numbers</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {editPhones.split(',').map((p) => p.trim()).filter(Boolean).map((ph) => (
                        <span key={ph} className="flex items-center gap-1.5 border border-green-500/20 bg-green-500/5 rounded-full px-2.5 py-0.5 text-green-300 text-[11px] font-cinzel">
                          <MessageCircle size={9} /> {ph}
                          <button onClick={() => removeChip(editPhones, setEditPhones, ph)} className="text-cream/30 hover:text-red-400 ml-0.5"><X size={9} /></button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input className="input-gold text-sm flex-1" type="tel" placeholder="+919876543210" value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addChip(editPhones, setEditPhones, newPhone, setNewPhone)} />
                      <button onClick={() => addChip(editPhones, setEditPhones, newPhone, setNewPhone)} className="border border-gold/25 hover:border-gold/50 text-gold/70 hover:text-gold font-cinzel text-xs px-3 py-2 rounded-xl transition-all flex-shrink-0">+ Add</button>
                      <UserPicker mode="phone" onSelect={(v) => addChip(editPhones, setEditPhones, v, () => {})} />
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={saveEdit} className="flex items-center gap-1.5 bg-gold hover:bg-gold-300 text-dark font-cinzel font-bold text-xs px-4 py-2 rounded-lg transition-colors">
                  <Check size={12} /> Save
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

// ── Main page ──────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const { rules, addRule } = useNotificationsStore();
  const users              = useUsersStore((s) => s.users);

  const [desc,     setDesc]     = useState('');
  const [parsed,   setParsed]   = useState<ReturnType<typeof parseDescription> | null>(null);
  const [channel,  setChannel]  = useState<NotificationChannel>('email');
  // Email fields
  const [subject,  setSubject]  = useState('');
  const [body,     setBody]     = useState('');
  const [emails,   setEmails]   = useState('');
  const [newEmail, setNewEmail] = useState('');
  // WhatsApp fields
  const [waMsg,    setWaMsg]    = useState('');
  const [phones,   setPhones]   = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [saved,    setSaved]    = useState(false);
  // User-group auto-detect
  const [autoGroups, setAutoGroups] = useState<string[]>([]);

  // ── User-aware NLP parse ─────────────────────────────────────────────────────
  const handleParse = () => {
    if (!desc.trim()) return;
    const r = parseDescription(desc);
    const lower = desc.toLowerCase();

    let autoEmails: string[] = [...r.detectedEmails];
    let autoPhones: string[] = [...r.detectedPhones];
    const detected: string[] = [];

    const addUser = (u: AppUser) => {
      if (u.email && !autoEmails.includes(u.email)) autoEmails.push(u.email);
      if (u.phone && !autoPhones.includes(u.phone)) autoPhones.push(u.phone);
    };

    // "me" / "my" → the admin user (matched by stored email or first admin)
    if (/\bme\b/.test(lower) || /\bmy\b/.test(lower)) {
      const me = users.find((u) => u.email === 'meetbharani91@gmail.com')
               ?? users.find((u) => u.role === 'admin');
      if (me) { addUser(me); detected.push('me (you)'); }
    }

    // "all users" / "everyone" / "all"
    if (/\ball users\b/.test(lower) || /\beveryone\b/.test(lower) || /\ball\b/.test(lower)) {
      users.forEach(addUser);
      detected.push('all users');
    }

    // "admin" / "admins" (but not when already matched by "all")
    else if (/\badmins?\b/.test(lower)) {
      users.filter((u) => u.role === 'admin').forEach(addUser);
      detected.push('admins');
    }

    // "staff"
    if (/\bstaff\b/.test(lower) && !/\ball\b/.test(lower)) {
      users.filter((u) => u.role === 'staff').forEach(addUser);
      detected.push('staff');
    }

    // "viewer" / "viewers"
    if (/\bviewers?\b/.test(lower) && !/\ball\b/.test(lower)) {
      users.filter((u) => u.role === 'viewer').forEach(addUser);
      detected.push('viewers');
    }

    // "users" (without "all") → add all users' info
    if (/\busers\b/.test(lower) && !/\ball users\b/.test(lower) && !/\ball\b/.test(lower)) {
      users.forEach(addUser);
      if (!detected.includes('all users')) detected.push('users');
    }

    setParsed(r);
    setChannel(r.channel);
    setSubject(r.subject);
    setBody(r.body);
    setWaMsg(r.whatsappMessage);
    setEmails(autoEmails.join(', '));
    setPhones(autoPhones.filter(Boolean).join(', '));
    setAutoGroups(detected);
    setSaved(false);
  };

  const addChip = (
    list: string, setter: (v: string) => void,
    newVal: string, clearNew: (v: string) => void,
  ) => {
    if (!newVal.trim()) return;
    const arr = list.split(',').map((x) => x.trim()).filter(Boolean);
    if (!arr.includes(newVal.trim())) setter([...arr, newVal.trim()].join(', '));
    clearNew('');
  };

  const removeChip = (list: string, setter: (v: string) => void, val: string) =>
    setter(list.split(',').map((x) => x.trim()).filter((x) => x && x !== val).join(', '));

  const showEmail    = channel === 'email'    || channel === 'both';
  const showWhatsApp = channel === 'whatsapp' || channel === 'both';

  const handleCreate = () => {
    if (!parsed) return;
    addRule({
      id:              `notif-${Date.now()}`,
      name:            parsed.name.replace(/\(.*\)/, `(${CHANNEL_META[channel].label})`),
      description:     desc,
      trigger:         parsed.trigger,
      channel,
      recipients:      emails.split(',').map((e) => e.trim()).filter(Boolean),
      subject,
      body,
      whatsappNumbers: phones.split(',').map((p) => p.trim()).filter(Boolean),
      whatsappMessage: waMsg,
      active:          true,
      createdAt:       new Date().toISOString(),
    });
    setSaved(true);
    setDesc(''); setParsed(null); setAutoGroups([]);
    setSubject(''); setBody(''); setEmails('');
    setWaMsg(''); setPhones('');
  };

  const hasRecipients =
    (showEmail    && emails.trim()) ||
    (showWhatsApp && phones.trim());

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-cinzel text-2xl font-bold text-cream">Notifications</h1>
        <p className="text-cream/40 text-sm mt-1">Define when and how you want to be notified about store activity.</p>
      </div>

      {/* Creator card */}
      <div className="bg-[#0A0000] border border-gold/15 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Plus size={15} className="text-gold" />
          <h2 className="font-cinzel text-cream font-semibold text-sm">Create a Notification</h2>
        </div>

        {/* NL input */}
        <div>
          <label className="block text-cream/40 text-[10px] font-cinzel uppercase tracking-widest mb-2">
            Describe what you want
          </label>
          <textarea
            className="input-gold h-24 resize-none text-sm leading-relaxed"
            placeholder={`Examples:\n"Send me WhatsApp notifications for every new order"\n"Email all admins daily digest"\n"Notify staff via WhatsApp when cart is abandoned"\n"WhatsApp me and all users for every order"`}
            value={desc}
            onChange={(e) => { setDesc(e.target.value); setParsed(null); setAutoGroups([]); setSaved(false); }}
          />
          <button
            onClick={handleParse}
            disabled={!desc.trim()}
            className="mt-2 bg-gold/10 hover:bg-gold/20 disabled:opacity-40 border border-gold/25 text-gold font-cinzel text-xs px-4 py-2 rounded-lg transition-all"
          >
            Parse and Preview
          </button>
        </div>

        {parsed && (
          <div className="space-y-5 pt-2 border-t border-gold/10">

            {/* Detected trigger + channel */}
            <div className="flex flex-wrap gap-4 items-start">
              <div>
                <p className="text-cream/35 text-[10px] font-cinzel uppercase tracking-widest mb-1.5">Trigger</p>
                <span className={`text-[10px] font-cinzel font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${TRIGGER_COLORS[parsed.trigger]}`}>
                  {TRIGGER_LABELS[parsed.trigger]}
                </span>
              </div>
              <div>
                <p className="text-cream/35 text-[10px] font-cinzel uppercase tracking-widest mb-1.5">Delivery Channel</p>
                <div className="flex gap-1.5">
                  {(['email', 'whatsapp', 'both'] as NotificationChannel[]).map((ch) => {
                    const m = CHANNEL_META[ch];
                    return (
                      <button
                        key={ch}
                        onClick={() => setChannel(ch)}
                        className={`flex items-center gap-1.5 text-[10px] font-cinzel font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl border transition-all ${
                          channel === ch
                            ? 'bg-gold/15 border-gold/40 text-gold'
                            : 'border-white/10 text-cream/40 hover:text-cream hover:border-white/20'
                        }`}
                      >
                        {m.icon} {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Auto-detected user groups */}
            {autoGroups.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Users size={11} className="text-gold/60" />
                <span className="text-[10px] font-cinzel text-cream/40 uppercase tracking-widest">Auto-detected:</span>
                {autoGroups.map((g) => (
                  <span key={g} className="text-[10px] font-cinzel font-bold text-gold bg-gold/10 border border-gold/20 px-2 py-0.5 rounded-full">
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Email section */}
            {showEmail && (
              <div className="space-y-3 bg-blue-950/10 border border-blue-500/10 rounded-xl p-4">
                <p className="text-blue-300/80 text-[10px] font-cinzel uppercase tracking-widest flex items-center gap-1.5">
                  <Mail size={10} /> Email
                </p>
                <div>
                  <label className="block text-cream/40 text-[10px] font-cinzel uppercase tracking-widest mb-1">Subject</label>
                  <input className="input-gold text-sm" value={subject} onChange={(e) => setSubject(e.target.value)} />
                </div>
                <div>
                  <label className="block text-cream/40 text-[10px] font-cinzel uppercase tracking-widest mb-1">Body</label>
                  <textarea className="input-gold h-40 resize-none font-mono text-xs leading-relaxed" value={body} onChange={(e) => setBody(e.target.value)} />
                </div>
                <div>
                  <p className="text-cream/35 text-[10px] font-cinzel uppercase tracking-widest mb-1.5">Preview</p>
                  <EmailPreview subject={subject} body={body} />
                </div>
                {/* Recipients */}
                <div>
                  <label className="block text-cream/40 text-[10px] font-cinzel uppercase tracking-widest mb-1.5">Recipients</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {emails.split(',').map((e) => e.trim()).filter(Boolean).map((em) => (
                      <span key={em} className="flex items-center gap-1.5 border border-blue-500/20 bg-blue-500/5 rounded-full px-2.5 py-0.5 text-blue-300 text-[11px] font-cinzel">
                        <Mail size={9} /> {em}
                        <button onClick={() => removeChip(emails, setEmails, em)} className="text-cream/30 hover:text-red-400 ml-0.5"><X size={9} /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      className="input-gold text-sm flex-1"
                      type="email"
                      placeholder="Add email..."
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addChip(emails, setEmails, newEmail, setNewEmail)}
                    />
                    <button onClick={() => addChip(emails, setEmails, newEmail, setNewEmail)} className="border border-gold/25 hover:border-gold/50 text-gold/70 hover:text-gold font-cinzel text-xs px-3 py-2 rounded-xl transition-all flex-shrink-0">+ Add</button>
                    <UserPicker mode="email" onSelect={(v) => addChip(emails, setEmails, v, () => {})} />
                  </div>
                </div>
              </div>
            )}

            {/* WhatsApp section */}
            {showWhatsApp && (
              <div className="space-y-3 bg-green-950/10 border border-green-500/10 rounded-xl p-4">
                <p className="text-green-300/80 text-[10px] font-cinzel uppercase tracking-widest flex items-center gap-1.5">
                  <MessageCircle size={10} /> WhatsApp
                </p>
                <div>
                  <label className="block text-cream/40 text-[10px] font-cinzel uppercase tracking-widest mb-1">
                    Message <span className="normal-case text-cream/25">(use *bold* and _italic_ for formatting)</span>
                  </label>
                  <textarea className="input-gold h-40 resize-none font-mono text-xs leading-relaxed" value={waMsg} onChange={(e) => setWaMsg(e.target.value)} />
                </div>
                <div>
                  <p className="text-cream/35 text-[10px] font-cinzel uppercase tracking-widest mb-1.5">Preview</p>
                  <WhatsAppPreview message={waMsg} />
                </div>
                {/* Phone numbers */}
                <div>
                  <label className="block text-cream/40 text-[10px] font-cinzel uppercase tracking-widest mb-1.5">WhatsApp Numbers</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {phones.split(',').map((p) => p.trim()).filter(Boolean).map((ph) => (
                      <span key={ph} className="flex items-center gap-1.5 border border-green-500/20 bg-green-500/5 rounded-full px-2.5 py-0.5 text-green-300 text-[11px] font-cinzel">
                        <Phone size={9} /> {ph}
                        <button onClick={() => removeChip(phones, setPhones, ph)} className="text-cream/30 hover:text-red-400 ml-0.5"><X size={9} /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      className="input-gold text-sm flex-1"
                      type="tel"
                      placeholder="+919876543210"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addChip(phones, setPhones, newPhone, setNewPhone)}
                    />
                    <button onClick={() => addChip(phones, setPhones, newPhone, setNewPhone)} className="border border-gold/25 hover:border-gold/50 text-gold/70 hover:text-gold font-cinzel text-xs px-3 py-2 rounded-xl transition-all flex-shrink-0">+ Add</button>
                    <UserPicker mode="phone" onSelect={(v) => addChip(phones, setPhones, v, () => {})} />
                  </div>
                </div>
              </div>
            )}

            {/* Create button */}
            <button
              onClick={handleCreate}
              disabled={!hasRecipients || saved}
              className="w-full bg-gold hover:bg-gold-300 disabled:opacity-50 text-dark font-cinzel font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {saved
                ? <><Check size={16} /> Notification Created!</>
                : <><Bell size={15} /> Create Notification</>
              }
            </button>
          </div>
        )}
      </div>

      {/* Active rules */}
      <div>
        <h2 className="font-cinzel text-cream font-semibold text-sm mb-4 flex items-center gap-2">
          <Bell size={14} className="text-gold" />
          Active Notifications
          {rules.length > 0 && (
            <span className="bg-gold/15 text-gold text-[10px] font-bold px-2 py-0.5 rounded-full border border-gold/20">{rules.length}</span>
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

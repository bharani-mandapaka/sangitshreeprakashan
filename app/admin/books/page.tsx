'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  RefreshCw, Search, Plus, Pencil, Trash2, X, Package, BookOpen,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import type { DbBookRow } from '@/lib/books-data';
import { categoryMeta, type BookCategory, type BookLevel, type BookLanguage } from '@/lib/books';
import { formatPrice } from '@/lib/utils';

const CATEGORIES: BookCategory[] = ['instrumental', 'vocal', 'raag-theory', 'kathak', 'research', 'cbse', 'bundle'];
const LEVELS: BookLevel[] = ['beginner', 'intermediate', 'advanced', 'research', 'bundle'];
const LANGUAGES: BookLanguage[] = ['hindi', 'english', 'bilingual'];

// Shape the form works with — mirrors BookInput in app/api/admin/books/route.ts.
// Authors/tags are edited as newline-separated text and split/joined at the
// form boundary, since the DB columns are text[].
interface BookFormState {
  id: string | null; // null = creating a new book
  slug: string;
  titleEnglish: string;
  titleHindi: string;
  price: string;
  category: BookCategory;
  level: BookLevel;
  language: BookLanguage;
  authorsText: string;
  description: string;
  descriptionHindi: string;
  coverImage: string;
  series: string;
  part: string;
  isBundle: boolean;
  isFeatured: boolean;
  inStock: boolean;
  tagsText: string;
}

const EMPTY_FORM: BookFormState = {
  id: null,
  slug: '',
  titleEnglish: '',
  titleHindi: '',
  price: '',
  category: 'instrumental',
  level: 'beginner',
  language: 'hindi',
  authorsText: '',
  description: '',
  descriptionHindi: '',
  coverImage: '',
  series: '',
  part: '',
  isBundle: false,
  isFeatured: false,
  inStock: true,
  tagsText: '',
};

function rowToForm(row: DbBookRow): BookFormState {
  return {
    id: row.id,
    slug: row.slug,
    titleEnglish: row.title_english,
    titleHindi: row.title_hindi,
    price: String(row.price),
    category: row.category as BookCategory,
    level: row.level as BookLevel,
    language: row.language as BookLanguage,
    authorsText: (row.authors ?? []).join('\n'),
    description: row.description ?? '',
    descriptionHindi: row.description_hindi ?? '',
    coverImage: row.cover_image ?? '',
    series: row.series ?? '',
    part: row.part != null ? String(row.part) : '',
    isBundle: row.is_bundle,
    isFeatured: row.is_featured,
    inStock: row.in_stock,
    tagsText: (row.tags ?? []).join(', '),
  };
}

function formToPayload(form: BookFormState) {
  return {
    ...(form.id ? { id: form.id } : {}),
    slug: form.slug.trim(),
    titleEnglish: form.titleEnglish.trim(),
    titleHindi: form.titleHindi.trim(),
    price: Number(form.price),
    category: form.category,
    level: form.level,
    language: form.language,
    authors: form.authorsText.split('\n').map((a) => a.trim()).filter(Boolean),
    description: form.description.trim(),
    descriptionHindi: form.descriptionHindi.trim() || null,
    coverImage: form.coverImage.trim() || null,
    series: form.series.trim() || null,
    part: form.part.trim() ? Number(form.part) : null,
    isBundle: form.isBundle,
    isFeatured: form.isFeatured,
    inStock: form.inStock,
    tags: form.tagsText.split(',').map((t) => t.trim()).filter(Boolean),
  };
}

// ── Create/edit form (modal) ─────────────────────────────────────────────────
function BookFormModal({
  form,
  onChange,
  onClose,
  onSaved,
}: {
  form: BookFormState;
  onChange: (f: BookFormState) => void;
  onClose: () => void;
  onSaved: (row: DbBookRow) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!form.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = formToPayload(form);
    const res = await fetch('/api/admin/books', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? 'Failed to save book.');
      return;
    }
    // The API only echoes back { success, id } / { success } — not the full
    // row — so build the saved row locally from what we already know plus the
    // id the server assigned (new books) or already had (edits).
    const id = isEdit ? (form.id as string) : (data.id as string);
    const row: DbBookRow = {
      id,
      slug: payload.slug,
      title_hindi: payload.titleHindi,
      title_english: payload.titleEnglish,
      price: payload.price,
      category: payload.category,
      level: payload.level,
      language: payload.language,
      authors: payload.authors,
      description: payload.description,
      description_hindi: payload.descriptionHindi,
      cover_image: payload.coverImage,
      series: payload.series,
      part: payload.part,
      is_bundle: payload.isBundle,
      is_featured: payload.isFeatured,
      in_stock: payload.inStock,
      tags: payload.tags,
    };
    onSaved(row);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-[#0A0000] border border-gold/15 rounded-2xl w-full max-w-2xl my-8 p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-cinzel text-gold font-bold text-lg">
            {isEdit ? 'Edit Book' : 'New Book'}
          </h2>
          <button type="button" onClick={onClose} className="text-cream/40 hover:text-cream">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-cream/40 text-xs uppercase tracking-widest font-cinzel mb-1.5">Slug</label>
            <input
              className="input-gold text-sm"
              value={form.slug}
              onChange={(e) => onChange({ ...form, slug: e.target.value })}
              placeholder="swar-vadan-part-1"
              required
            />
          </div>
          <div>
            <label className="block text-cream/40 text-xs uppercase tracking-widest font-cinzel mb-1.5">Price (₹)</label>
            <input
              type="number"
              min="0"
              step="1"
              className="input-gold text-sm"
              value={form.price}
              onChange={(e) => onChange({ ...form, price: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-cream/40 text-xs uppercase tracking-widest font-cinzel mb-1.5">Title (English)</label>
            <input
              className="input-gold text-sm"
              value={form.titleEnglish}
              onChange={(e) => onChange({ ...form, titleEnglish: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-cream/40 text-xs uppercase tracking-widest font-cinzel mb-1.5">Title (Hindi)</label>
            <input
              className="input-gold text-sm font-devanagari"
              value={form.titleHindi}
              onChange={(e) => onChange({ ...form, titleHindi: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-cream/40 text-xs uppercase tracking-widest font-cinzel mb-1.5">Category</label>
            <select
              className="input-gold text-sm cursor-pointer"
              value={form.category}
              onChange={(e) => onChange({ ...form, category: e.target.value as BookCategory })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{categoryMeta[c].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-cream/40 text-xs uppercase tracking-widest font-cinzel mb-1.5">Level</label>
            <select
              className="input-gold text-sm cursor-pointer"
              value={form.level}
              onChange={(e) => onChange({ ...form, level: e.target.value as BookLevel })}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-cream/40 text-xs uppercase tracking-widest font-cinzel mb-1.5">Language</label>
            <select
              className="input-gold text-sm cursor-pointer"
              value={form.language}
              onChange={(e) => onChange({ ...form, language: e.target.value as BookLanguage })}
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-cream/40 text-xs uppercase tracking-widest font-cinzel mb-1.5">Cover Image Path</label>
            <input
              className="input-gold text-sm"
              value={form.coverImage}
              onChange={(e) => onChange({ ...form, coverImage: e.target.value })}
              placeholder="/covers/swar-vadan-part-1.jpg"
            />
          </div>

          <div>
            <label className="block text-cream/40 text-xs uppercase tracking-widest font-cinzel mb-1.5">
              Series <span className="normal-case text-cream/25">(optional)</span>
            </label>
            <input
              className="input-gold text-sm"
              value={form.series}
              onChange={(e) => onChange({ ...form, series: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-cream/40 text-xs uppercase tracking-widest font-cinzel mb-1.5">
              Part # <span className="normal-case text-cream/25">(optional)</span>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              className="input-gold text-sm"
              value={form.part}
              onChange={(e) => onChange({ ...form, part: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-cream/40 text-xs uppercase tracking-widest font-cinzel mb-1.5">
            Authors <span className="normal-case text-cream/25">(one per line)</span>
          </label>
          <textarea
            className="input-gold text-sm min-h-[70px] font-devanagari"
            value={form.authorsText}
            onChange={(e) => onChange({ ...form, authorsText: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-cream/40 text-xs uppercase tracking-widest font-cinzel mb-1.5">Description</label>
          <textarea
            className="input-gold text-sm min-h-[90px]"
            value={form.description}
            onChange={(e) => onChange({ ...form, description: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-cream/40 text-xs uppercase tracking-widest font-cinzel mb-1.5">
            Description (Hindi) <span className="normal-case text-cream/25">(optional)</span>
          </label>
          <textarea
            className="input-gold text-sm min-h-[70px] font-devanagari"
            value={form.descriptionHindi}
            onChange={(e) => onChange({ ...form, descriptionHindi: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-cream/40 text-xs uppercase tracking-widest font-cinzel mb-1.5">
            Tags <span className="normal-case text-cream/25">(comma separated)</span>
          </label>
          <input
            className="input-gold text-sm"
            value={form.tagsText}
            onChange={(e) => onChange({ ...form, tagsText: e.target.value })}
            placeholder="instrumental, sitar, beginner"
          />
        </div>

        <div className="flex flex-wrap gap-6 pt-1">
          <label className="flex items-center gap-2 text-cream/70 text-sm font-cinzel cursor-pointer">
            <input
              type="checkbox"
              checked={form.isBundle}
              onChange={(e) => onChange({ ...form, isBundle: e.target.checked })}
              className="accent-gold w-4 h-4"
            />
            Bundle Set
          </label>
          <label className="flex items-center gap-2 text-cream/70 text-sm font-cinzel cursor-pointer">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => onChange({ ...form, isFeatured: e.target.checked })}
              className="accent-gold w-4 h-4"
            />
            Featured on Homepage
          </label>
          <label className="flex items-center gap-2 text-cream/70 text-sm font-cinzel cursor-pointer">
            <input
              type="checkbox"
              checked={form.inStock}
              onChange={(e) => onChange({ ...form, inStock: e.target.checked })}
              className="accent-gold w-4 h-4"
            />
            In Stock
          </label>
        </div>

        {error && (
          <p className="text-red-400 text-xs font-cinzel bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-gold hover:bg-gold-300 text-dark font-cinzel font-bold text-sm py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Book'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 border border-cream/15 hover:border-cream/30 text-cream/60 hover:text-cream font-cinzel text-sm py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AdminBooksPage() {
  const [books, setBooks] = useState<DbBookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<BookCategory | 'all'>('all');
  const [bundleOnly, setBundleOnly] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<BookFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<DbBookRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Reads go straight through the anon client — `books` SELECT is public per
  // the read_books RLS policy (see supabase/schema.sql), so no admin API
  // round-trip is needed just to list the catalog. Only writes go through
  // app/api/admin/books/route.ts.
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: fetchError } = await getSupabase()
      .from('books')
      .select('*')
      .order('title_english', { ascending: true });
    if (fetchError) setError(fetchError.message);
    else setBooks((data as DbBookRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return books.filter((b) => {
      const matchQ =
        !q ||
        b.title_english.toLowerCase().includes(q) ||
        b.title_hindi.includes(q) ||
        b.slug.toLowerCase().includes(q);
      const matchC = categoryFilter === 'all' || b.category === categoryFilter;
      const matchBundle = !bundleOnly || b.is_bundle;
      return matchQ && matchC && matchBundle;
    });
  }, [books, query, categoryFilter, bundleOnly]);

  const openCreate = () => { setForm(EMPTY_FORM); setFormOpen(true); };
  const openEdit = (row: DbBookRow) => { setForm(rowToForm(row)); setFormOpen(true); };

  const handleSaved = (row: DbBookRow) => {
    setBooks((prev) => {
      const exists = prev.some((b) => b.id === row.id);
      return exists ? prev.map((b) => (b.id === row.id ? row : b)) : [...prev, row];
    });
    setFormOpen(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    const res = await fetch('/api/admin/books', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deleteTarget.id }),
    });
    const data = await res.json().catch(() => ({}));
    setDeleting(false);
    if (!res.ok) {
      setDeleteError(data.error ?? 'Failed to delete book.');
      return;
    }
    setBooks((prev) => prev.filter((b) => b.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-cinzel text-2xl font-bold text-cream">Catalog</h1>
          <p className="text-cream/40 text-sm mt-1">
            {loading ? 'Loading…' : `${filtered.length} of ${books.length} books`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchBooks}
            disabled={loading}
            className="flex items-center gap-2 border border-gold/15 hover:border-gold/30 text-cream/50 hover:text-cream font-cinzel text-xs px-3 py-2 rounded-xl transition-all disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-gold hover:bg-gold-300 text-dark font-cinzel font-bold text-xs px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={14} /> New Book
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm font-cinzel">
          Database error: {error}. Check Supabase connection.
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[180px] relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cream/30 pointer-events-none" />
          <input
            className="input-gold text-sm py-2"
            style={{ paddingLeft: '2.25rem' }}
            placeholder="Search title, slug…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as BookCategory | 'all')}
          className="input-gold text-sm py-2 pr-8 min-w-[160px] cursor-pointer"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{categoryMeta[c].label}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 px-4 py-2 border border-gold/15 rounded-lg text-cream/60 text-sm font-cinzel cursor-pointer">
          <input
            type="checkbox"
            checked={bundleOnly}
            onChange={(e) => setBundleOnly(e.target.checked)}
            className="accent-gold w-4 h-4"
          />
          Bundles only
        </label>
      </div>

      {/* Table */}
      <div className="bg-[#0A0000] border border-gold/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw size={22} className="text-gold/40 animate-spin mx-auto mb-3" />
            <p className="font-cinzel text-cream/30 text-sm">Loading catalog…</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gold/10">
                  {['', 'Title', 'Category', 'Level', 'Price', 'Stock', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-cinzel uppercase tracking-widest text-cream/35">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <Package size={28} className="text-cream/10 mx-auto mb-3" />
                      <p className="font-cinzel text-cream/30 text-sm">
                        {books.length === 0 ? 'No books yet — click "New Book" to add one.' : 'No books match your filters.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((b) => {
                    const meta = categoryMeta[b.category as BookCategory];
                    return (
                      <tr key={b.id} className="border-b border-gold/5 hover:bg-white/2 transition-colors">
                        <td className="px-4 py-3">
                          <div className="relative w-9 h-12 rounded overflow-hidden bg-black/40 border border-gold/10 flex-shrink-0">
                            {b.cover_image ? (
                              <Image src={b.cover_image} alt="" fill sizes="36px" className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gold/30">
                                <BookOpen size={14} />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-cream text-xs font-cinzel font-semibold">{b.title_english}</p>
                          <p className="text-cream/40 text-[10px] mt-0.5">{b.slug}</p>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-[10px] font-cinzel uppercase tracking-widest px-2 py-0.5 rounded-full border border-gold/20 text-gold/80">
                            {meta?.icon} {meta?.label ?? b.category}
                          </span>
                          {b.is_bundle && (
                            <span className="ml-1.5 text-[10px] font-cinzel uppercase tracking-widest px-2 py-0.5 rounded-full bg-gold/15 text-gold">
                              Bundle
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-cream/50 text-xs capitalize">{b.level}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-cinzel text-gold font-bold text-sm">{formatPrice(b.price)}</p>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className={`text-[10px] font-cinzel font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                            b.in_stock
                              ? 'bg-green-500/15 text-green-300 border-green-500/30'
                              : 'bg-red-500/15 text-red-300 border-red-500/30'
                          }`}>
                            {b.in_stock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => openEdit(b)}
                            className="text-cream/40 hover:text-gold transition-colors p-1.5"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => { setDeleteTarget(b); setDeleteError(''); }}
                            className="text-cream/40 hover:text-red-400 transition-colors p-1.5"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formOpen && (
        <BookFormModal
          form={form}
          onChange={setForm}
          onClose={() => setFormOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0000] border border-gold/15 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-cinzel text-cream font-bold text-base">Delete this book?</h2>
            <p className="text-cream/50 text-sm">
              <span className="text-cream">{deleteTarget.title_english}</span> will be permanently removed from the catalog. This can&apos;t be undone.
            </p>
            {deleteError && <p className="text-red-400 text-xs">{deleteError}</p>}
            <div className="flex gap-3 pt-1">
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-cinzel font-bold text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 border border-cream/15 hover:border-cream/30 text-cream/60 hover:text-cream font-cinzel text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

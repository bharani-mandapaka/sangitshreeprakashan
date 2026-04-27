import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DailyVisit {
  date: string; // YYYY-MM-DD
  visits: number;
  unique: number;
}

interface AnalyticsStore {
  // Seeded aggregate totals (base)
  baseVisits:         number;
  baseUnique:         number;
  baseCartAdds:       number;
  // Live totals (from real user interactions in this browser)
  liveVisits:         number;
  liveUnique:         boolean; // has this visitor been counted?
  liveCartAdds:       number;
  // Per-book click counts (live)
  bookClicks:         Record<string, number>;
  // Daily breakdown (last 7 days, seeded)
  dailyData:          DailyVisit[];
  // Actions
  trackVisit:         () => void;
  trackBookClick:     (slug: string) => void;
  trackCartAdd:       () => void;
}

const today = new Date();
const last7: DailyVisit[] = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(today);
  d.setDate(d.getDate() - (6 - i));
  const visits = [142, 189, 156, 203, 178, 221, 158][i];
  return {
    date: d.toISOString().slice(0, 10),
    visits,
    unique: Math.round(visits * 0.67),
  };
});

const seedBookClicks: Record<string, number> = {
  'swar-vadan-complete-set':       312,
  'swar-vadan-part-1':             287,
  'swar-vadan-part-2':             241,
  'bhatkhande-swarlippi-part-1':   198,
  'raag-shastra-parichay-part-1':  175,
  'kathak-pravesh':                163,
  'swar-vadan-part-3':             144,
  'cbse-music-class-9':            137,
};

export const useAnalyticsStore = create<AnalyticsStore>()(
  persist(
    (set, get) => ({
      baseVisits:   1247,
      baseUnique:    834,
      baseCartAdds:  312,
      liveVisits:    0,
      liveUnique:    false,
      liveCartAdds:  0,
      bookClicks:    seedBookClicks,
      dailyData:     last7,

      trackVisit: () => {
        const s = get();
        set({
          liveVisits: s.liveVisits + 1,
          liveUnique: true,
          dailyData: s.dailyData.map((d, i) =>
            i === 6 ? { ...d, visits: d.visits + 1, unique: s.liveUnique ? d.unique : d.unique + 1 } : d
          ),
        });
      },

      trackBookClick: (slug) =>
        set((s) => ({
          bookClicks: {
            ...s.bookClicks,
            [slug]: (s.bookClicks[slug] ?? 0) + 1,
          },
        })),

      trackCartAdd: () =>
        set((s) => ({ liveCartAdds: s.liveCartAdds + 1 })),
    }),
    { name: 'ssp-analytics' }
  )
);

// Derived selectors
export const getTotals = (s: AnalyticsStore) => ({
  visits:   s.baseVisits  + s.liveVisits,
  unique:   s.baseUnique  + (s.liveUnique ? 1 : 0),
  cartAdds: s.baseCartAdds + s.liveCartAdds,
  bookClicks: Object.values(s.bookClicks).reduce((a, b) => a + b, 0),
});

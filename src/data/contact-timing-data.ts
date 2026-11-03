import type { HeatmapChartCell } from "@nicecxone/lyra-ui/heatmap-chart";

/* Placeholder data — mirrors the original design's Tuesday numbers. Replace
   with real model output when it's wired up. */

export const HOURS = ["8a", "9a", "10a", "11a", "12p", "1p", "2p", "3p", "4p", "5p", "6p", "7p"];
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type Day = (typeof DAYS)[number];

/** Heatmap rows, bottom-to-top (ECharts draws the first category at the bottom). */
export const CHANNELS_BOTTOM_UP = ["Email", "SMS", "Voice"] as const;

/** Model confidence (0–100) per hour, Tuesday baseline. */
const TUESDAY: Record<(typeof CHANNELS_BOTTOM_UP)[number], number[]> = {
  Voice: [25, 50, 75, 100, 60, 5, 60, 75, 100, 70, 30, 5],
  SMS: [5, 30, 50, 55, 75, 100, 75, 55, 50, 75, 100, 75],
  Email: [70, 100, 70, 40, 20, 5, 20, 50, 45, 25, 5, 5],
};

/** Deterministic per-day variation of the Tuesday baseline (placeholder only). */
const DAY_SCALE: Record<Day, number> = { Mon: 0.85, Tue: 1, Wed: 0.9, Thu: 0.8, Fri: 0.7, Sat: 0.45, Sun: 0.35 };

/* ── Campaign / segment quick filters (Review page) — placeholder lists ── */
export const CAMPAIGN_OPTIONS = [
  { value: "spring-renewal", label: "Spring Renewal" },
  { value: "past-due", label: "Past Due Reminders" },
  { value: "welcome", label: "Welcome Series" },
  { value: "win-back", label: "Win-Back Q4" },
];
export const SEGMENT_OPTIONS = [
  { value: "east-sales", label: "East Region Sales" },
  { value: "high-value", label: "High-Value Customers" },
  { value: "new-customers", label: "New Customers" },
  { value: "lapsed-90", label: "Lapsed 90+ Days" },
];

/** Many-to-many: a campaign has several segments and a segment can belong to several campaigns. */
export const CAMPAIGN_SEGMENTS: Record<string, string[]> = {
  "spring-renewal": ["east-sales", "high-value"],
  "past-due": ["east-sales", "lapsed-90"],
  welcome: ["new-customers", "high-value"],
  "win-back": ["lapsed-90", "high-value"],
};

export interface ScopePair {
  key: string;
  campaign: string;
  segment: string;
}

const labelOf = (opts: { value: string; label: string }[], v: string) => opts.find((o) => o.value === v)?.label ?? v;

/** Every campaign-segment pairing the current filters cover (empty selection = all). */
export function scopePairs(campaigns: string[], segments: string[]): ScopePair[] {
  const cs = campaigns.length ? campaigns : CAMPAIGN_OPTIONS.map((c) => c.value);
  return cs.flatMap((c) =>
    CAMPAIGN_SEGMENTS[c]
      .filter((sv) => !segments.length || segments.includes(sv))
      .map((sv) => ({ key: `${c}|${sv}`, campaign: labelOf(CAMPAIGN_OPTIONS, c), segment: labelOf(SEGMENT_OPTIONS, sv) })),
  );
}

/** Segment options that belong to at least one selected campaign (all when none selected). */
export const segmentOptionsFor = (campaigns: string[]) =>
  campaigns.length ? SEGMENT_OPTIONS.filter((o) => campaigns.some((c) => CAMPAIGN_SEGMENTS[c].includes(o.value))) : SEGMENT_OPTIONS;

/** Campaign options that include at least one selected segment (all when none selected). */
export const campaignOptionsFor = (segments: string[]) =>
  segments.length ? CAMPAIGN_OPTIONS.filter((o) => segments.some((sv) => CAMPAIGN_SEGMENTS[o.value].includes(sv))) : CAMPAIGN_OPTIONS;

export interface ContactFilters {
  campaigns: string[];
  segments: string[];
}

/** Deterministic placeholder nudge so changing a campaign/segment visibly changes the data. */
function filterAdjust(f?: ContactFilters) {
  const key = f ? [...f.campaigns, ...f.segments].sort().join("|") : "";
  if (!key) return { seed: 0, pts: 0 };
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return { seed: 1 + (h % 6), pts: (h % 5) - 2 };
}

/* Date-range handling shared with Widget B (see EffectivenessRange below).
   Placeholder only: each range nudges confidence and sample size. */
const RANGE_CONFIDENCE: Record<EffectivenessRange, { scale: number; seed: number; interactions: number }> = {
  today: { scale: 1.0, seed: 0, interactions: 620 },
  yesterday: { scale: 0.96, seed: 3, interactions: 580 },
  last7: { scale: 1.0, seed: 5, interactions: 4_240 },
  last30: { scale: 0.98, seed: 8, interactions: 14_820 },
  last90: { scale: 0.93, seed: 13, interactions: 41_300 },
};

export function heatmapDataForDay(day: Day, range: EffectivenessRange = "last30", filters?: ContactFilters): HeatmapChartCell[] {
  const r = RANGE_CONFIDENCE[range];
  const fa = filterAdjust(filters);
  const cells: HeatmapChartCell[] = [];
  CHANNELS_BOTTOM_UP.forEach((channel, y) => {
    TUESDAY[channel].forEach((base, x) => {
      const wobble = 1 + (((x * 7 + y * 3 + DAYS.indexOf(day) * 5 + r.seed + fa.seed) % 9) - 4) / 40;
      cells.push({ x, y, value: Math.max(0, Math.min(100, Math.round(base * DAY_SCALE[day] * r.scale * wobble))) });
    });
  });
  return cells;
}

function hourLabel(h: number) {
  const hr24 = 8 + h;
  const suffix = hr24 >= 12 ? "PM" : "AM";
  const hr12 = hr24 % 12 === 0 ? 12 : hr24 % 12;
  return `${hr12}:00 ${suffix}`;
}

/** The strongest cell in the grid, plus the sample size for the selected range. */
export function topWindowFor(cells: HeatmapChartCell[], range: EffectivenessRange) {
  const best = cells.reduce((a, b) => (b.value > a.value ? b : a));
  return {
    channel: CHANNELS_BOTTOM_UP[best.y],
    start: hourLabel(best.x),
    end: hourLabel(best.x + 1),
    confidence: (best.value / 100).toFixed(2),
    interactions: RANGE_CONFIDENCE[range].interactions,
  };
}

/** Effectiveness (percent) — inside vs. outside the recommended windows. */
export const EFFECTIVENESS = [
  { channel: "Voice", metric: "Connect Rate", inWindow: 68, outside: 47 },
  { channel: "SMS", metric: "Response Rate", inWindow: 34, outside: 22 },
  { channel: "Email", metric: "Open Rate", inWindow: 42, outside: 33 },
] as const;

/* ── Date-range filter (Widget B) — placeholder values per range ── */
export type EffectivenessRange = "today" | "yesterday" | "last7" | "last30" | "last90";

export const EFFECTIVENESS_RANGE_OPTIONS: { value: EffectivenessRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7", label: "Last 7 days" },
  { value: "last30", label: "Last 30 days" },
  { value: "last90", label: "Last 90 days" },
];

/** Percentage-point shift applied to the Last 30 days baseline, per range. */
const RANGE_SHIFT: Record<EffectivenessRange, { inWindow: number; outside: number; accuracy: number }> = {
  today: { inWindow: 3, outside: -2, accuracy: 3 },
  yesterday: { inWindow: -2, outside: 1, accuracy: -2 },
  last7: { inWindow: 1, outside: 0, accuracy: 1 },
  last30: { inWindow: 0, outside: 0, accuracy: 0 },
  last90: { inWindow: -3, outside: -1, accuracy: -4 },
};

export function effectivenessForRange(range: EffectivenessRange, filters?: ContactFilters) {
  const s = RANGE_SHIFT[range];
  const fa = filterAdjust(filters);
  return {
    rows: EFFECTIVENESS.map((r) => ({ ...r, inWindow: r.inWindow + s.inWindow + fa.pts, outside: r.outside + s.outside })),
    accuracy: 87 + s.accuracy + fa.pts,
  };
}

/** Best day and hour per channel across the whole week, with the expected lift for acting on it. */
export function bestWindowsByChannel(range: EffectivenessRange, filters?: ContactFilters) {
  const { rows } = effectivenessForRange(range, filters);
  const weekly = DAYS.map((day) => ({ day, cells: heatmapDataForDay(day, range, filters) }));
  const channelsTopDown = ["Voice", "SMS", "Email"] as const;
  return channelsTopDown.map((channel) => {
    const y = CHANNELS_BOTTOM_UP.indexOf(channel);
    let best = { day: weekly[0].day as Day, x: 0, value: -1 };
    for (const { day, cells } of weekly) {
      for (const c of cells) {
        if (c.y === y && c.value > best.value) best = { day, x: c.x, value: c.value };
      }
    }
    const row = rows.find((r) => r.channel === channel)!;
    return {
      channel,
      metric: row.metric,
      day: best.day,
      start: hourLabel(best.x),
      end: hourLabel(best.x + 1),
      confidence: (best.value / 100).toFixed(2),
      lift: row.inWindow - row.outside,
      interactions: RANGE_CONFIDENCE[range].interactions,
    };
  });
}

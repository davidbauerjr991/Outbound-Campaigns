import { useState } from "react";
import { Lock, Copy, Pencil, Maximize2, Minimize2, RefreshCw, Trash2 } from "lucide-react";
import {
  AdminShell,
  TabList,
  Tab,
  DashboardTemplate,
  DashboardCard,
  Metric,
  BarChart,
  Button,
  Separator,
  Tooltip,
  DateRangeFilterChip,
  Container,
  InteriorPanel,
  AiIcon,
  type DashboardCardMetric,
  type BarChartSeries,
  type MenuEntry,
  type DateRangeFilterValue,
  type DateRangeFilterOption,
} from "@nicecxone/lyra-ui";
import {
  buildCallCentersNavItems,
  CallCentersViewSwitcher,
  VIEW_HEADER_TITLE,
  type SideMenuView,
} from "./CallCentersSideMenu";

/* ── Monitor dashboard — opens from the LeftNav "Monitor" icon (App.tsx),
   reachable at the `/monitor` route (App.tsx's home page).

   Built on `AdminShell` (admin-shell.tsx) — same template
   `OutboundCampaignsPage`/Configure already uses — per an explicit "every
   new page should be in AdminShell, why would you hand-roll your own root
   layout?" correction. An earlier version of this page hand-rolled its own
   root `<div>` + `CallCentersSideMenu` (a component that rendered a real
   `SidePanel` directly) + its own `PageHeader`, duplicating everything
   `AdminShell` already owns: the left `SidePanel`/`TreeMenu`, pin/hover/
   toggle state, the container-width pin guard (force-unpinned below
   1024px — added to the hand-rolled version in a previous round, now just
   `AdminShell`'s existing `isNarrowContainer` for free), cookie
   persistence, and the page header row itself, including its
   `animate-in fade-in-0 duration-500` entrance (missing entirely from the
   hand-rolled root, which is why this page didn't fade in on navigation
   the way Configure did — also fixed for free by this migration).

   `AdminShell` gained three new props specifically for this migration
   (`admin-shell.tsx`'s own doc comment covers each in full):
   - `navHeaderBadge` — the "Call Centers"/"Service Groups" view-switcher
     chevron (`CallCentersViewSwitcher`, from `CallCentersSideMenu.tsx`),
     rendered inline after `navTitle` in the left panel's own header row.
   - `navExactSelection` — turns on `TreeMenu`'s `exactSelection` (any
     selected row at any depth gets the same background pill, no parent-
     active cascade) for this page's tree only; every other `AdminShell`
     page keeps the default cascading behavior.
   - `navKey` — forces the internal `TreeMenu` to remount when `view`
     changes, so switching between the "Call Centers" and "Service Groups"
     datasets doesn't leave a row's stale open/closed state behind at
     whatever index it used to occupy.
   `pageSubtitle` (a smaller, generally useful addition — a plain
   passthrough to `PageHeader`'s existing `subtitle`) carries the same
   "Call Centers"/"Service Groups" text as the page header's own caption.

   `CallCentersSideMenu.tsx` no longer renders a `SidePanel` itself — it
   only exports the tree's plain data model, `buildCallCentersNavItems`
   (mapping onto real `TreeMenuItem[]`, with `active`/`onClick` computed
   from the current selection), and `CallCentersViewSwitcher`. This page
   assembles those into `AdminShell`'s props below.

   Everything below `AdminShell`'s own page header is `children`: a
   closable/lockable workspace-tab strip, a 3-up grid of single-metric
   cards, and one full-width summary card with two stat blocks + an empty
   chart area — `AdminShell`'s content column has no scroll of its own, so
   the tab strip stays `shrink-0` and everything below it gets its own
   `flex-1 overflow-y-auto` wrapper, same structure this page always had.

   Component mapping (see lyra-ui's PROJECT_SUMMARY.md "Key Components" for
   the lyra-ui additions this needed):
   - Tab strip      → `TabList`/`Tab` (tabs.tsx) — `icon` for the lock glyph,
     `onRemove` for the × button, `active` for the blue-underline state.
     Tabs stay their own default (content) width — `fullWidth` (equal-width
     columns) was tried and reverted; "full width" here just means the
     strip's own bottom divider line runs edge-to-edge (`className="px-4"`
     passed directly to `TabList`, not a wrapping div — border sits outside
     padding in the box model) while the tabs themselves stay inset.
     `overflowMenu overflowBreakpoint="wide"` collapses to "active + N More"
     only once the row genuinely no longer fits — every `TabList` in this
     app should collapse rather than clip, per CLAUDE.md.
   - Metric cards   → `DashboardCard` (dashboard-card.tsx) in "metric card"
     mode (a single-entry `metrics` array) + `showKebabMenu` (the ⋮
     button). `variant="neutral-subtle"` (container.tsx) gives every card a
     real `bg-lyra-bg-surface-container-subtle` surface instead of the
     default white card, keeping the same `border-lyra-border-subtle` the
     default card variant already has.

     Date filtering used to be a per-card `DateRangeFilterChip` in each
     card's own `headerActions` (a checkbox-multiselect `FilterChip`
     before that, per "the filter chips in the outbound campaign cards
     should be radio toggles like the agent dashboard") — replaced with a
     SINGLE toolbar-level filter per "remove the individual filters in the
     dashboard cards ... and add a filter to the toolbar that allows the
     widgets to filter by date." One `DateRangeFilterChip` now lives in
     the toolbar row (below), controlling every card/widget on the page at
     once — see `dateFilter` state below for the mechanics.
   - Summary card   → `DashboardCard` in `children` mode with two stacked,
     white "contained"-style interior metric cards (`Container
     variant="default"` wrapping each `Metric` — the same composition
     `DashboardCard`'s own `metricVariant="contained"`/`DashboardQueue`'s
     "cards" variant use for their bordered white metric boxes, e.g. its
     "8 Contacts / 3 Agents" pair — just stacked in a column here instead
     of that row layout, per "make the outbound email chips emails
     launched and emails remaining white interior metric cards") plus a
     `BarChart` (lyra-ui, bar-chart.tsx) in place of the former `EmptyState`
     "No data available" placeholder — day on the x-axis, amount of emails
     on the y-axis (`BarChart`'s own default `orientation="vertical"`,
     upright columns; started as `orientation="horizontal"` per the
     original "x-axis amount of emails and y-axis day" ask, then switched
     to vertical per "make the bar chart in outbound campaigns a vertical
     chart"), two grouped series (Emails Launched / Emails Remaining).
     `EMAIL_CHART_BY_RANGE[dateFilter]` is static/dummy per range (see the
     toolbar date filter section below), just non-zero so the chart has
     something real to draw; the two stat boxes beside it (Emails
     Launched/Remaining) are each that range's series total, not a
     separately-authored number, so they can never drift out of sync with
     the chart itself.

     Chart wrapper: just `className="lyra-card-split-chart"` (lyra-
     tokens.css) — no `flex`/`min-w-0`/`flex-1` Tailwind utilities added
     alongside it here. That class now owns its own `flex-grow`/`flex-
     basis` for a real reason, not tidiness: this div previously carried
     `flex min-w-0 flex-1` directly, and `flex-1`'s `flex-basis: 0%`
     governs a flex item's size on whatever the *main axis* currently is
     — width in `.lyra-card-split`'s row state, but height once it stacks
     to a column (`@container max-width: 480px`). A `flex-basis: 0%` left
     in place in the stacked state overrides `lyra-card-split-chart`'s own
     explicit `height` right back down toward zero (the stacked column has
     no defined height of its own to `flex-grow` into), which is exactly
     why the chart rendered squished — all 7 days' bars crammed into a
     handful of pixels — no matter what height number the class specified.
     `lyra-card-split-chart` fixes this at the source: `flex: 1 1 0%` in
     the row state (fills the remaining row width beside the fixed stat
     column), `flex: none` once stacked (stops fighting its own height).
     420px in the row state, 340px once stacked — both checked against
     `DashboardCard`'s own `max-h-[600px]` body cap (dashboard-card.tsx)
     together with the stat column's own height, so the total never
     exceeds it and nothing scrolls. The stat column stays plain `flex
     flex-col gap-3` (top-aligned, no `justify-center` — that was only
     ever compensating for the same now-fixed collapse).

   All data below is static/dummy — this proves out the layout, not a real
   reporting integration. Card content doesn't change when a different tab
   or tree selection is picked; only the "Showing data for: {label}" line
   reflects the current tree selection. Card content DOES change with the
   toolbar's date filter (see below) — that's the one axis this static
   data actually varies along.

   Tree selection → card scope: clicking any row in the left panel's tree
   (a parent category like "Enterprise"/"Financial Services", or an
   individual leaf call center) updates the "Showing data for: {label}"
   line above the metric grid. `selectedId`/`selectedLabel` state lives
   here (not in `CallCentersSideMenu.tsx`) since the dashboard content
   needs to react to it.

   Toolbar date filter → card/widget data: a single `DateRangeFilterChip`
   (lyra-ui, date-range-filter-chip.tsx) in the toolbar row —
   Today/Yesterday/Last 7 days/Last 30 Days/Last 90 Days
   (`MONITOR_DATE_FILTER_OPTIONS` below; lyra-ui's own `DateRangeFilterChip`
   gained `"last30"`/`"last90"` to its `DateRangeFilterValue` type
   specifically for this — additive only, `DATE_RANGE_FILTER_OPTIONS`
   itself, and every other consumer's default 4-option list, is
   untouched). Controlled (`value`/`onValueChange`, not the component's own
   uncontrolled default) by `dateFilter` state living in THIS component,
   defaulting to `"today"` — every metric card and the "Outbound Email"
   chart/stat boxes now read from `METRIC_CARDS_BY_RANGE[dateFilter]`/
   `EMAIL_CHART_BY_RANGE[dateFilter]` instead of one fixed dataset, so
   picking a range actually changes the numbers shown (still static/dummy
   per-range data, not a real query, but a real change per selection).
   "Persist the filter if users click between call centers": `dateFilter`
   lives in `MonitorDashboardPage` itself, entirely independent of
   `selectedId`/`view` — nothing here ever resets it when the tree
   selection changes, so it naturally stays put across call-center clicks
   without any special-cased persistence logic. Removed the per-card
   `DateRangeFilterChip` `headerActions` on every card — one filter now
   drives all of them, not one independent chip per card.

   Responsiveness note: the metric-card rows and the full-width summary
   card's stat/chart split both use container-query CSS classes
   (`.lyra-container-grid-wrap`/`-grid`, `.lyra-card-split-wrap`/`-split`,
   lyra-tokens.css) instead of Tailwind's `sm:`/`md:`/`xl:` prefixes —
   those are browser-viewport media queries and wouldn't react to the left
   nav opening/closing or a docked panel taking space, only to the window
   itself resizing. The 6 metric cards render as three separate
   `.lyra-container-grid` rows (3-up, 3-up, then the "Outbound Email"
   summary card alone as its own 1-up row) rather than one `.lyra-metric-
   card-grid` grid — see the doc comment further down for why.

   Card region → `DashboardTemplate` (lyra-ui, dashboard-template.tsx),
   `maxWidth="none"` — the generic dashboard container/width/breakpoint
   shell, in its "Full Width" mode (see lyra-ui's `Templates/Dashboards` →
   "Full Width" story, which this page now mirrors) rather than a bare
   wrapper `<div>`. This page always rendered its cards edge-to-edge
   (no reading-width cap), so `maxWidth="none"` matches existing behavior
   exactly — the change is composing the real shared shell component
   instead of a page-owned equivalent, not a visual change. The "Showing
   data for" row, the metric grid, and the summary card are unchanged
   otherwise — same real Monitor cards/data, just inside `DashboardTemplate`
   instead of a plain div.

   The "Showing data for: {label}" row IS this page's toolbar (first child
   inside `DashboardTemplate`, same position the demo story's
   `TableToolbar` occupies) — deliberately NOT the generic Quick Search/
   filter-chip/action-icon `TableToolbar` that story uses. That toolbar's
   contents (search, Description/Created By/Published filters, refresh/
   edit/copy/delete, a fullscreen toggle) are all invented demo content
   with nothing real to wire up here; Monitor already had real toolbar
   content — the tree-selection label plus Duplicate/Settings — which is
   what actually belongs in this slot.

   Two of that demo toolbar's icon buttons were still worth pulling over
   for real, though: the old filled "Settings" text button is now an
   icon-only Edit button (`Pencil`, `Button variant="icon" size="icon"` —
   same as the template's own "Edit" action), and a `Maximize2`/
   `Minimize2` fullscreen toggle sits after a divider, same pattern as the
   template's. Unlike the story (where "fullscreen" just drops the demo's
   own outer shell padding), here it hides the workspace tab strip so the
   card region gets the full scrolling height — the toolbar row itself,
   with the same button now showing "Exit Fullscreen", stays visible
   either way.

   Card click / kebab "Edit" → right `InteriorPanel` (lyra-ui,
   interior-panel.tsx), per "when any of the cards are clicked or the
   kebab menu 'edit' is clicked, open a right interior panel (it should
   open beneath the tabs)". Every `DashboardCard` here (the 6 metric
   cards + the "Outbound Email" summary card) is now clickable
   (`onClick`, `role="button"`, `cursor-pointer`) and carries its own
   `kebabMenuItems` (Edit/Refresh/Remove, same icons `DashboardCard`'s
   own defaults use — a consumer-supplied array is required to attach a
   real `onClick` at all, since `DEFAULT_KEBAB_MENU_ITEMS` is decorative)
   whose "Edit" entry opens the same panel the card's own click does.
   Both converge on one `openInteriorPanel(title)` helper — even though
   `KebabMenuButton`'s trigger stops propagation but `MenuRadix`'s actual
   item `onSelect` doesn't, so a kebab "Edit" click could in principle
   also bubble to the card's own `onClick`, the two handlers are
   idempotent (same panel, same title), so there's nothing to guard
   against in practice.

   "Beneath the tabs": the workspace tab strip stays a `shrink-0`
   sibling BEFORE the new flex row below, so it always spans the full
   container width above the panel, never squeezed by it.
   `<div className="flex flex-1 min-h-0 overflow-hidden">` wraps the
   existing scrolling content div and the new `InteriorPanel` as flex
   siblings — required by `InteriorPanel`'s own contract (it must sit in
   a flex row beside the main content column to "push" it in the wide
   case; the panel also self-manages an absolute-overlay fallback below
   ~1050px of that row's width, via its own `ResizeObserver`).

   Toolbar's Edit icon button → the SAME right `InteriorPanel`, scoped to
   the whole dashboard rather than one card — per "when the edit icon
   button is clicked open an interior side panel that is edit for the
   entire dashboard." Calls `openInteriorPanel("Edit Dashboard")`, the
   same helper every card/kebab "Edit" already calls; the panel body
   branches on `interiorPanelTitle === "Edit Dashboard"` to show
   dashboard-scoped placeholder copy instead of the per-card one. One
   panel, one piece of state, three trigger points (a card, its kebab
   "Edit", the toolbar's Edit) — not three separate panels.

   Selected-state on the triggering card — "when the dashboard cards are
   clicked and their associated interior panel is open they should be in
   a selected state... built into the functionality of the dashboard when
   interior panels are triggered." Every card's `variant` is now
   conditional: `interiorPanelOpen && interiorPanelTitle === {that card's
   title}` renders `"info-strong"` (the blue Container treatment) instead
   of the base `"neutral-subtle"` — the exact same mechanism
   `DashboardQueue`'s own click-to-select cards already use
   (dashboard-queue.tsx), reused rather than reinvented; `DashboardCard`
   didn't need any new prop, `variant` is already plain `ContainerProps`
   passthrough. `aria-pressed` mirrors the same condition. The toolbar's
   "Edit Dashboard" trigger deliberately doesn't match any card's own
   title, so it never falsely selects a card — only a card/its-own-kebab
   click ever does. lyra-ui's `Templates/Dashboards` demo (Dashboards.
   stories.tsx) got the identical treatment as the reference pattern any
   future "click a card, open its InteriorPanel" consumer should follow.

   Page header top-right buttons — `AdminShell`'s `pageActions` now
   renders Secondary/Primary + a divider + "Ask AI" (`AiIcon`), the exact
   composition lyra-ui's own `AdminShell.stories.tsx` "With Page Header"
   story demonstrates, per "add the default top right buttons to the page
   header secondary, primary | Ask AI (with panel functionality)".
   "Secondary"/"Primary" are the literal default/placeholder labels (this
   page has no established named create/secondary action of its own to
   substitute in) — same "default" reading as the request itself. "Ask AI"
   is real, not decorative: `onAskAiToggle` (this component's own optional
   prop) opens/closes an actual `AiPanel` — but the panel and its
   docked/float/resize state live in `App.tsx`, ONE shared instance per
   app (same pattern as the existing "Online Help" `DraggablePanel` state
   machine already there, and the same shape lyra-form-generator's
   `App.tsx` uses for its own `AiPanel`), threaded down here via a prop
   rather than owned by this page — every future page that wants its own
   "Ask AI" trigger reuses the same app-level panel/state, not a
   page-owned duplicate. The button is only rendered when `onAskAiToggle`
   is actually passed, so this page still renders standalone (e.g. any
   future isolated test) without a missing/broken trigger. */

interface WorkspaceTab {
  id: string;
  label: string;
}

const WORKSPACE_TABS: WorkspaceTab[] = [
  { id: "1", label: "1. Outbound Voice" },
  { id: "2", label: "2. Blended Voice" },
  { id: "3", label: "3. Inbound Voice" },
  { id: "4", label: "4. Outbound Email" },
  { id: "5", label: "5. Inbound Email" },
  { id: "6", label: "6. Outbound SMS" },
  { id: "7", label: "7. Inbound SMS" },
  { id: "8", label: "8. Inbound Chat" },
];

/* ── Toolbar date filter → per-range dummy data ──
   "remove the individual filters in the dashboard cards ... and add a
   filter to the toolbar that allows the widgets to filter by date: Today,
   Yesterday, Last 7 days, Last 30 Days, Last 90 Days ... default to
   Today ... change the data appropriately in the cards." One shared type,
   `MonitorDateRange`, keys every per-range dataset below (`DateRangeFilterValue`
   minus `"custom"` — Monitor's own toolbar filter never offers a "Custom"
   option, so nothing here needs to account for it). */
type MonitorDateRange = Exclude<DateRangeFilterValue, "custom">;

const MONITOR_DATE_FILTER_OPTIONS: DateRangeFilterOption[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7", label: "Last 7 days" },
  { value: "last30", label: "Last 30 Days" },
  { value: "last90", label: "Last 90 Days" },
];

/* ── Outbound Email chart data — static/dummy, same as every other value
   on this page (see the doc comment above), just non-zero so the bar
   chart itself has something to actually draw. Categories change shape
   per range, not just the numbers — "Today"/"Yesterday" are a single bar
   each (one day has no sub-breakdown of its own), "Last 7 days" breaks
   down by weekday, "Last 30 Days" by week, "Last 90 Days" by month —
   real, distinct category semantics per range rather than one fixed axis
   with scaled-up numbers. */
interface MonitorEmailChartData {
  categories: string[];
  series: BarChartSeries[];
}

/* Colors: `--lyra-color-accent-{color}-strong` (the accent/data-viz
   palette, lyra-tokens.css) — never `accent-blue-strong` (too easily read
   as the primary/brand color) and never a status/fg token, per "never use
   primary, light or dark colors for charts or icons in dashboards — only
   use data visualization colors for charts" (CLAUDE.md). These two series
   are arbitrary categorical data with no status meaning of their own, so
   no status-color exception applies here. */
const EMAIL_LAUNCHED_COLOR = "var(--lyra-color-accent-teal-strong)";
const EMAIL_REMAINING_COLOR = "var(--lyra-color-accent-purple-strong)";

const EMAIL_CHART_BY_RANGE: Record<MonitorDateRange, MonitorEmailChartData> = {
  today: {
    categories: ["Today"],
    series: [
      { label: "Emails Launched", data: [187], colorVar: EMAIL_LAUNCHED_COLOR },
      { label: "Emails Remaining", data: [43], colorVar: EMAIL_REMAINING_COLOR },
    ],
  },
  yesterday: {
    categories: ["Yesterday"],
    series: [
      { label: "Emails Launched", data: [172], colorVar: EMAIL_LAUNCHED_COLOR },
      { label: "Emails Remaining", data: [51], colorVar: EMAIL_REMAINING_COLOR },
    ],
  },
  // Original baseline data — unchanged from before the toolbar filter existed.
  last7: {
    categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    series: [
      { label: "Emails Launched", data: [120, 98, 140, 110, 132, 60, 40], colorVar: EMAIL_LAUNCHED_COLOR },
      { label: "Emails Remaining", data: [30, 42, 18, 25, 20, 55, 70], colorVar: EMAIL_REMAINING_COLOR },
    ],
  },
  last30: {
    categories: ["Week 1", "Week 2", "Week 3", "Week 4"],
    series: [
      { label: "Emails Launched", data: [780, 825, 690, 910], colorVar: EMAIL_LAUNCHED_COLOR },
      { label: "Emails Remaining", data: [210, 185, 240, 165], colorVar: EMAIL_REMAINING_COLOR },
    ],
  },
  last90: {
    categories: ["Month 1", "Month 2", "Month 3"],
    series: [
      { label: "Emails Launched", data: [3400, 3650, 3120], colorVar: EMAIL_LAUNCHED_COLOR },
      { label: "Emails Remaining", data: [890, 760, 910], colorVar: EMAIL_REMAINING_COLOR },
    ],
  },
};

/* ── Metric card data per range — same 6 cards, different (still static/
   dummy) numbers per range so picking a date range visibly "changes the
   data" as asked, rather than 5 identical option labels over one fixed
   dataset. Roughly consistent rates across ranges (this is dummy data,
   not a real trend), counts scaling up with the range's own size. */
const METRIC_CARDS_BY_RANGE: Record<MonitorDateRange, { title: string; metric: DashboardCardMetric }[]> = {
  today: [
    { title: "Email Delivered Rate",   metric: { value: "96.30%", label: "180 Delivered" } },
    { title: "Email Open Rate",        metric: { value: "41.10%", label: "74 Opened" } },
    { title: "Email Click Rate",       metric: { value: "8.90%",  label: "16 Clicked" } },
    { title: "Email Unsubscribe Rate", metric: { value: "0.53%",  label: "1 Unsubscribed" } },
    { title: "Email Suppressed Rate",  metric: { value: "1.10%",  label: "2 Suppressed" } },
    { title: "Email Bounced Rate",     metric: { value: "2.10%",  label: "4 Bounced" } },
  ],
  yesterday: [
    { title: "Email Delivered Rate",   metric: { value: "95.80%", label: "165 Delivered" } },
    { title: "Email Open Rate",        metric: { value: "39.60%", label: "65 Opened" } },
    { title: "Email Click Rate",       metric: { value: "8.40%",  label: "14 Clicked" } },
    { title: "Email Unsubscribe Rate", metric: { value: "0.60%",  label: "1 Unsubscribed" } },
    { title: "Email Suppressed Rate",  metric: { value: "1.35%",  label: "2 Suppressed" } },
    { title: "Email Bounced Rate",     metric: { value: "2.35%",  label: "4 Bounced" } },
  ],
  last7: [
    { title: "Email Delivered Rate",   metric: { value: "96.10%", label: "673 Delivered" } },
    { title: "Email Open Rate",        metric: { value: "41.50%", label: "279 Opened" } },
    { title: "Email Click Rate",       metric: { value: "9.50%",  label: "64 Clicked" } },
    { title: "Email Unsubscribe Rate", metric: { value: "0.38%",  label: "3 Unsubscribed" } },
    { title: "Email Suppressed Rate",  metric: { value: "1.25%",  label: "9 Suppressed" } },
    { title: "Email Bounced Rate",     metric: { value: "2.15%",  label: "15 Bounced" } },
  ],
  last30: [
    { title: "Email Delivered Rate",   metric: { value: "95.90%", label: "3,073 Delivered" } },
    { title: "Email Open Rate",        metric: { value: "40.90%", label: "1,257 Opened" } },
    { title: "Email Click Rate",       metric: { value: "9.30%",  label: "286 Clicked" } },
    { title: "Email Unsubscribe Rate", metric: { value: "0.42%",  label: "13 Unsubscribed" } },
    { title: "Email Suppressed Rate",  metric: { value: "1.30%",  label: "42 Suppressed" } },
    { title: "Email Bounced Rate",     metric: { value: "2.25%",  label: "72 Bounced" } },
  ],
  last90: [
    { title: "Email Delivered Rate",   metric: { value: "96.30%", label: "9,794 Delivered" } },
    { title: "Email Open Rate",        metric: { value: "41.80%", label: "4,094 Opened" } },
    { title: "Email Click Rate",       metric: { value: "9.60%",  label: "940 Clicked" } },
    { title: "Email Unsubscribe Rate", metric: { value: "0.37%",  label: "38 Unsubscribed" } },
    { title: "Email Suppressed Rate",  metric: { value: "1.15%",  label: "113 Suppressed" } },
    { title: "Email Bounced Rate",     metric: { value: "2.05%",  label: "201 Bounced" } },
  ],
};

interface MonitorDashboardPageProps {
  /**
   * Opens/closes the app-level "Ask AI" panel — the panel itself (and its
   * docked/float/resize state) lives in `App.tsx`, one shared instance per
   * app, same as the existing "Online Help" `DraggablePanel`. Optional so
   * this page still renders standalone (e.g. in isolation/tests) without
   * an app shell providing it; the page header's own "Ask AI" button is
   * simply omitted from `pageActions` when absent.
   */
  onAskAiToggle?: () => void;
}

export function MonitorDashboardPage({ onAskAiToggle }: MonitorDashboardPageProps) {
  const [tabs, setTabs] = useState(WORKSPACE_TABS);
  const [activeTabId, setActiveTabId] = useState("4");

  const removeTab = (id: string) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (activeTabId === id && next.length > 0) setActiveTabId(next[0].id);
      return next;
    });
  };

  /* ── Tree selection → card scope.
      Whichever tree row is currently selected (a parent like "Enterprise"/
      "Financial Services", or an individual leaf call center — any depth
      is selectable, per CallCentersSideMenu.tsx's `withSelection`) drives
      what the dashboard cards are showing data for. Every metric here is
      still static/dummy (there's no real per-scope dataset to slice), so
      this only proves out the wiring: a label above the card grid reflects
      the current selection, updating live as the tree is clicked. Starts
      on "Enterprise" to match that node's own default-active state in the
      tree. */
  const [selectedId, setSelectedId] = useState("enterprise");
  const [selectedLabel, setSelectedLabel] = useState("Enterprise");
  const handleTreeSelect = (id: string, label: string) => {
    setSelectedId(id);
    setSelectedLabel(label);
  };

  /* ── Left panel view switcher ("Call Centers" / "Service Groups") — both
      `AdminShell`'s `navTitle`/`navHeaderBadge` (left panel) and
      `pageSubtitle` (page header caption) read this same value, so they
      stay in sync with whichever tree is currently showing. */
  const [view, setView] = useState<SideMenuView>("callCenters");
  const navItems = buildCallCentersNavItems(view, selectedId, handleTreeSelect);

  /* ── Toolbar date filter — drives every card/widget's data below (see the
      doc comment above). Lives here, entirely independent of `selectedId`/
      `view`, so it's never reset by a tree-selection click — that
      independence IS the "persist the filter if users click between call
      centers" behavior, not something extra bolted on. Defaults to
      `"today"` per "default to Today." */
  const [dateFilter, setDateFilter] = useState<MonitorDateRange>("today");
  const metricCards = METRIC_CARDS_BY_RANGE[dateFilter];
  const emailChart = EMAIL_CHART_BY_RANGE[dateFilter];
  const emailsLaunchedTotal = emailChart.series[0].data.reduce((sum, n) => sum + n, 0);
  const emailsRemainingTotal = emailChart.series[1].data.reduce((sum, n) => sum + n, 0);

  /* ── Fullscreen toggle — same `Maximize2`/`Minimize2` icon-button pattern
      as lyra-ui's `Templates/Dashboards` demo toolbar (and
      `ContainerHeader.stories.tsx`'s own "WithActions" fullscreen toggle).
      Real effect here (not decorative): hides the workspace tab strip so
      the card region gets the full scrolling height — the toolbar row
      itself (with this same button, swapped to "Exit Fullscreen") stays
      put either way. */
  const [isFullScreen, setIsFullScreen] = useState(false);

  /* ── Card click / kebab "Edit" → right `InteriorPanel` — see the doc
      comment above. One helper, one pair of state values: whichever card
      (metric card or the "Outbound Email" summary card) was clicked last
      drives the panel's title; both trigger paths call this same function. */
  const [interiorPanelOpen, setInteriorPanelOpen] = useState(false);
  const [interiorPanelTitle, setInteriorPanelTitle] = useState<string | null>(null);
  const openInteriorPanel = (title: string) => {
    setInteriorPanelTitle(title);
    setInteriorPanelOpen(true);
  };
  const cardKebabMenuItems = (title: string): MenuEntry[] => [
    { id: "edit", label: "Edit", icon: <Pencil className="h-4 w-4" strokeWidth={1.5} />, onClick: () => openInteriorPanel(title) },
    { id: "refresh", label: "Refresh", icon: <RefreshCw className="h-4 w-4" strokeWidth={1.5} /> },
    { id: "remove", label: "Remove", icon: <Trash2 className="h-4 w-4" strokeWidth={1.5} /> },
  ];

  return (
    <AdminShell
      storageKeyPrefix="lyra_monitor"
      navTitle={VIEW_HEADER_TITLE[view]}
      navItems={navItems}
      navKey={view}
      navHeaderBadge={<CallCentersViewSwitcher view={view} onViewChange={setView} />}
      navExactSelection
      defaultLeftPinned
      showPageHeader
      pageTitle="Monitor"
      pageSubtitle={VIEW_HEADER_TITLE[view]}
      pageActions={
        // Default top-right page-header actions — Secondary/Primary +
        // divider + Ask AI (`AiIcon`), the same composition lyra-ui's own
        // `AdminShell.stories.tsx` "With Page Header" story demonstrates
        // (see its `pageActions` example) — per "add the default top right
        // buttons to the page header secondary, primary | Ask AI (with
        // panel functionality)". "Ask AI" is only rendered when
        // `onAskAiToggle` is actually provided (see `App.tsx`, which owns
        // the real docked/float "Ask AI" panel and its state, threaded
        // down here the same way lyra-form-generator threads
        // `onAiPanelToggle` into its own pages).
        <>
          <Button variant="outline">Secondary</Button>
          <Button>Primary</Button>
          {onAskAiToggle && (
            <>
              <div className="mx-1 h-6 w-px bg-lyra-border-subtle" />
              <Button variant="outline" onClick={onAskAiToggle}>
                <AiIcon className="h-4 w-4" />
                Ask AI
              </Button>
            </>
          )}
        </>
      }
    >
      {/* Workspace tabs — `shrink-0`, kept OUTSIDE the scrolling region
          below so this row stays fixed to the top of the container
          regardless of how tall the cards get — every page's tab strip
          should do this, per CLAUDE.md ("tabs are always pinned, never
          part of the page's own scroll").

          `className="px-4"` goes directly on `TabList` itself, not a
          wrapping div — `TabList`'s own `border-b` then spans full-bleed
          edge-to-edge while only the tabs move in from the edges (border
          sits outside padding in the box model). See PROJECT_SUMMARY.md's
          "TabList's horizontal inset always goes directly on TabList"
          entry. */}
      {!isFullScreen && (
        <div className="shrink-0 bg-lyra-bg-surface-base">
          <TabList aria-label="Report tabs" className="px-4" overflowMenu overflowBreakpoint="wide">
            {tabs.map((tab) => (
              <Tab
                key={tab.id}
                active={activeTabId === tab.id}
                onClick={() => setActiveTabId(tab.id)}
                icon={<Lock className="h-3.5 w-3.5" strokeWidth={1.5} />}
                onRemove={() => removeTab(tab.id)}
                removeLabel={`Remove ${tab.label}`}
              >
                {tab.label}
              </Tab>
            ))}
          </TabList>
        </div>
      )}

      {/* Flex row beneath the tabs: the scrolling card region on the left,
          the click-to-open `InteriorPanel` on the right. `InteriorPanel`
          must sit as a flex sibling of the main content column for its own
          "push the content over" (non-overlay) behavior to work — see
          interior-panel.tsx and the doc comment above. */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Everything below the tabs scrolls as its own region — the page
            header (owned by `AdminShell`) and tab strip above never move. */}
        <div className="flex-1 overflow-y-auto">
          <DashboardTemplate maxWidth="none" className="flex flex-col">
          {/* This row IS the toolbar here — no generic Quick Search/filter-
              chip/action-icon `TableToolbar` (that's `Templates/Dashboards`'
              own demo content, not a real Monitor control). Reflects the
              side panel's current tree selection — proves out the
              click-to-filter wiring described above. The date range
              `DateRangeFilterChip` IS a real filter (unlike the rest of
              this row) — see `dateFilter` above and the doc comment for
              how it drives every card/widget's data. */}
          <div className="flex items-center justify-between px-4 pt-4">
            <p className="lyra-body-sm text-lyra-fg-secondary">
              Showing data for: <span className="text-lyra-fg-default lyra-body-sm-emphasis">{selectedLabel}</span>
            </p>
            <div className="flex items-center gap-2">
              {/* One filter for the whole page — replaces the per-card
                  `DateRangeFilterChip` every metric/summary card used to
                  carry in its own `headerActions`, per "remove the
                  individual filters in the dashboard cards ... and add a
                  filter to the toolbar." `options` is Monitor's own 5-value
                  list (no "Custom") — `DateRangeFilterValue` gained
                  `"last30"`/`"last90"` in lyra-ui specifically for this. */}
              <DateRangeFilterChip
                value={dateFilter}
                onValueChange={(v) => setDateFilter(v as MonitorDateRange)}
                options={MONITOR_DATE_FILTER_OPTIONS}
              />
              <div className="mx-1 h-6 w-px bg-lyra-border-subtle" />
              <Button variant="ghost" size="icon-md" title="Duplicate">
                <Copy className="h-4 w-4" strokeWidth={1.5} />
              </Button>
              {/* Edit icon button — same `Button variant="icon" size="icon"` +
                  `Pencil` icon as lyra-ui's `Templates/Dashboards` demo
                  toolbar's own "Edit" action, replacing the old filled
                  "Settings" text button (icon-only, matching the template's
                  icon-button row rather than a standalone labeled action).
                  Opens the same right `InteriorPanel` a card click/kebab
                  "Edit" does, but scoped to the whole dashboard (title
                  "Edit Dashboard") rather than one card — per "when the
                  edit icon button is clicked open an interior side panel
                  that is edit for the entire dashboard." */}
              <Tooltip content="Edit" placement="bottom" asLabel>
                <Button variant="icon" size="icon" aria-label="Edit" onClick={() => openInteriorPanel("Edit Dashboard")}>
                  <Pencil className="h-4 w-4" strokeWidth={1.5} />
                </Button>
              </Tooltip>
              <div className="mx-1 h-6 w-px bg-lyra-border-subtle" />
              <Tooltip content={isFullScreen ? "Exit Fullscreen" : "Fullscreen"} placement="bottom" asLabel>
                <Button
                  variant="icon"
                  size="icon"
                  onClick={() => setIsFullScreen((v) => !v)}
                  aria-label={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullScreen ? (
                    <Minimize2 className="h-4 w-4" strokeWidth={1.5} />
                  ) : (
                    <Maximize2 className="h-4 w-4" strokeWidth={1.5} />
                  )}
                </Button>
              </Tooltip>
            </div>
          </div>

          {/* Metric card rows — three separate `.lyra-container-grid-wrap`/
              `.lyra-container-grid` rows (lyra-tokens.css) instead of one
              `.lyra-metric-card-grid` grid, per "instead of a single row of
              6 do 3 rows: 1 with 3-up, 1 with 3-up and then 1 with 1-up (the
              Outbound Email card)." `.lyra-container-grid` evenly splits a
              row's width among however many children it has — 3 cards in a
              row naturally renders 3-up with no fixed column count needed —
              collapsing to a 2-up grid at ≤991px, then a single column at
              ≤768px, same as `AgentDashboard`'s own Performance/Productivity
              row. Still container-query-driven, not Tailwind's `md:`/`xl:`
              viewport prefixes, so it responds to the left nav opening/
              closing or a docked panel taking space, not just the window
              resizing. All three rows (and the toolbar row above) now share
              one `p-4`/`gap-4` wrapper instead of each section carrying its
              own one-off padding. */}
          <div className="flex flex-col gap-4 p-4">
            <div className="lyra-container-grid-wrap">
              <div className="lyra-container-grid">
                {metricCards.slice(0, 3).map((card) => (
                  <DashboardCard
                    key={card.title}
                    headerTitle={card.title}
                    metrics={[card.metric]}
                    variant={interiorPanelOpen && interiorPanelTitle === card.title ? "info-strong" : "neutral-subtle"}
                    showKebabMenu
                    kebabMenuItems={cardKebabMenuItems(card.title)}
                    onClick={() => openInteriorPanel(card.title)}
                    role="button"
                    aria-pressed={interiorPanelOpen && interiorPanelTitle === card.title}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openInteriorPanel(card.title);
                      }
                    }}
                    className="cursor-pointer"
                  />
                ))}
              </div>
            </div>

            <div className="lyra-container-grid-wrap">
              <div className="lyra-container-grid">
                {metricCards.slice(3, 6).map((card) => (
                  <DashboardCard
                    key={card.title}
                    headerTitle={card.title}
                    metrics={[card.metric]}
                    variant={interiorPanelOpen && interiorPanelTitle === card.title ? "info-strong" : "neutral-subtle"}
                    showKebabMenu
                    kebabMenuItems={cardKebabMenuItems(card.title)}
                    onClick={() => openInteriorPanel(card.title)}
                    role="button"
                    aria-pressed={interiorPanelOpen && interiorPanelTitle === card.title}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openInteriorPanel(card.title);
                      }
                    }}
                    className="cursor-pointer"
                  />
                ))}
              </div>
            </div>

            {/* Third row — the "Outbound Email" summary card alone, as its
                own 1-up `.lyra-container-grid` row (a single child still
                evenly "splits" the row, i.e. takes the full width) rather
                than a bare div, so all three rows share the exact same
                collapse behavior at the same thresholds. `.lyra-card-split-
                wrap`/`.lyra-card-split` (below, inside the card) are
                unchanged — same container-query reasoning as the rows
                above, just for this card's own internal stat-blocks-vs-
                chart split: `.lyra-card-split-fixed` keeps the stat column
                at a fixed width in the row state and lets it go full-width
                once stacked; `.lyra-card-split-divider` hides the vertical
                rule in the stacked state instead of a divider floating
                mid-column. */}
            <div className="lyra-container-grid-wrap">
              <div className="lyra-container-grid">
                <div className="lyra-card-split-wrap">
                  <DashboardCard
                    headerTitle="Outbound Email"
                    variant={interiorPanelOpen && interiorPanelTitle === "Outbound Email" ? "info-strong" : "neutral-subtle"}
                    showKebabMenu
                    kebabMenuItems={cardKebabMenuItems("Outbound Email")}
                    onClick={() => openInteriorPanel("Outbound Email")}
                    role="button"
                    aria-pressed={interiorPanelOpen && interiorPanelTitle === "Outbound Email"}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openInteriorPanel("Outbound Email");
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <div className="lyra-card-split px-4 pb-4">
                      {/* White "contained"-style interior metric cards — same
                          `Container variant="default"` wrapping a `Metric` that
                          `DashboardCard`'s own `metricVariant="contained"` uses
                          (see dashboard-card.tsx's `MetricRow`, and
                          `DashboardQueue`'s "cards" variant — the "8 Contacts /
                          3 Agents" reference), just stacked in a column here
                          instead of that row layout. */}
                      <div className="lyra-card-split-fixed flex flex-col gap-3">
                        <Container variant="default" className="flex p-4">
                          <Metric metric={{ value: emailsLaunchedTotal, label: "Emails Launched" }} />
                        </Container>
                        <Container variant="default" className="flex p-4">
                          <Metric metric={{ value: emailsRemainingTotal, label: "Emails Remaining" }} />
                        </Container>
                      </div>
                      <Separator orientation="vertical" className="lyra-card-split-divider h-auto self-stretch" />
                      <div className="lyra-card-split-chart">
                        <BarChart
                          categories={emailChart.categories}
                          series={emailChart.series}
                          valueAxisLabel="Emails"
                        />
                      </div>
                    </div>
                  </DashboardCard>
                </div>
              </div>
            </div>
          </div>
          </DashboardTemplate>
        </div>

        <InteriorPanel
          side="right"
          open={interiorPanelOpen}
          onClose={() => setInteriorPanelOpen(false)}
          headerTitle={interiorPanelTitle ?? undefined}
        >
          <p className="lyra-body-sm text-lyra-fg-secondary p-4">
            {interiorPanelTitle === "Edit Dashboard" ? (
              <>Dashboard-wide edit settings (layout, cards shown, defaults) go here.</>
            ) : (
              <>Details for <span className="text-lyra-fg-default lyra-body-sm-emphasis">{interiorPanelTitle}</span> go here.</>
            )}
          </p>
        </InteriorPanel>
      </div>
    </AdminShell>
  );
}

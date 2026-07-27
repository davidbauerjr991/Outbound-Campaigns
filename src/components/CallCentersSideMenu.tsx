import { ChevronDown, Users } from "lucide-react";
import { Select, type TreeMenuItem } from "@nicecxone/lyra-ui";

/* ── CallCentersSideMenu — nav data/helpers for the Monitor dashboard's
   left tree, fed into `AdminShell`'s `navItems`/`navHeaderBadge`/
   `navExactSelection`/`navKey` props (`MonitorDashboardPage.tsx`) instead
   of rendering its own `SidePanel`.

   This used to BE a component that rendered a real `SidePanel` directly —
   deliberately, at the time, since Monitor didn't use `AdminShell` at all
   (an even earlier version was a hand-rolled fixed `<div>`, corrected once
   it was pointed out `SidePanel` + `PageHeader`'s `panelToggle` was the
   established pattern for this). That reasoning didn't go far enough: per
   an explicit "every new page should be in AdminShell — why would you
   hand-roll your own root layout?" correction, Monitor is now built on
   `AdminShell` itself (same as `OutboundCampaignsPage`/Configure), which
   already owns a left `SidePanel` + `TreeMenu` + all of the pin/hover/
   narrow-container-guard/cookie-persistence wiring a second, parallel
   `SidePanel` here would have just duplicated. `AdminShell` gained three
   new props specifically so this migration didn't lose anything Monitor's
   tree needed: `navHeaderBadge` (the view-switcher chevron, previously
   `SidePanel`'s own `headerTitleBadge`), `navExactSelection` (previously
   passed directly to this file's own `<TreeMenu exactSelection>`), and
   `navKey` (previously this file's own `<TreeMenu key={view}>`, forcing a
   remount when the dataset swaps — see `AdminShell`'s own doc comment on
   `navKey` for why that still matters here). This file now only owns the
   tree's plain data model, the `withSelection`/`buildCallCentersNavItems`
   mapping onto real `TreeMenuItem[]`, and the small view-switcher control
   itself — `MonitorDashboardPage.tsx` assembles them into `AdminShell`'s
   props.

   View switcher — a chevron immediately after the nav title, opening a
   two-option menu ("Call Centers" / "Service Groups") that swaps both the
   header text and the tree data below it:
   - Built from `Select` (select.tsx) with a bare `ChevronDown` `trigger`,
     single-select (`value`/`onValueChange`), same composition as
     `Select.stories.tsx`'s "Custom Trigger (Icon, Single-Select)" story —
     not the experimental, unexported `MenuRadix`/`Menu` primitives, since
     `Select` is the real, exported, already-established way to get a
     "bare icon trigger opens a small list of mutually-exclusive options"
     control.
   - Rendered by `CallCentersViewSwitcher` below, passed to `AdminShell`'s
     `navHeaderBadge` (forwarded to `SidePanel`'s `headerTitleBadge` —
     `PanelHeader`/`ContainerHeader`'s `titleBadge` slot, inline right
     after the title text — not `headerActions`, which sits at the far
     right instead). See PROJECT_SUMMARY.md's "SidePanel gains
     headerTitleBadge" entry.

   Selection — clicking ANY tree row (a parent like "Enterprise"/
   "Financial Services", or a leaf call center) selects it: that row gets
   the active *background* treatment (not just bold blue text) and every
   other row loses it, exactly one selection at a time across the whole
   tree, parent or leaf — a parent never shows as active just because one
   of its descendants happens to be selected. This is `TreeMenu`'s
   `exactSelection` prop (tree-menu.tsx), turned on via `AdminShell`'s own
   `navExactSelection` here: without it, `TreeMenu`'s default behavior only
   gives childless leaves the background pill, and a parent inherits the
   plain blue-text look whenever any direct child is active (fine for
   `LeftNav`/`AdminShell`'s own DEFAULT nav trees, wrong for this one,
   where exactly one row of ANY depth should read as "the current
   selection" and nothing else should). Opt-in and off by default on
   `AdminShell` — every other `AdminShell` page is unaffected; see
   PROJECT_SUMMARY.md's "TreeMenu gains exactSelection" entry.
   `selectedId`/`onSelect` are owned by `MonitorDashboardPage` (the
   dashboard's cards need to react to whichever scope is currently
   selected) and threaded into `buildCallCentersNavItems` below, which maps
   this file's plain node data onto real `TreeMenuItem[]` (`active`/
   `onClick` computed from the current selection) each render.

   Tree data per view:
   - "Call Centers" (default) — a single top-level "Enterprise" node
     wraps every call-center category (Financial Services, Hospitality,
     ...) as its own nested, independently expandable children — three
     levels deep in total (Enterprise > category > individual call
     center), using `TreeMenu`'s recursive nesting (`TreeMenuChild.
     children` — see PROJECT_SUMMARY.md's "TreeMenu supports arbitrary
     nesting depth" entry). Every leaf call center carries the same small
     blue icon. Only "Financial Services" and "Hospitality" reproduce
     their real children from the reference screenshot, down to
     "FS_ Omni-Channel"'s stray leading space (kept as-is — real
     reference data, not authored copy); the rest are dummy data (per
     explicit instruction) following the same "{PREFIX}_{Variant}" naming
     pattern. Only "Enterprise" has `defaultOpen` — every category
     underneath starts collapsed on page load. "Enterprise" is also the
     default *selection* (`selectedId` starts as `"enterprise"` in
     `MonitorDashboardPage`) — the bold blue "current selection" treatment
     `TreeMenu` already gives an expandable row when active, on by default
     rather than requiring a click first.
   - "Service Groups" — a flat list of categories (Financial Services,
     Hospitality, Insurance, Lead Generation, Sales, Testing, Training,
     Utilities), matching a second reference screenshot exactly — no
     "Enterprise" wrapper this time (the screenshot's own root header is
     "Service Groups" directly above the flat category list), and none
     expanded by default. Their own children are dummy data too (same
     naming pattern), since the screenshot never showed one expanded.
     Uses `sg-`-prefixed ids so switching views can't accidentally collide
     with a same-named node's id in the other tree (e.g. both views have
     a "Financial Services").

   Switching views does NOT reset `selectedId` — it's plain app state in
   `MonitorDashboardPage`, shared across both trees. If neither tree's
   current view contains a node with that id, nothing shows as active
   until the user picks something in the newly-visible tree, which is
   an acceptable prototype-level rough edge here (real "Enterprise"/
   "Financial Services" bore no relation to "Service Groups"' own nodes).

   Card-side filtering is wired in `MonitorDashboardPage` off `selectedId`
   /`selectedLabel` (see its own doc comment) — this file only owns the
   tree data/UI pieces and reports selection upward. */

const CALL_CENTER_ICON = <Users className="h-4 w-4 text-lyra-fg-active-strong" strokeWidth={1.5} />;

interface CallCenterNode {
  /** Stable identity for selection — distinct from `label`, which is just display text. */
  id: string;
  label: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children?: CallCenterNode[];
}

function callCenterChildren(prefix: string, idPrefix: string): CallCenterNode[] {
  return [
    { id: `${idPrefix}-hci`, label: `${prefix}_HCI`, icon: CALL_CENTER_ICON },
    { id: `${idPrefix}-manual`, label: `${prefix}_Manual`, icon: CALL_CENTER_ICON },
    { id: `${idPrefix}-message-only`, label: `${prefix}_Message Only`, icon: CALL_CENTER_ICON },
    { id: `${idPrefix}-omni-channel`, label: `${prefix}_Omni-Channel`, icon: CALL_CENTER_ICON },
    { id: `${idPrefix}-outbound-rpc`, label: `${prefix}_Outbound_RPC`, icon: CALL_CENTER_ICON },
    { id: `${idPrefix}-preview`, label: `${prefix}_Preview`, icon: CALL_CENTER_ICON },
  ];
}

const CALL_CENTER_NODES: CallCenterNode[] = [
  {
    id: "enterprise",
    label: "Enterprise",
    defaultOpen: true,
    children: [
      {
        id: "financial-services",
        label: "Financial Services",
        children: [
          { id: "fs-omni-channel", label: "FS_ Omni-Channel", icon: CALL_CENTER_ICON },
          { id: "fs-hci", label: "FS_HCI", icon: CALL_CENTER_ICON },
          { id: "fs-manual", label: "FS_Manual", icon: CALL_CENTER_ICON },
          { id: "fs-message-only", label: "FS_Message Only", icon: CALL_CENTER_ICON },
          { id: "fs-outbound-rpc", label: "FS_Outbound_RPC", icon: CALL_CENTER_ICON },
          { id: "fs-preview", label: "FS_Preview", icon: CALL_CENTER_ICON },
        ],
      },
      {
        id: "hospitality",
        label: "Hospitality",
        children: [
          { id: "h-hci", label: "H_HCI", icon: CALL_CENTER_ICON },
          { id: "h-manual", label: "H_Manual", icon: CALL_CENTER_ICON },
          { id: "h-message-only", label: "H_Message Only", icon: CALL_CENTER_ICON },
          { id: "h-omni-channel", label: "H_Omni-Channel", icon: CALL_CENTER_ICON },
          { id: "h-outbound-rpc", label: "H_Outbound_RPC", icon: CALL_CENTER_ICON },
          { id: "h-preview", label: "H_Preview", icon: CALL_CENTER_ICON },
        ],
      },
      { id: "insurance", label: "Insurance", children: callCenterChildren("IN", "insurance") },
      { id: "kj-newyork", label: "KJ_NewYork", children: callCenterChildren("KJ", "kj-newyork") },
      { id: "lead-generation", label: "Lead Generation", children: callCenterChildren("LG", "lead-generation") },
      { id: "retail", label: "Retail", children: callCenterChildren("RT", "retail") },
      { id: "sales", label: "Sales", children: callCenterChildren("SL", "sales") },
      { id: "testing-call-center", label: "Testing Call Center", children: callCenterChildren("TC", "testing-call-center") },
      { id: "training-call-center", label: "Training Call Center", children: callCenterChildren("TR", "training-call-center") },
      { id: "utilities", label: "Utilities", children: callCenterChildren("UT", "utilities") },
    ],
  },
];

const SERVICE_GROUP_NODES: CallCenterNode[] = [
  { id: "sg-financial-services", label: "Financial Services", children: callCenterChildren("FS", "sg-financial-services") },
  { id: "sg-hospitality", label: "Hospitality", children: callCenterChildren("H", "sg-hospitality") },
  { id: "sg-insurance", label: "Insurance", children: callCenterChildren("IN", "sg-insurance") },
  { id: "sg-lead-generation", label: "Lead Generation", children: callCenterChildren("LG", "sg-lead-generation") },
  { id: "sg-sales", label: "Sales", children: callCenterChildren("SL", "sg-sales") },
  { id: "sg-testing", label: "Testing", children: callCenterChildren("TC", "sg-testing") },
  { id: "sg-training", label: "Training", children: callCenterChildren("TR", "sg-training") },
  { id: "sg-utilities", label: "Utilities", children: callCenterChildren("UT", "sg-utilities") },
];

/** Maps plain node data onto real `TreeMenuItem[]` (`TreeMenuChild` has the
    identical shape, since a row at any depth can expand/collapse the same
    way), computing `active`/`onClick` from the current selection each
    render. Recurses so a parent's own `children` get the exact same
    treatment — any node, at any depth, is independently selectable. */
function withSelection(
  nodes: CallCenterNode[],
  selectedId: string,
  onSelect: (id: string, label: string) => void
): TreeMenuItem[] {
  return nodes.map((node) => ({
    label: node.label,
    icon: node.icon,
    defaultOpen: node.defaultOpen,
    active: node.id === selectedId,
    onClick: () => onSelect(node.id, node.label),
    children: node.children ? withSelection(node.children, selectedId, onSelect) : undefined,
  }));
}

export type SideMenuView = "callCenters" | "serviceGroups";

const VIEW_OPTIONS = [
  { value: "callCenters", label: "Call Centers" },
  { value: "serviceGroups", label: "Service Groups" },
];

/** Also used by `MonitorDashboardPage` for `AdminShell`'s `navTitle`/
    `pageSubtitle`, so both the left panel's own header and the page
    header's caption always match whichever view is actually showing. */
export const VIEW_HEADER_TITLE: Record<SideMenuView, string> = {
  callCenters: "Call Centers",
  serviceGroups: "Service Groups",
};

const VIEW_NODES: Record<SideMenuView, CallCenterNode[]> = {
  callCenters: CALL_CENTER_NODES,
  serviceGroups: SERVICE_GROUP_NODES,
};

/** Builds `AdminShell`'s `navItems` for whichever view is currently
    showing. Pass `view` as `AdminShell`'s `navKey` too (not done inside
    this helper — the caller already has `view` in scope) so the internal
    `TreeMenu` remounts and each row's open state re-derives fresh from the
    new dataset's own `defaultOpen`. */
export function buildCallCentersNavItems(
  view: SideMenuView,
  selectedId: string,
  onSelect: (id: string, label: string) => void
): TreeMenuItem[] {
  return withSelection(VIEW_NODES[view], selectedId, onSelect);
}

export interface CallCentersViewSwitcherProps {
  view: SideMenuView;
  onViewChange: (view: SideMenuView) => void;
}

/** The bare-chevron trigger passed to `AdminShell`'s `navHeaderBadge`. */
export function CallCentersViewSwitcher({ view, onViewChange }: CallCentersViewSwitcherProps) {
  return (
    <Select
      options={VIEW_OPTIONS}
      value={view}
      onValueChange={(v) => onViewChange(v as SideMenuView)}
      trigger={<ChevronDown className="h-4 w-4" aria-hidden="true" />}
      dropdownAlign="left"
    />
  );
}

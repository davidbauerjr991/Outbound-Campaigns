import { Gauge, Settings, BarChart3 } from "lucide-react";
import { LeftNav, type NavItem } from "@nicecxone/lyra-ui";
import { NavSearchField } from "./NavSearchField";
import { OnlineHelpButton } from "./OnlineHelpButton";

export type SidebarPage = "monitor" | "configure";

/**
 * App-level icon rail — matches lyra-ui's "Outbound Engagement Left Nav"
 * story (LeftNav.stories.tsx): Monitor / Configure / Review. `active`/
 * `onClick` are now derived from `activePage`/`onNavigate` (App.tsx's lifted
 * routing state) instead of a hardcoded `active: true` on Configure — same
 * "derive active + wire onClick from real nav state" fix PROJECT_SUMMARY.md
 * documents for agent-next-gen-v1/lyra-ux-templates' own LeftNav usage
 * (`buildNavItems(hasActiveInteraction, onClick)`). "Review" has no page
 * built yet, so it's left inert (no `onClick`) rather than wired to
 * something that doesn't exist.
 */
function buildNavItems(activePage: SidebarPage, onNavigate: (page: SidebarPage) => void): NavItem[] {
  return [
    {
      icon: <Gauge className="h-4 w-4" strokeWidth={1.5} />,
      label: "Monitor",
      active: activePage === "monitor",
      onClick: () => onNavigate("monitor"),
    },
    {
      icon: <Settings className="h-4 w-4" strokeWidth={1.5} />,
      label: "Configure",
      active: activePage === "configure",
      onClick: () => onNavigate("configure"),
    },
    { icon: <BarChart3 className="h-4 w-4" strokeWidth={1.5} />, label: "Review" },
  ];
}

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  /** Narrow-viewport hover-to-open overlay mode. */
  overlay?: boolean;
  /** Opens/closes the docked "Online Help" panel — lifted to App.tsx since
   * the panel itself renders as a sibling of `ContentArea`, not inside
   * `Sidebar`/`LeftNav` (same reason `Sidebar` doesn't own `sidebarOpen`
   * itself). */
  onHelpClick?: () => void;
  /** Which page is currently showing — drives which nav item renders active. */
  activePage: SidebarPage;
  /** Switches the active page (App.tsx swaps which page component renders). */
  onNavigate: (page: SidebarPage) => void;
}

export function Sidebar({ open, onToggle, overlay, onHelpClick, activePage, onNavigate }: SidebarProps) {
  return (
    <LeftNav
      items={buildNavItems(activePage, onNavigate)}
      open={open}
      onToggle={onToggle}
      overlay={overlay}
      // `header` (not `pinnedHeader`) — it shares the same scroll region,
      // `px-2` padding, and `pt-3` top inset as the Monitor/Configure/Review
      // list below it (left-nav.tsx suppresses the item list's own `pt-3`
      // whenever `header` is present, so there's no double gap), so Search
      // reads as the first row in that same list instead of a visually
      // separate pinned block above it. That `pt-3` inset also matters
      // functionally, not just visually: `pinnedHeader` sits flush at y=0
      // (`pt-0`, by design, for a plain icon-button trigger like CreateNew),
      // which left no room above the focused `SearchInput`'s focus ring —
      // it got clipped by the outer layout's `overflow-hidden` row in
      // App.tsx. `header`'s inset gives the ring room to render in full.
      // `expanded` is passed manually here (not auto-injected by `LeftNav`
      // itself in inline mode — see left-nav.tsx's `header` doc comment);
      // overlay mode still overrides it correctly via that component's own
      // `injectExpanded` cloning.
      header={<NavSearchField expanded={open} onExpand={onToggle} />}
      // `footer` pins to the bottom of the rail (left-nav.tsx) — same slot
      // the type's own doc comment cites a `CreateNew` trigger for.
      // `expanded` passed manually here too, same reasoning as `header`
      // above — `footer` isn't auto-injected with it in inline mode either.
      footer={<OnlineHelpButton expanded={open} onClick={onHelpClick} />}
    />
  );
}

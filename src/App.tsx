import { useState, useCallback, useEffect, useRef } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Sidebar, type SidebarPage } from "@/components/Sidebar";
import { OutboundCampaignsPage } from "@/components/OutboundCampaignsPage";
import { MonitorDashboardPage } from "@/components/MonitorDashboardPage";
import {
  ContentArea,
  Container,
  DraggablePanel,
  AiPanel,
  type DraggableVariant,
  type AiPanelSuggestion,
} from "@nicecxone/lyra-ui";

/* ── Session cookie helpers (left nav open/closed state) — same pattern as
   lyra-ux-templates/src/App.tsx. ── */
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
}
function readBoolCookie(name: string, fallback: boolean): boolean {
  const val = getCookie(name);
  if (val === "true") return true;
  if (val === "false") return false;
  return fallback;
}

const HELP_PANEL_DEFAULT_WIDTH = 360;
const HELP_PANEL_MAX_HEIGHT = 860;
const HELP_PANEL_BOTTOM_PADDING = 8;

const AI_PANEL_DEFAULT_WIDTH = 360;
const AI_PANEL_MAX_HEIGHT = 860;
const AI_PANEL_BOTTOM_PADDING = 8;
const AI_SUGGESTIONS: AiPanelSuggestion[] = [
  { id: "1", label: "Summarize this call center's performance" },
  { id: "2", label: "Which metrics changed since yesterday?" },
  { id: "3", label: "Draft a follow-up for the outbound email queue" },
];

/* "help" (Online Help) | "ai" (Ask AI) — the app's two Draggable-backed
   panels. Declared once at the top since both the dock/float coordination
   AND the z-index ordering below key off it. */
type PanelKey = "help" | "ai";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(() => readBoolCookie("lyra_sidebar_open", false));
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Float z-index ordering — lyra-ui's `draggable.tsx` documents this as
     a consumer contract ("Multi-Panel Z-Index & Docking Rules": "the most
     recently opened or clicked panel gets z-index: 10000, other float
     panels get 9999, track with `topPanel` state in the parent, attach
     `onMouseDown` to float wrapper") — the same `topPanel` pattern
     agent-next-gen-v1's `AgentNextGenPage.tsx` already uses for its own
     (larger) panel set. Only matters when both panels are floating at
     once (reachable here via manually undocking one while the other is
     already floating — the open/dock coordination below never creates
     that state on its own, but doesn't prevent it either). Without this,
     both floats hardcoded the same z-index and whichever rendered later
     in JSX always won regardless of click order. */
  const [topPanel, setTopPanel] = useState<PanelKey | null>(null);

  // Which page the main container shows now lives in the URL (`/monitor`,
  // `/configure`) instead of local `useState` — real routes, not just an
  // in-memory page switch, per explicit request. `/monitor` is the home
  // page: an unmatched/root path redirects there (see the `<Routes>` below),
  // reversing the earlier default (`"configure"` used to be what rendered
  // with no URL involved at all). `activePage`/`onNavigate` are still
  // threaded down to `Sidebar` with the same prop names/shape as before —
  // derived from `useLocation()` and calling `useNavigate()` respectively —
  // so `Sidebar.tsx`'s own `buildNavItems` didn't need to change at all.
  const navigate = useNavigate();
  const location = useLocation();
  const activePage: SidebarPage = location.pathname.startsWith("/configure") ? "configure" : "monitor";
  const handleNavigate = useCallback((page: SidebarPage) => navigate(`/${page}`), [navigate]);

  /* ── Online Help panel — docked (toggled open/closed to the right of the
     main container) or float (dragged loose), same `Draggable`-backed
     state machine as agent-next-gen-v1's `AiPanel` wiring in its App.tsx
     (the "AI Assistant toggles in" reference this was modeled on). Uses
     `DraggablePanel` instead of `AiPanel` since there's no AI/chat content
     here at all — `DraggablePanel` is lyra-ui's generic labeled shell for
     exactly this ("a blank 'Messages' or 'Schedule' dropdown", per its own
     doc comment) and renders its own "Nothing here yet." placeholder when
     no `children` are passed, which is all "Online Help" needs today. ── */
  type HelpPanelState = "closed" | "open" | "closing";
  const [helpPanelOpen,   setHelpPanelOpen]   = useState(false);
  const [helpMounted,     setHelpMounted]     = useState(false);
  const [helpState,       setHelpState]       = useState<HelpPanelState>("closed");
  const [helpVariant,     setHelpVariant]     = useState<DraggableVariant>("docked");
  const [helpWidth,       setHelpWidth]       = useState(HELP_PANEL_DEFAULT_WIDTH);
  const [helpHeight,      setHelpHeight]      = useState(HELP_PANEL_MAX_HEIGHT);
  const [helpIsResizing,  setHelpIsResizing]  = useState(false);
  const helpFloatLeft = useRef<number | null>(null);
  const helpFloatTop  = useRef<number | null>(null);
  const helpPanelRef  = useRef<HTMLDivElement>(null);
  const helpAnimTimer = useRef<ReturnType<typeof setTimeout>>();

  const computeHelpPanelHeight = () => {
    if (!containerRef.current) return HELP_PANEL_MAX_HEIGHT;
    const top = containerRef.current.getBoundingClientRect().top;
    return Math.min(window.innerHeight - top - HELP_PANEL_BOTTOM_PADDING, HELP_PANEL_MAX_HEIGHT);
  };

  useEffect(() => {
    clearTimeout(helpAnimTimer.current);
    if (helpPanelOpen) {
      if (containerRef.current && helpFloatLeft.current === null) {
        const r = containerRef.current.getBoundingClientRect();
        helpFloatLeft.current = r.left + containerRef.current.offsetWidth - helpWidth - 16;
      }
      setHelpHeight(computeHelpPanelHeight());
      setHelpMounted(true);
      setHelpState("open");
    } else {
      setHelpState("closing");
      helpAnimTimer.current = setTimeout(() => setHelpState("closed"), 150);
    }
    return () => clearTimeout(helpAnimTimer.current);
  }, [helpPanelOpen]);

  useEffect(() => {
    if (!helpPanelOpen) return;
    const onResize = () => setHelpHeight(computeHelpPanelHeight());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [helpPanelOpen]);

  const handleHelpVariantChange = (v: DraggableVariant) => {
    if (v === "docked") {
      if (helpPanelRef.current) {
        const r = helpPanelRef.current.getBoundingClientRect();
        helpFloatLeft.current = r.left;
        helpFloatTop.current  = r.top;
      }
      // Rule 3 (see the "Ask AI"/"Online Help" coordination section below):
      // explicitly re-docking this panel evicts whichever OTHER panel is
      // currently docked, swapping it to float instead of leaving two
      // panels docked at once.
      dockPanelExclusively("help");
    }
    setHelpVariant(v);
  };

  const getHelpFloatStyle = (): React.CSSProperties => {
    const rect = containerRef.current?.getBoundingClientRect();
    const left = helpFloatLeft.current !== null
      ? helpFloatLeft.current
      : containerRef.current
        ? (rect?.left ?? 0) + containerRef.current.offsetWidth - helpWidth - 16
        : 0;
    const top = helpFloatTop.current !== null ? helpFloatTop.current : (rect?.top ?? 0);
    return { position: "fixed", top, left, zIndex: 9999 };
  };

  /* ── Ask AI panel — docked/float/resize state machine, identical shape to
     the "Online Help" one above (same reason: `AiPanel`'s own `draggable`
     mode needs a consumer to own float-position tracking, open/close
     animation timing, and docked-width animation itself — nothing here is
     AI-specific, it's the same `Draggable`-backed pattern every real
     AdminShell consumer wires up, per lyra-form-generator's `App.tsx` and
     lyra-ui's `AdminShell.stories.tsx` `AdminShellWithAiDemo` reference).
     Lives here (app-level), not inside `MonitorDashboardPage`, so it's one
     shared panel/state per app — `onAskAiToggle` is threaded down to
     whichever page wants an "Ask AI" trigger in its own `pageActions`,
     same as lyra-form-generator threads `onAiPanelToggle` into its pages.
     Per "add the default top right buttons to the page header secondary,
     primary | Ask AI (with panel functionality)" — Monitor's page header
     is the first (only, so far) consumer of this trigger. */
  type AiPanelState = "closed" | "open" | "closing";
  const [aiPanelOpen,  setAiPanelOpen]  = useState(false);
  const [aiMounted,    setAiMounted]    = useState(false);
  const [aiState,      setAiState]      = useState<AiPanelState>("closed");
  const [aiVariant,    setAiVariant]    = useState<DraggableVariant>("docked");
  const [aiWidth,      setAiWidth]      = useState(AI_PANEL_DEFAULT_WIDTH);
  const [aiHeight,     setAiHeight]     = useState(AI_PANEL_MAX_HEIGHT);
  const [aiIsResizing, setAiIsResizing] = useState(false);
  const aiFloatLeft = useRef<number | null>(null);
  const aiFloatTop  = useRef<number | null>(null);
  const aiPanelRef  = useRef<HTMLDivElement>(null);
  const aiAnimTimer = useRef<ReturnType<typeof setTimeout>>();

  const computeAiPanelHeight = () => {
    if (!containerRef.current) return AI_PANEL_MAX_HEIGHT;
    const top = containerRef.current.getBoundingClientRect().top;
    return Math.min(window.innerHeight - top - AI_PANEL_BOTTOM_PADDING, AI_PANEL_MAX_HEIGHT);
  };

  useEffect(() => {
    clearTimeout(aiAnimTimer.current);
    if (aiPanelOpen) {
      if (containerRef.current && aiFloatLeft.current === null) {
        const r = containerRef.current.getBoundingClientRect();
        aiFloatLeft.current = r.left + containerRef.current.offsetWidth - aiWidth - 16;
      }
      setAiHeight(computeAiPanelHeight());
      setAiMounted(true);
      setAiState("open");
    } else {
      setAiState("closing");
      aiAnimTimer.current = setTimeout(() => setAiState("closed"), 150);
    }
    return () => clearTimeout(aiAnimTimer.current);
  }, [aiPanelOpen]);

  useEffect(() => {
    if (!aiPanelOpen) return;
    const onResize = () => setAiHeight(computeAiPanelHeight());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [aiPanelOpen]);

  const handleAiVariantChange = (v: DraggableVariant) => {
    if (v === "docked") {
      if (aiPanelRef.current) {
        const r = aiPanelRef.current.getBoundingClientRect();
        aiFloatLeft.current = r.left;
        aiFloatTop.current  = r.top;
      }
      // Rule 3 — see `dockPanelExclusively` below.
      dockPanelExclusively("ai");
    }
    setAiVariant(v);
  };

  const getAiFloatStyle = (): React.CSSProperties => {
    const rect = containerRef.current?.getBoundingClientRect();
    const left = aiFloatLeft.current !== null
      ? aiFloatLeft.current
      : containerRef.current
        ? (rect?.left ?? 0) + containerRef.current.offsetWidth - aiWidth - 16
        : 0;
    const top = aiFloatTop.current !== null ? aiFloatTop.current : (rect?.top ?? 0);
    return { position: "fixed", top, left, zIndex: 9999 };
  };

  /* ── "Online Help" / "Ask AI" dock-and-float coordination ──
     These two panels share ONE docked slot and ONE float slot between
     them — never two docked, never two floating at once — per an explicit
     request describing the desired behavior (matching lyra-ui's own
     documented "Multi-Panel Z-Index & Docking Rules" contract in
     draggable.tsx, and the generalized `dockPanelExclusively` pattern
     agent-next-gen-v1's `AgentNextGenPage.tsx` already uses for its own
     5-panel case — reused/generalized here for exactly these two panels,
     not reinvented, and no lyra-ui component itself was touched):

     1) Opening a panel (via its own trigger button) while the OTHER panel
        is already open and DOCKED replaces it outright: the old one
        closes, the newly opened one takes the docked slot.
     2) Opening a panel while the OTHER panel is already open and FLOATING
        leaves the floating one exactly where it is; the newly opened one
        opens DOCKED beside it — now one of each is open at once.
     3) If both are open (one docked, one floating) and the user explicitly
        re-docks the floating one (drag-to-dock, or `Draggable`'s own dock
        toggle), the panel that WAS docked swaps to floating instead of
        just closing — a swap, not an eviction-by-closing. This is the
        same "single-dock rule" `handleHelpVariantChange`/
        `handleAiVariantChange` above already call into
        (`dockPanelExclusively`) — rules 1/2 below are the additional,
        new part: coordinating what the OPEN trigger itself does, which
        no existing reference implements (every other app's panel set is
        large enough that several floating at once is fine; here there
        are only ever these two, so a stricter "at most one docked + one
        floating, total" rule is the correct one). */
  interface PanelHandle {
    open: boolean;
    setOpen: (open: boolean) => void;
    variant: DraggableVariant;
    setVariant: (variant: DraggableVariant) => void;
    width: number;
    floatLeft: React.MutableRefObject<number | null>;
    floatTop: React.MutableRefObject<number | null>;
  }
  const getPanelHandle = (key: PanelKey): PanelHandle =>
    key === "help"
      ? { open: helpPanelOpen, setOpen: setHelpPanelOpen, variant: helpVariant, setVariant: setHelpVariant, width: helpWidth, floatLeft: helpFloatLeft, floatTop: helpFloatTop }
      : { open: aiPanelOpen, setOpen: setAiPanelOpen, variant: aiVariant, setVariant: setAiVariant, width: aiWidth, floatLeft: aiFloatLeft, floatTop: aiFloatTop };
  const otherPanelKey = (key: PanelKey): PanelKey => (key === "help" ? "ai" : "help");

  /* Rule 3 — evicts whichever OTHER panel is currently docked to float,
     capturing its float position from the shared container's own rect
     (identical calculation to agent-next-gen-v1's own
     `dockPanelExclusively`). Only called from `handleHelpVariantChange`/
     `handleAiVariantChange` above — i.e. only when a panel becomes
     "docked" via the user's own drag-to-dock gesture on an
     already-floating panel. `openPanel` below never calls this: it sets
     `variant` directly via the raw setter (rules 1/2 already resolve
     what the other panel should do — close it or leave it floating —
     before the new panel ever docks), so there's nothing left to evict
     by the time it opens. */
  const dockPanelExclusively = (dockingKey: PanelKey) => {
    const other = getPanelHandle(otherPanelKey(dockingKey));
    if (other.open && other.variant === "docked" && containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      other.floatLeft.current = r.left + containerRef.current.offsetWidth - other.width - 16;
      other.floatTop.current = null;
      other.setVariant("float");
    }
  };

  /* Rules 1 & 2 — the "Online Help"/"Ask AI" trigger buttons call this
     instead of a bare open/close toggle. */
  const openPanel = (key: PanelKey) => {
    const self = getPanelHandle(key);
    if (self.open) {
      // Already open — the trigger acts as a close toggle, same as before.
      self.setOpen(false);
      return;
    }
    const other = getPanelHandle(otherPanelKey(key));
    if (other.open) {
      if (other.variant === "docked") {
        // Rule 1: replace the docked panel outright.
        other.setOpen(false);
      }
      // Rule 1 (continued) and rule 2 both land here for the newly-opened
      // panel: docked, whether the other panel just closed above (rule 1)
      // or stays floating beside it untouched (rule 2).
      self.setVariant("docked");
    }
    self.setOpen(true);
    // "The most recently opened ... panel gets z-index: 10000" — only
    // matters once this panel is (or becomes) floating alongside the
    // other one, but harmless to always set.
    setTopPanel(key);
  };

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen((prev) => {
      const next = !prev;
      setCookie("lyra_sidebar_open", String(next));
      return next;
    });
  }, []);

  /* Narrow-viewport hover-to-open overlay mode for the left nav — same
     pattern as lyra-ux-templates/src/App.tsx's `isNavNarrow` wiring. */
  const [windowWidth, setWindowWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isNavNarrow = windowWidth < 1280;

  useEffect(() => {
    if (isNavNarrow && sidebarOpen) {
      setSidebarOpen(false);
      setCookie("lyra_sidebar_open", "false");
    }
  }, [isNavNarrow]); // eslint-disable-line react-hooks/exhaustive-deps

  const helpPanel = helpMounted ? (
    <DraggablePanel
      ref={helpPanelRef}
      title="Online Help"
      draggableVariant={helpVariant}
      defaultWidth={helpWidth}
      defaultHeight={helpHeight}
      onVariantChange={handleHelpVariantChange}
      onWidthChange={setHelpWidth}
      onResizeStateChange={setHelpIsResizing}
      onClose={() => setHelpPanelOpen(false)}
      onInteract={() => setTopPanel("help")}
      className={helpVariant === "docked" ? "h-full" : undefined}
    />
  ) : null;

  const aiPanel = aiMounted ? (
    <AiPanel
      ref={aiPanelRef}
      draggable
      draggableVariant={aiVariant}
      defaultDraggableWidth={aiWidth}
      defaultDraggableHeight={aiHeight}
      onVariantChange={handleAiVariantChange}
      onWidthChange={setAiWidth}
      onResizeStateChange={setAiIsResizing}
      suggestions={AI_SUGGESTIONS}
      onClose={() => setAiPanelOpen(false)}
      onInteract={() => setTopPanel("ai")}
      className={aiVariant === "docked" ? "h-full" : undefined}
    />
  ) : null;

  return (
    <div className="flex h-screen flex-col overflow-hidden animate-in fade-in-0 duration-500">
      <Header />
      <div className="flex flex-1 overflow-hidden bg-lyra-bg-surface-shell">
        <Sidebar
          open={sidebarOpen}
          onToggle={handleSidebarToggle}
          overlay={isNavNarrow}
          onHelpClick={() => openPanel("help")}
          activePage={activePage}
          onNavigate={handleNavigate}
        />

        <ContentArea ref={containerRef} className="relative min-w-0">
          <Container className="relative flex flex-1 overflow-hidden">
            {/* `/monitor` is the home page — an unmatched path (including
                bare `/`) redirects there via the trailing wildcard route,
                rather than `/configure` rendering by default with no real
                URL of its own the way it used to. */}
            <Routes>
              <Route path="/monitor" element={<MonitorDashboardPage onAskAiToggle={() => openPanel("ai")} />} />
              <Route path="/configure" element={<OutboundCampaignsPage />} />
              <Route path="*" element={<Navigate to="/monitor" replace />} />
            </Routes>
          </Container>

          {/* Online Help panel — float (fixed position, doesn't take layout space).
              `zIndex` implements lyra-ui's own documented "Multi-Panel
              Z-Index & Docking Rules" (draggable.tsx): the most recently
              opened or clicked float panel gets 10000, the other floating
              one gets 9999 — only actually distinguishable when both panels
              are floating at once (e.g. one docked panel manually undocked
              while the other is already floating).
              "Bring to front" is wired via `DraggablePanel`'s `onInteract`
              prop (set above, next to `helpPanel`'s other props) rather than
              an `onMouseDown` on this wrapper — an ancestor `pointerEvents:
              "auto"` div doesn't move with the panel's CSS `transform` drag
              offset, so it's left behind at the panel's ORIGINAL position
              as an invisible "ghost" hit area once the panel is dragged
              elsewhere, silently swallowing clicks there (this is exactly
              what `draggable.tsx`'s own `onInteract` doc comment warns
              about, and was the root cause of a real bug: after dragging
              a panel away from its start position near the page header,
              the header's own buttons stopped responding to clicks — they
              sat under this leftover ghost area). `Draggable`'s own root
              node already sets `pointer-events: auto` on itself and moves
              with the transform, so no wrapper div is needed here at all
              — this div now exists purely to hold the fade/slide
              open-close animation styles, with `pointerEvents: "none"` so
              it never itself intercepts anything. */}
          {helpVariant === "float" && helpMounted && (
            <div
              style={{
                ...getHelpFloatStyle(),
                zIndex: topPanel === "help" ? 10000 : 9999,
                pointerEvents: "none",
                visibility: helpState === "closed" ? "hidden" : "visible",
                opacity: helpState === "open" ? 1 : 0,
                transform: helpState === "open" ? "translateY(0)" : "translateY(-8px)",
                transition: helpState === "open"
                  ? "opacity 150ms ease, transform 150ms ease"
                  : "opacity 100ms ease, transform 100ms ease",
              }}
            >
              {helpPanel}
            </div>
          )}

          {/* Ask AI panel — float (fixed position, doesn't take layout space).
              Same z-index contract, and same "no ancestor onMouseDown
              wrapper" fix, as Online Help's own float wrapper above —
              "bring to front" is wired via `AiPanel`'s `onInteract` prop. */}
          {aiVariant === "float" && aiMounted && (
            <div
              style={{
                ...getAiFloatStyle(),
                zIndex: topPanel === "ai" ? 10000 : 9999,
                pointerEvents: "none",
                visibility: aiState === "closed" ? "hidden" : "visible",
                opacity: aiState === "open" ? 1 : 0,
                transform: aiState === "open" ? "translateY(0)" : "translateY(-8px)",
                transition: aiState === "open"
                  ? "opacity 150ms ease, transform 150ms ease"
                  : "opacity 100ms ease, transform 100ms ease",
              }}
            >
              {aiPanel}
            </div>
          )}
        </ContentArea>

        {/* Online Help panel — docked (sibling of the content column so flex layout keeps it in-bounds) */}
        {helpVariant === "docked" && (
          <div className="pb-3" style={{
            width: helpState === "open" ? helpWidth : 0,
            marginRight: helpState === "open" ? 12 : 0,
            overflow: "hidden",
            flexShrink: 0,
            transition: helpIsResizing ? "none" : "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
            <div
              className="h-full animate-in fade-in-0 duration-150"
              style={{ width: helpWidth, display: helpState === "open" ? "block" : "none" }}
            >
              {helpPanel}
            </div>
          </div>
        )}

        {/* Ask AI panel — docked (sibling of the content column so flex layout keeps it in-bounds) */}
        {aiVariant === "docked" && (
          <div className="pb-3" style={{
            width: aiState === "open" ? aiWidth : 0,
            marginRight: aiState === "open" ? 12 : 0,
            overflow: "hidden",
            flexShrink: 0,
            transition: aiIsResizing ? "none" : "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
            <div
              className="h-full animate-in fade-in-0 duration-150"
              style={{ width: aiWidth, display: aiState === "open" ? "block" : "none" }}
            >
              {aiPanel}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

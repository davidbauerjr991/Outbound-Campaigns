import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { SearchInput, Tooltip } from "@nicecxone/lyra-ui";

/**
 * Left nav "above Monitor" search field — lives in `LeftNav`'s `header` slot
 * (left-nav.tsx), which shares one scroll region *and* the same `px-2 pt-3`
 * padding as the Monitor/Configure/Review item list right below it (the
 * item list's own `pt-3` is suppressed whenever `header` is present, so
 * there's no double gap) — this reads as the first row in that same list,
 * not a separately-styled pinned block above it. `pinnedHeader` was tried
 * first and rejected: it sits flush at y=0 by design (for a plain
 * icon-button trigger like CreateNew), which left no room for the focused
 * `SearchInput`'s focus ring above it — the ring got clipped by the outer
 * app layout's `overflow-hidden` row (App.tsx). `header`'s `pt-3` inset
 * gives the ring room to render in full.
 *
 * `expanded` is the rail's own open/collapsed state. `LeftNav`'s inline mode
 * doesn't auto-inject `expanded` onto `header` the way overlay mode does
 * (see that prop's doc comment in left-nav.tsx) — this component's consumer
 * (Sidebar.tsx) passes it through manually, tied to the same `open` prop it
 * hands `LeftNav` itself.
 *
 * Collapsed: renders as a single icon button matching every other rail
 * item's exact button treatment (`h-9 w-9 rounded-lyra-sm`, same hover/
 * active/focus classes — copied from left-nav.tsx's `iconOnlyNav`), not a
 * shrunken version of the search input. Clicking it calls `onExpand` (wired
 * to the rail's own `onToggle`) to open the rail, then focuses the real
 * search input once it mounts.
 *
 * Expanded: renders the real `SearchInput` component (search-input.tsx) —
 * never a hand-rolled input, per lyra-ui's "use the real component" rule.
 */
interface NavSearchFieldProps {
  /** Whether the rail is currently expanded */
  expanded?: boolean;
  /** Opens the rail (the collapsed button's click handler) */
  onExpand?: () => void;
}

export function NavSearchField({ expanded, onExpand }: NavSearchFieldProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const focusOnExpandRef = useRef(false);

  // Focus the real input the moment it mounts after the collapsed button's
  // click expanded the rail — not on every render where `expanded` happens
  // to already be true (e.g. the rail was already open on page load).
  useEffect(() => {
    if (expanded && focusOnExpandRef.current) {
      inputRef.current?.focus();
      focusOnExpandRef.current = false;
    }
  }, [expanded]);

  if (!expanded) {
    return (
      <Tooltip content="Search" placement="right" asLabel>
        <button
          onClick={() => {
            focusOnExpandRef.current = true;
            onExpand?.();
          }}
          aria-label="Search"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lyra-sm text-lyra-fg-default transition-colors hover:bg-lyra-state-hover active:bg-lyra-state-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2"
        >
          <span aria-hidden="true">
            <Search className="h-4 w-4" strokeWidth={1.5} />
          </span>
        </button>
      </Tooltip>
    );
  }

  return (
    <SearchInput
      ref={inputRef}
      value={value}
      onValueChange={setValue}
      placeholder="Search"
      aria-label="Search navigation"
      // `mr-2` on top of `header`'s own `px-2` — not a clipping fix, an
      // overlap fix: the rail's collapse toggle (left-nav.tsx's
      // `toggleButton`, a 20px circle at `-right-3`) has its left edge
      // sitting exactly 8px in from the aside's right edge — the same
      // depth `header`'s `px-2` alone puts this input's border at, so the
      // focus ring (2px past the border) painted directly under that
      // circle, which sits at a higher stacking order (`z-10`, `position:
      // absolute`) and visually bit into it.
      // Margin, not padding: `pr-2` was tried first and rejected — it
      // shrinks the *content box* `SearchInput`'s own `w-full` `<input>`
      // sizes against, but its absolutely-positioned `ClearButton` (right-2,
      // search-input.tsx) is positioned off this wrapper's *padding* box,
      // which padding on this same element doesn't move. That desynced the
      // two — the input's own right edge shifted in 8px while the clear
      // button stayed put — squishing the "×" up against the input's
      // border/ring instead of leaving its normal 8px clearance. `mr-2`
      // instead shifts the whole wrapper (icon + input + clear button, all
      // still positioned relative to each other exactly as designed) left
      // as one rigid unit, clearing the toggle without disturbing anything
      // inside.
      // `mb-2` — `header` and the Monitor/Configure/Review list share one
      // scroll region with no gap of their own between them (left-nav.tsx
      // suppresses the list's `pt-3` whenever `header` is present, see this
      // file's own top comment), so without this the search field sat flush
      // against Monitor right below it.
      // No `w-full` alongside `mr-2` — an explicit 100% width plus a margin
      // adds up to *more* than the container's content width (margin isn't
      // subtracted from an explicit width the way it is from an auto/
      // stretched one), which would push this back into the overflow this
      // whole fix exists to avoid. `header`'s wrapper already sets
      // `items-stretch` when open, so leaving width unset lets flex's own
      // stretch sizing fill the available space with the margin already
      // subtracted, correctly this time.
      className="mr-2 mb-2"
    />
  );
}

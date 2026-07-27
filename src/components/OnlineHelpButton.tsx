import { LifeBuoy } from "lucide-react";
import { Tooltip, cn } from "@nicecxone/lyra-ui";

/**
 * Left nav "bottom left" help launcher — lives in `LeftNav`'s `footer` slot
 * (left-nav.tsx), which pins content to the bottom of the rail the same way
 * `pinnedHeader` pins to the top (e.g. a `CreateNew` trigger, per that
 * prop's own doc comment).
 *
 * `expanded` drives a single persistent button (not two JSX branches
 * swapped by state) whose width/padding and label reveal are controlled
 * entirely by conditional classes on that one element — the same technique
 * `CreateNew`'s own trigger uses (create-new.tsx), and now documented as a
 * standalone, non-Popover example in lyra-ui itself: see `LeftNav.stories.
 * tsx`'s "Footer Button (Expandable)" story / `FooterButton` for the
 * general-purpose reference this was adapted from. Swapping two branches
 * instead would remount the button (and its `Tooltip`) every time the rail
 * opens/closes, breaking the CSS transition — see that story's own comment
 * for the fuller rationale.
 *
 * Was previously a real `Button` (button.tsx) fixed at `icon-lg` — correct
 * for the collapsed state, but `Button` has no built-in way to grow into a
 * full-width labeled button as the rail expands, which is what this needs
 * now. Its color/hover/active/focus classes below are still `Button`'s own
 * "default" (primary) variant tokens, copied directly rather than guessed
 * (per CONTRIBUTING.md §1) — same as `CreateNew`'s trigger does.
 *
 * Corners are `rounded-lyra-sm`, not `rounded-full` — an earlier version of
 * this button used `rounded-full`, treating an older screenshot's rounder
 * corners as their own deliberate "circular" shape. `rounded-lyra-sm` is
 * the *only* corner radius `buttonVariants` (button.tsx) ever applies,
 * across every variant and size — there's no "circle"/pill shape anywhere
 * in `Button`'s real API, so `rounded-full` wasn't a style choice, it was
 * another value invented outside this design system's actual scale (same
 * failure as the earlier fabricated `h-12` size, just in shape instead of
 * size — see PROJECT_SUMMARY.md's "Picking a real size token isn't enough"
 * entry for that one). `shadow-md` was dropped for the same reason: not
 * part of `Button`'s real treatment either.
 *
 * `expanded` is the rail's own open/collapsed state. `LeftNav`'s inline mode
 * doesn't auto-inject `expanded` onto `footer` the way overlay mode does
 * (see that prop's doc comment in left-nav.tsx) — this component's consumer
 * (Sidebar.tsx) passes it through manually, tied to the same `open` prop it
 * hands `LeftNav` itself.
 */
interface OnlineHelpButtonProps {
  expanded?: boolean;
  onClick?: () => void;
}

export function OnlineHelpButton({ expanded = false, onClick }: OnlineHelpButtonProps) {
  const trigger = (
    <button
      aria-label="Online Help"
      onClick={onClick}
      className={cn(
        "flex h-9 items-center justify-center rounded-lyra-sm overflow-hidden",
        "bg-lyra-bg-primary text-lyra-fg-on-primary transition-all duration-200",
        "hover:bg-lyra-state-hover-primary active:bg-lyra-state-pressed-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2",
        expanded ? "w-full px-4" : "w-9 px-0"
      )}
    >
      <LifeBuoy className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} aria-hidden="true" />
      {/* max-w-0/ml-0/opacity-0 collapsed vs. max-w-[200px]/ml-2/opacity-100
          expanded — not `display: none`, which can't be transitioned.
          Spacing lives on the label itself, not a `gap-*` on the button, so
          it contributes nothing while collapsed and the icon stays
          centered. */}
      <span
        aria-hidden={!expanded}
        className={cn(
          "lyra-body-md overflow-hidden whitespace-nowrap transition-all duration-200",
          expanded ? "max-w-[200px] ml-2 opacity-100" : "max-w-0 ml-0 opacity-0"
        )}
      >
        Online Help
      </span>
    </button>
  );

  // Tooltip only needed collapsed — the expanded button already shows its
  // own label. `disabled={expanded}` suppresses it instead of conditionally
  // wrapping, so this wrapper's shape never changes and nothing remounts
  // just because `expanded` toggled.
  return (
    <Tooltip content="Online Help" placement="right" disabled={expanded}>
      <span className="flex w-full justify-center">{trigger}</span>
    </Tooltip>
  );
}

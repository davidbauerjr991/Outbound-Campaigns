import { useSyncExternalStore } from "react";
import type { TreeMenuChild, TreeMenuItem } from "@nicecxone/lyra-ui";

/* Remembers which interior-nav groups are open. Every page renders its own AdminShell, so the
   interior nav is rebuilt on each left-nav switch (Monitor / Configure / Review); this module
   keeps the open/closed choice outside those remounts and feeds it back through TreeMenu's
   controlled `open` / `onOpenChange`. Keyed by area + label path, held for the visit. */

const store = new Map<string, boolean>();
const listeners = new Set<() => void>();
let version = 0;

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function setTreeOpen(key: string, open: boolean) {
  store.set(key, open);
  version++;
  listeners.forEach((fn) => fn());
}

/** Subscribe the calling component so it re-renders when any group is toggled. */
export function useTreeOpenState() {
  useSyncExternalStore(subscribe, () => version);
}

type Node = TreeMenuItem | TreeMenuChild;

/** Returns `items` with every group made controlled from the remembered state; a group never
    toggled falls back to its own `defaultOpen`. */
export function withRememberedOpen<T extends Node>(area: string, items: T[], parent = ""): T[] {
  return items.map((item) => {
    if (!item.children || item.children.length === 0) return item;
    const key = `${area}::${parent}${item.label}`;
    // A group that starts open (it holds the current page) counts as the user's choice from now on,
    // so it is still open after they move to another page. Idempotent, so safe to run on render.
    if (!store.has(key) && item.defaultOpen) store.set(key, true);
    return {
      ...item,
      open: store.get(key) ?? item.defaultOpen ?? false,
      onOpenChange: (next: boolean) => {
        setTreeOpen(key, next);
        item.onOpenChange?.(next);
      },
      children: withRememberedOpen(area, item.children, `${parent}${item.label} > `),
    };
  });
}

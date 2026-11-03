import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { TreeMenuItem } from "@nicecxone/lyra-ui";

/* User types picked from the app-name dropdown. Each one models a tenant
   condition and hides the Configure nav items that condition makes redundant.
   Items are matched by label; labels that aren't in the nav yet are simply
   no-ops until those pages are added. */
export type UserTypeKey = "standard" | "acd-skill" | "user-agent" | "acd" | "workspace-enhanced" | "workspace-premium" | "full-integration";

export interface UserType {
  key: UserTypeKey;
  label: string;
  hides: readonly string[];
  /** Nav label overrides for this type, keyed by the default (Skills-wording) label. */
  renames?: Readonly<Record<string, string>>;
}

export const USER_TYPES: readonly UserType[] = [
  {
    key: "standard",
    label: "Outbound Engagement Stand Alone",
    hides: [],
    renames: { Skills: "Services", "Skill Groups": "Service Groups", "Manage Skills": "Manage Services" },
  },
  { key: "acd-skill", label: "CXone ACD Skill Management Enabled", hides: ["Ticketing", "Accounts", "Skill Groups"] },
  { key: "user-agent", label: "CXone User/Agent Management Enabled", hides: ["Ticketing", "Accounts", "Agent Skill", "Agent Teams", "Roles"] },
  { key: "acd", label: "CXone ACD Enabled", hides: ["Ticketing", "Accounts", "Agent Phonebook", "Scheduled Callback", "Quick Responsebook"] },
  { key: "workspace-enhanced", label: "Agent Workspace Enhanced", hides: ["Block Caller ID", "Web Widget", "Client Rate", "Business Unit", "Agent Scheduling"] },
  // No hiding rules specified yet for Premium — shows the full nav until they are.
  { key: "workspace-premium", label: "Agent Workspace Premium", hides: [] },
  // No hiding rules specified yet for Full Integration either.
  { key: "full-integration", label: "Full Integration", hides: [] },
];

const STORAGE_KEY = "outbound_user_type";

function readStored(): UserTypeKey {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (USER_TYPES.some((t) => t.key === v)) return v as UserTypeKey;
  } catch { /* storage unavailable */ }
  return "standard";
}

interface UserTypeApi {
  userType: UserType;
  setUserType: (key: UserTypeKey) => void;
}

const UserTypeContext = createContext<UserTypeApi | null>(null);

export function UserTypeProvider({ children }: { children: ReactNode }) {
  const [key, setKey] = useState<UserTypeKey>(readStored);
  const setUserType = useCallback((next: UserTypeKey) => {
    setKey(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* storage unavailable */ }
  }, []);
  const value = useMemo<UserTypeApi>(
    () => ({ userType: USER_TYPES.find((t) => t.key === key)!, setUserType }),
    [key, setUserType],
  );
  return <UserTypeContext.Provider value={value}>{children}</UserTypeContext.Provider>;
}

export function useUserType(): UserTypeApi {
  const ctx = useContext(UserTypeContext);
  if (!ctx) throw new Error("useUserType must be used inside <UserTypeProvider>");
  return ctx;
}

/** Drops hidden items from a nav tree (and any group that only had hidden children), then applies the type's label renames. */
export function filterNavItems(items: TreeMenuItem[], { hides, renames = {} }: Pick<UserType, "hides" | "renames">): TreeMenuItem[] {
  const rename = (label: string) => renames[label] ?? label;
  return items.flatMap((item) => {
    if (hides.includes(item.label)) return [];
    if (!item.children) return [{ ...item, label: rename(item.label) }];
    const children = item.children.filter((c) => !hides.includes(c.label)).map((c) => ({ ...c, label: rename(c.label) }));
    return children.length === 0 ? [] : [{ ...item, label: rename(item.label), children }];
  });
}

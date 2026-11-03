import type { TreeMenuItem } from "@nicecxone/lyra-ui";

export type ConfigurePage = "campaigns" | "customers" | "contact-timing" | "profiles";

/** The nav group that holds each Configure page. */
export const ACTIVE_GROUP: Record<ConfigurePage, string> = { campaigns: "Campaigns", customers: "Customers", "contact-timing": "Channels", profiles: "Channels" };

/** Interior nav for the whole Configure area, rendered once by ConfigureLayout. Only the pages built so far navigate;
    every other row is a placeholder. Every group is controlled: `openGroups` says which are open and
    `setGroupOpen` is called when the user toggles one (lyra-ui's TreeMenu `open` / `onOpenChange`). */
export function buildConfigureNavItems(
  active: ConfigurePage,
  navigate: (path: string) => void,
  openGroups: ReadonlySet<string>,
  setGroupOpen: (label: string, open: boolean) => void,
): TreeMenuItem[] {
  const group = (label: string) => ({ open: openGroups.has(label), onOpenChange: (next: boolean) => setGroupOpen(label, next) });
  return [
    {
      label: "Campaigns",
      ...group("Campaigns"),
      children: [
        { label: "Campaigns", active: active === "campaigns", onClick: () => navigate("/configure") },
        { label: "Campaign Templates" },
        { label: "Segmentation" },
      ],
    },
    {
      label: "Skills",
      ...group("Skills"),
      children: [
        { label: "Client" },
        { label: "Call Centers" },
        { label: "Skill Groups" },
        { label: "Manage Skills" },
        { label: "Business Unit" },
      ],
    },
    {
      label: "Agents",
      ...group("Agents"),
      children: [
        { label: "Agents" },
        { label: "Agent Desktop" },
        { label: "Termination Codes" },
        { label: "Agent Skill" },
        { label: "Agent Teams" },
        { label: "Agent Phonebook" },
        { label: "Scheduled Callback" },
        { label: "Quick Responsebook" },
      ],
    },
    {
      label: "Ticketing",
      ...group("Ticketing"),
      children: [{ label: "Manage Tickets" }, { label: "Tickets Config" }],
    },
    {
      label: "Customers",
      ...group("Customers"),
      children: [
        { label: "Customer Manager", active: active === "customers", onClick: () => navigate("/configure/customers") },
        { label: "DNC" },
        { label: "Attempt Supervisor" },
      ],
    },
    {
      label: "Accounts",
      ...group("Accounts"),
      children: [{ label: "Manage Accounts" }, { label: "Accounts Config" }],
    },
    {
      // One level: every channel-setup page sits directly under Channels (voice pages first, then Email, SMS, Web Widget).
      label: "Channels",
      ...group("Channels"),
      children: [
        { label: "Phone Numbers" },
        { label: "Profiles", active: active === "profiles", onClick: () => navigate("/configure/profiles") },
        { label: "Contact Timing", active: active === "contact-timing", onClick: () => navigate("/configure/contact-timing") },
        { label: "Strategy" },
        { label: "CID Package" },
        { label: "Block Caller ID" },
        { label: "Email Channel" },
        { label: "SMS Channel" },
        { label: "Widget" },
      ],
    },
    {
      label: "Messaging",
      ...group("Messaging"),
      children: [
        { label: "Messages" },
        { label: "Phrases" },
        { label: "Contact Flow" },
      ],
    },
    {
      label: "Input / Output",
      ...group("Input / Output"),
      children: [
        { label: "SFTP Browser" },
        { label: "Input" },
        { label: "Export Format" },
        { label: "Reporting Outcomes" },
        { label: "Jobs" },
      ],
    },
    {
      label: "System",
      ...group("System"),
      children: [
        { label: "Audit Log Viewer" },
        { label: "User" },
        { label: "Fields" },
        { label: "Roles" },
        { label: "Settings" },
        { label: "User Tasks" },
      ],
    },
  ];
}

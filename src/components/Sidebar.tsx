import { Gauge, Settings, BarChart3 } from "lucide-react";
import { LeftNav, type NavItem } from "@nicecxone/lyra-ui";

/**
 * App-level icon rail — matches lyra-ui's "Outbound Engagement Left Nav"
 * story (LeftNav.stories.tsx) exactly: Monitor / Configure / Review.
 * Configure is active — the Campaigns admin page lives under Configure.
 */
const navItems: NavItem[] = [
  { icon: <Gauge className="h-4 w-4" strokeWidth={1.5} />, label: "Monitor" },
  { icon: <Settings className="h-4 w-4" strokeWidth={1.5} />, label: "Configure", active: true },
  { icon: <BarChart3 className="h-4 w-4" strokeWidth={1.5} />, label: "Review" },
];

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  /** Narrow-viewport hover-to-open overlay mode. */
  overlay?: boolean;
}

export function Sidebar({ open, onToggle, overlay }: SidebarProps) {
  return <LeftNav items={navItems} open={open} onToggle={onToggle} overlay={overlay} />;
}

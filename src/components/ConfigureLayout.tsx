import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AdminShell, Button } from "@nicecxone/lyra-ui";
import { ConfigurePanelContext, type ConfigurePanelApi, type InteriorPanelRequest } from "./ConfigurePanel";
import { filterNavItems, useUserType } from "@/lib/user-type";
import { ACTIVE_GROUP, buildConfigureNavItems, type ConfigurePage } from "./ConfigureNav";

/* Layout route for the whole Configure area. It owns the one AdminShell — the interior nav, the page
   header and the panels — and the pages render inside it through <Outlet />, so moving between
   Campaigns and Customer Manager swaps only the content: the nav stays mounted (no re-render flash,
   its open groups, scroll and focus are kept) and pin state is shared by every Configure page.

   Each page's header (title + buttons) and side-panel placeholders live in PAGE_CHROME below, keyed
   by page. They are static today; once a page's header buttons need to act on that page's own state,
   let the page hand its header to this layout instead. */

const PAGE_CHROME: Record<ConfigurePage, { title: string; actions: ReactNode; interiorPanel?: ReactNode; rightPanel?: ReactNode }> = {
  campaigns: {
    title: "Campaigns",
    actions: (
      <>
        <Button variant="outline">Deactivate</Button>
        <Button variant="outline">Requeue</Button>
        <Button>Upload</Button>
      </>
    ),
    interiorPanel: (
      <div className="p-4">
        <p className="lyra-body-md text-lyra-fg-secondary">Panel content goes here.</p>
      </div>
    ),
    rightPanel: (
      <div className="p-4">
        <p className="lyra-body-md text-lyra-fg-secondary">Side panel content.</p>
      </div>
    ),
  },
  profiles: {
    title: "Profiles",
    actions: <Button>Add Profile</Button>,
  },
  "contact-timing": {
    title: "Contact Timing",
    actions: <Button>Add Contact Timing</Button>,
  },
  customers: {
    title: "Customer Manager",
    actions: (
      <>
        <Button variant="outline">Add Campaign</Button>
        <Button>Add Customer</Button>
      </>
    ),
  },
};

export function ConfigureLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active: ConfigurePage = pathname.startsWith("/configure/customers")
    ? "customers"
    : pathname.startsWith("/configure/contact-timing")
      ? "contact-timing"
      : pathname.startsWith("/configure/profiles")
        ? "profiles"
        : "campaigns";

  /* Which nav groups are open. Starts with the group holding the page we landed on; groups the user
     opens or closes afterwards stay that way, and arriving on a page opens the group that holds it. */
  const [openGroups, setOpenGroups] = useState<ReadonlySet<string>>(() => new Set([ACTIVE_GROUP[active]]));
  const setGroupOpen = useCallback((label: string, open: boolean) => {
    setOpenGroups((prev) => {
      if (prev.has(label) === open) return prev;
      const next = new Set(prev);
      if (open) next.add(label);
      else next.delete(label);
      return next;
    });
  }, []);
  useEffect(() => setGroupOpen(ACTIVE_GROUP[active], true), [active, setGroupOpen]);

  const { userType } = useUserType();
  const navItems = useMemo(
    () => filterNavItems(buildConfigureNavItems(active, navigate, openGroups, setGroupOpen), userType),
    [active, navigate, openGroups, setGroupOpen, userType],
  );
  const chrome = PAGE_CHROME[active];

  /* Interior panel a page asked for (see ConfigurePanel). Kept after it closes so the panel can animate out with
     its content still showing; cleared when the route changes. */
  const [panel, setPanel] = useState<{ request: InteriorPanelRequest; open: boolean } | null>(null);
  const panelApi = useMemo<ConfigurePanelApi>(
    () => ({
      open: (request) => setPanel({ request, open: true }),
      close: () => setPanel((p) => (p ? { ...p, open: false } : p)),
    }),
    [],
  );
  useEffect(() => setPanel(null), [pathname]);

  return (
    <AdminShell
      storageKeyPrefix="lyra_configure"
      navTitle="Configure"
      navItems={navItems}
      defaultLeftPinned
      showPageHeader
      pageTitle={chrome.title}
      pageActions={chrome.actions}
      interiorPanelTitle={panel?.request.title}
      interiorPanelOpen={panel?.open ?? false}
      onInteriorPanelClose={() => {
        panel?.request.onClose?.();
        panelApi.close();
      }}
      interiorPanelContent={panel ? panel.request.content : chrome.interiorPanel}
      rightPanelContent={chrome.rightPanel}
    >
      <ConfigurePanelContext.Provider value={panelApi}>
        <Outlet />
      </ConfigurePanelContext.Provider>
    </AdminShell>
  );
}

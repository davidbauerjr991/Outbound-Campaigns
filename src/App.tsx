import { useState, useCallback, useEffect } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { OutboundCampaignsPage } from "@/components/OutboundCampaignsPage";
import { ContentArea, Container } from "@nicecxone/lyra-ui";

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

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(() => readBoolCookie("lyra_sidebar_open", false));

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

  return (
    <div className="flex h-screen flex-col overflow-hidden animate-in fade-in-0 duration-500">
      <Header />
      <div className="flex flex-1 overflow-hidden bg-lyra-bg-surface-shell">
        <Sidebar open={sidebarOpen} onToggle={handleSidebarToggle} overlay={isNavNarrow} />

        <ContentArea className="relative min-w-0">
          <Container className="relative flex flex-1 overflow-hidden">
            <OutboundCampaignsPage />
          </Container>
        </ContentArea>
      </div>
    </div>
  );
}

export default App;

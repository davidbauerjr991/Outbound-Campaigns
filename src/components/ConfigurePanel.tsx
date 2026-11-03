import { createContext, useContext, type ReactNode } from "react";

/* Lets a Configure page open the shell's interior (right, in-content) panel. ConfigureLayout owns the one
   AdminShell, so the page hands it the panel's title and content through this context instead of rendering
   a panel itself. `onClose` runs when the user dismisses the panel with its own close button, so the page can
   clear whatever selection opened it; `close()` called from the page does not run it. */

export interface InteriorPanelRequest {
  title: string;
  content: ReactNode;
  onClose?: () => void;
}

export interface ConfigurePanelApi {
  open: (request: InteriorPanelRequest) => void;
  close: () => void;
}

const NOOP: ConfigurePanelApi = { open: () => {}, close: () => {} };

export const ConfigurePanelContext = createContext<ConfigurePanelApi>(NOOP);

export const useConfigureInteriorPanel = () => useContext(ConfigurePanelContext);

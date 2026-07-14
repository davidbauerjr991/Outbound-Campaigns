import { CircleHelp, Bell } from "lucide-react";
import appIcon from "@/assets/app-icon.svg";
import {
  AppHeader,
  AppName,
  ActionIconButton,
  ProfileMenu,
  defaultProfileMenuGroups,
  DashboardIcon,
} from "@nicecxone/lyra-ui";

/**
 * App-level header — mirrors lyra-ux-templates/src/components/Header.tsx,
 * minus the multi-page AppMenu switcher (this is a single-page app, so
 * there's nothing else to navigate to).
 */
export function Header() {
  return (
    <AppHeader
      appName={
        <AppName
          icon={<img src={appIcon} alt="Outbound Engagement" className="h-6 w-6" />}
          name="Outbound Engagement"
        />
      }
      actions={
        <>
          <ActionIconButton size="xl" title="Help">
            <CircleHelp className="h-5 w-5" strokeWidth={1.5} />
          </ActionIconButton>
          <ActionIconButton size="xl" title="Dashboards">
            <DashboardIcon className="text-lyra-fg-default" />
          </ActionIconButton>
          <ActionIconButton size="xl" title="Notifications">
            <Bell className="h-5 w-5" strokeWidth={1.5} />
          </ActionIconButton>
          <ProfileMenu initials="JS" avatarColor="#5d6a79" groups={defaultProfileMenuGroups} showThemeToggle className="ml-1" />
        </>
      }
    />
  );
}

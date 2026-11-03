import { CircleHelp, Bell } from "lucide-react";
import appIcon from "@/assets/app-icon.svg";
import {
  AppHeader,
  ActionIconButton,
  ProfileMenu,
  defaultProfileMenuGroups,
  DashboardIcon,
} from "@nicecxone/lyra-ui";
import { WideAppNameMenu } from "@/components/WideAppNameMenu";
import { USER_TYPES, useUserType } from "@/lib/user-type";

/**
 * App-level header — mirrors lyra-ux-templates/src/components/Header.tsx.
 * The app name is a `WideAppNameMenu` (local `AppNameMenu` with a wider popover) whose items are user types; picking one
 * changes which Configure nav items are hidden (see `lib/user-type.tsx`).
 */
export function Header() {
  const { userType, setUserType } = useUserType();
  return (
    <AppHeader
      appName={
        <WideAppNameMenu
          groups={[
            {
              items: USER_TYPES.map((t) => ({
                label: t.label,
                active: t.key === userType.key,
                onClick: () => setUserType(t.key),
              })),
            },
          ]}
          icon={<img src={appIcon} alt="Outbound Engagement" className="h-6 w-6" />}
          name={userType.label}
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

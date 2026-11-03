import * as PopoverPrimitive from "@radix-ui/react-popover";
import { AppName, AppMenu, type AppNameProps, type AppMenuGroup } from "@nicecxone/lyra-ui";

/* Local copy of lyra-ui's `AppNameMenu` (same `AppName` trigger + `AppMenu`
   in a bottom-start popover) with a wider menu. `AppNameMenu` hardcodes
   `AppMenu`'s 320px width and exposes no way to change it, and the user-type
   labels are too long for that — so the wiring is repeated here with
   `AppMenu`'s own `className` override instead of restyling lyra-ui. */

// Same guard as lyra-ui's AppNameMenu / popover.tsx: keep pointer/focus events
// inside the portalled panel from reaching an outer hover-triggered wrapper.
const stopSyntheticBubble = (e: React.SyntheticEvent) => e.stopPropagation();

export interface WideAppNameMenuProps extends AppNameProps {
  groups: AppMenuGroup[];
  /** Tailwind width class for the menu (default `w-[440px]`) */
  menuWidthClassName?: string;
}

export function WideAppNameMenu({ groups, menuWidthClassName = "w-[440px]", ...appNameProps }: WideAppNameMenuProps) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <AppName {...appNameProps} />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side="bottom"
          align="start"
          sideOffset={6}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onPointerMove={stopSyntheticBubble}
          onPointerLeave={stopSyntheticBubble}
          onFocus={stopSyntheticBubble}
          onBlur={stopSyntheticBubble}
          className="z-[9999] animate-in fade-in-0 slide-in-from-top-2 duration-150 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-1 data-[state=closed]:duration-100"
        >
          <AppMenu groups={groups} className={menuWidthClassName} />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

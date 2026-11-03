import * as React from "react";
import { GripVertical } from "lucide-react";
import { Draggable, ContainerHeader, Tooltip, cn, type DraggableVariant } from "@nicecxone/lyra-ui";

/**
 * Local labeled, draggable/dockable panel shell. lyra-ui removed its own
 * `DraggablePanel` (it was a thin wrapper over `Draggable` + `ContainerHeader`
 * that no lyra-ui consumer used), so this app keeps the same composition
 * locally for "Online Help". Renders a "Nothing here yet." placeholder when
 * no `children` are passed.
 */
export interface DraggablePanelProps {
  title: string;
  children?: React.ReactNode;
  onClose?: () => void;
  defaultWidth?: number;
  maxWidth?: number;
  defaultHeight?: number;
  draggableVariant?: DraggableVariant;
  onVariantChange?: (variant: DraggableVariant) => void;
  onWidthChange?: (width: number) => void;
  onResizeStateChange?: (isResizing: boolean) => void;
  /** Called on any mousedown inside the panel — used for "bring to front" */
  onInteract?: () => void;
  className?: string;
}

const DraggablePanel = React.forwardRef<HTMLDivElement, DraggablePanelProps>(
  ({
    title, children, onClose,
    defaultWidth = 320, maxWidth, defaultHeight = 480,
    draggableVariant: draggableVariantProp = "float",
    onVariantChange, onWidthChange, onResizeStateChange, onInteract,
    className,
  }, ref) => {
    const [draggableVariant, setDraggableVariant] = React.useState<DraggableVariant>(draggableVariantProp);

    // Sync when parent forces a variant change (single-dock rule)
    React.useEffect(() => { setDraggableVariant(draggableVariantProp); }, [draggableVariantProp]);

    return (
      <Draggable
        ref={ref}
        variant={draggableVariant}
        defaultWidth={defaultWidth}
        defaultHeight={defaultHeight}
        minWidth={280}
        maxWidth={maxWidth}
        minHeight={200}
        onVariantChange={(v) => { setDraggableVariant(v); onVariantChange?.(v); }}
        onWidthChange={onWidthChange}
        onResizeStateChange={onResizeStateChange}
        onInteract={onInteract}
        className={cn(
          "rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-base",
          draggableVariant === "float" ? "shadow-lg" : "h-full",
          className
        )}
        renderHeaderControls={({ gripProps, dockButtonProps, dockIcon, variant }) => (
          <ContainerHeader
            title={title}
            icon={
              variant === "float"
                ? <div {...gripProps}><GripVertical className="h-4 w-4" strokeWidth={1.5} /></div>
                : undefined
            }
            actions={
              <Tooltip content={dockButtonProps["aria-label"]} placement="bottom" asLabel>
                <button
                  {...dockButtonProps}
                  className="flex h-8 w-8 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary hover:bg-lyra-state-hover hover:text-lyra-fg-default transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2"
                >
                  {dockIcon}
                </button>
              </Tooltip>
            }
            onClose={onClose}
            bordered
          />
        )}
      >
        <div className={cn(
          "overflow-y-auto flex-1 flex p-4",
          children ? "flex-col items-stretch" : "items-center justify-center"
        )}>
          {children ?? (
            <p className="lyra-body-md text-lyra-fg-disabled text-center">Nothing here yet.</p>
          )}
        </div>
      </Draggable>
    );
  }
);
DraggablePanel.displayName = "DraggablePanel";

export { DraggablePanel };

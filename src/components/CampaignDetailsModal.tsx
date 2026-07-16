import { useState, useEffect, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Play,
  Square,
  Maximize2,
  Minimize2,
  X,
  Pencil,
  Headset,
  ClipboardPen,
  CalendarDays,
} from "lucide-react";
import {
  Overlay,
  Container,
  ActionIconButton,
  TabList,
  Tab,
  TabPanel,
  Accordion,
  Checkbox,
  Button,
} from "@nicecxone/lyra-ui";
import type { CampaignRecord } from "./OutboundCampaignsPage";

/* ── Field — label-over-value display row. No dedicated lyra-ui component
   for a static key/value pair exists (this isn't a form input), so this
   composes the same typography tokens TableHead/labels already use
   (`lyra-label` for the caption, `lyra-body-md` for the value) rather than
   inventing new styling. ── */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="lyra-label text-lyra-fg-secondary">{label}</span>
      <div className="lyra-body-md text-lyra-fg-default flex items-center gap-2 min-h-[20px]">
        {children}
      </div>
    </div>
  );
}

const TABS = [
  "General",
  "Campaign Records",
  "Interactions",
  "State Breakdown",
  "Segmentation",
  "Results",
  "Change History",
] as const;
type TabKey = (typeof TABS)[number];

export function CampaignDetailsModal({
  record,
  onClose,
  onNavigatePrev,
  onNavigateNext,
}: {
  record: CampaignRecord | null;
  onClose: () => void;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("General");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRequeue, setIsRequeue] = useState(false);
  const [allowAppend, setAllowAppend] = useState(false);

  /* Keep showing the last-open record's content while Overlay/Radix plays
     its fade-out — `record` goes null immediately on close (the parent
     clears selection), but unmounting the content along with it would cut
     the close animation short. Overlay itself still gets the real
     `open={!!record}` so it animates correctly (see the real Overlay usage
     in agent-next-gen-v1's welcome modal — `open` is passed straight
     through, not gated on a separately-tracked "mounted" flag, because
     Radix's own Presence handling manages the unmount timing). */
  const [displayRecord, setDisplayRecord] = useState<CampaignRecord | null>(record);
  useEffect(() => {
    if (record) {
      setDisplayRecord(record);
      setActiveTab("General");
      setIsRequeue(false);
      setAllowAppend(false);
    }
  }, [record]);

  if (!displayRecord) {
    return <Overlay variant="dark" open={false} onClose={onClose} />;
  }

  const timestamp = "07/15/2026, 04:48:29";
  const campaignId = 320000000 + displayRecord.id * 7331;
  const dialingStrategy = 3000000 + displayRecord.id * 913;
  const amOptionLabel =
    displayRecord.amOption === "headset" ? "Transfer all Connections" : "Send to Voicemail";

  return (
    <Overlay variant="dark" open={!!record} onClose={onClose} closeOnBackdropClick>
      <Container
        key={displayRecord.id}
        variant="modal"
        headerTitle="Campaign details"
        headerSubhead={displayRecord.name}
        headerActions={
          <div className="flex items-center gap-0.5">
            <ActionIconButton title="Previous campaign" onClick={onNavigatePrev} disabled={!onNavigatePrev}>
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
            </ActionIconButton>
            <ActionIconButton title="Next campaign" onClick={onNavigateNext} disabled={!onNavigateNext}>
              <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
            </ActionIconButton>
            <div className="mx-1.5 h-5 w-px bg-lyra-border-subtle" />
            <ActionIconButton title="Campaign settings">
              <Settings className="h-4 w-4" strokeWidth={1.5} />
            </ActionIconButton>
            <ActionIconButton title="Start campaign">
              <Play className="h-4 w-4" strokeWidth={1.5} />
            </ActionIconButton>
            <ActionIconButton title="Stop campaign">
              <Square className="h-4 w-4" strokeWidth={1.5} />
            </ActionIconButton>
            <div className="mx-1.5 h-5 w-px bg-lyra-border-subtle" />
            <ActionIconButton
              title={isFullscreen ? "Restore" : "Fullscreen"}
              onClick={() => setIsFullscreen((v) => !v)}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <Maximize2 className="h-4 w-4" strokeWidth={1.5} />
              )}
            </ActionIconButton>
            <ActionIconButton title="Close" onClick={onClose}>
              <X className="h-5 w-5" strokeWidth={1.5} />
            </ActionIconButton>
          </div>
        }
        className={
          isFullscreen
            ? "flex flex-col transition-all duration-200 w-screen h-screen rounded-none"
            : "flex flex-col transition-all duration-200 w-[1400px] max-w-[calc(100vw-4rem)] h-[860px] max-h-[calc(100vh-4rem)] rounded-lyra-lg"
        }
      >
        {/* Uploaded / modified date row */}
        <div className="grid grid-cols-2 gap-6 px-5 pb-4 border-b border-lyra-border-subtle">
          <Field label="Uploaded Date">{timestamp}</Field>
          <Field label="Last Modified On">{timestamp}</Field>
        </div>

        <TabList className="px-5" overflowMenu>
          {TABS.map((tab) => (
            <Tab key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>
              {tab}
            </Tab>
          ))}
        </TabList>

        <div className="flex-1 overflow-y-auto min-h-0 bg-lyra-bg-surface-canvas">
          <TabPanel active={activeTab === "General"}>
            <Accordion
              defaultValue="general"
              items={[
                {
                  id: "general",
                  title: "General Information",
                  content: (
                    <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                      <div className="flex flex-col gap-5">
                        <Field label="Campaign ID">{campaignId}</Field>
                        <Field label="Name">{displayRecord.name}</Field>
                        <Field label="Campaign State">
                          <ActionIconButton
                            size="sm"
                            title="Edit campaign state"
                            className="text-lyra-status-warning-strong"
                          >
                            <Pencil className="h-4 w-4" strokeWidth={1.5} />
                          </ActionIconButton>
                        </Field>
                        <Field label="Type">{displayRecord.type}</Field>
                        <Field label="Service">
                          {displayRecord.serviceName} ({campaignId})
                        </Field>
                        <Field label="Voice">🇺🇸 Julie</Field>
                        <Field label="AM Option">
                          {displayRecord.amOption === "headset" ? (
                            <Headset className="h-4 w-4 text-lyra-fg-secondary" strokeWidth={1.5} />
                          ) : (
                            <ClipboardPen className="h-4 w-4 text-lyra-fg-secondary" strokeWidth={1.5} />
                          )}
                          {amOptionLabel}
                        </Field>
                        <Field label="Scrub">None</Field>
                        <Field label="Schedule">
                          <CalendarDays className="h-4 w-4 text-lyra-fg-secondary" strokeWidth={1.5} />
                          {displayRecord.schedule}
                        </Field>
                      </div>
                      <div className="flex flex-col gap-5">
                        <Field label="Dialing Profile (Current Service Value)">--</Field>
                        <Field label="Dialing Regime (Current Service Value)">(1000049)</Field>
                        <Field label="Dialing Sort (Current Service Value)">default</Field>
                        <Field label="Dialing Strategy">{dialingStrategy}</Field>
                        <Field label="Operator Phone">(628) 386-0829</Field>
                        <Field label="Caller ID">(650) 458-5753</Field>
                        <Field label="Callback Phone">(650) 458-5753</Field>
                        <Checkbox
                          label="Is Requeue"
                          checked={isRequeue}
                          onCheckedChange={(c) => setIsRequeue(!!c)}
                        />
                        <Checkbox
                          label="Allow Append"
                          checked={allowAppend}
                          onCheckedChange={(c) => setAllowAppend(!!c)}
                        />
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </TabPanel>

          {TABS.filter((t) => t !== "General").map((tab) => (
            <TabPanel key={tab} active={activeTab === tab} className="p-5">
              <p className="lyra-body-md text-lyra-fg-secondary">{tab} content goes here.</p>
            </TabPanel>
          ))}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex justify-end gap-2 px-5 py-4 border-t border-lyra-border-subtle">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline">Requeue</Button>
          <Button disabled>Save</Button>
        </div>
      </Container>
    </Overlay>
  );
}

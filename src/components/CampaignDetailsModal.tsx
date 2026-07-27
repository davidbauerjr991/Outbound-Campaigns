import { useState, useEffect, Fragment, type ReactNode } from "react";
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
  Modal,
  ActionIconButton,
  TabList,
  Tab,
  TabPanel,
  Accordion,
  Checkbox,
  Button,
  Label,
} from "@nicecxone/lyra-ui";
import type { CampaignRecord } from "./OutboundCampaignsPage";

/* ── Field — label-over-value display row, for values that aren't a plain
   string (an icon + text, or an action button). Kept only for those cases;
   plain string/number fields below use `LabelField` instead.
   Was a hand-rolled `<span className="lyra-label text-lyra-fg-secondary">`
   for the caption — wrong, that's the same muted gray `Label` itself only
   applies in its `readonly` state, and these aren't locked/readonly
   controls (an edit button, an icon + text row). Use the real `Label`
   component instead so the caption renders at its correct default
   `lyra-label text-lyra-fg-default` — see lyra-ui's Input stories, "Label
   With Buttons" (input.stories.tsx), which documents this exact
   label-plus-arbitrary-content composition. ── */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0">
      <Label label={label} />
      <div className="lyra-body-md text-lyra-fg-default flex items-center gap-0.5 min-h-[20px]">
        {children}
      </div>
    </div>
  );
}

/* ── LabelField — plain string/number label-value pairs use the real
   `Label` component's `supportingText` (a value line rendered below the
   caption, label.tsx) instead of the hand-rolled `Field` markup above. No
   input control is rendered.
   Was passing `readonly` here — that's wrong: `readonly` is meant for a
   label paired with an actual read-only *input* (still an editable-looking
   control, just locked), and it mutes the caption to
   `text-lyra-fg-secondary` to signal that. These aren't inputs at all, so
   the caption should render exactly like any other field label —
   `text-lyra-fg-default`, the same as every `Input`/`Select` label in
   `FormTemplate` — with the value underneath staying secondary via
   `supportingText`'s own styling (that part was already correct). ── */
function LabelField({ label, value }: { label: string; value: string | number }) {
  return <Label label={label} supportingText={String(value)} />;
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
    return <Modal open={false} onClose={onClose} />;
  }

  const timestamp = "07/15/2026, 04:48:29";
  const campaignId = 320000000 + displayRecord.id * 7331;
  const dialingStrategy = 3000000 + displayRecord.id * 913;
  const amOptionLabel =
    displayRecord.amOption === "headset" ? "Transfer all Connections" : "Send to Voicemail";

  return (
    <Modal
      open={!!record}
      onClose={onClose}
      closeOnBackdropClick
      headerTitle="Campaign Details"
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
      {/* Keyed by record id — remounts the body on prev/next navigation so
          uncontrolled state (Accordion's `defaultValue`) resets per record,
          while `Modal` itself (the Radix Dialog root/portal/overlay) stays
          mounted throughout so its open/close fade animation still plays
          correctly, same as the old `Overlay` (persistent) + `Container`
          (keyed) split. */}
      <Fragment key={displayRecord.id}>
        {/* Uploaded / modified date row — these are plain display values,
            not editable-looking controls, so use `LabelField` (real `Label`
            + `supportingText`, same as every other read-only field in this
            modal) instead of `Input`'s `readonly` state, which implies an
            actual (locked) input box. */}
        <div className="grid grid-cols-2 gap-6 px-5 pb-4 border-b border-lyra-border-subtle">
          <LabelField label="Uploaded Date" value={timestamp} />
          <LabelField label="Last Modified On" value={timestamp} />
        </div>

        <TabList className="px-5" overflowMenu>
          {TABS.map((tab) => (
            <Tab key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>
              {tab}
            </Tab>
          ))}
        </TabList>

        <div className="flex-1 overflow-y-auto min-h-0 bg-lyra-bg-surface-canvas">
          <TabPanel active={activeTab === "General"} className="p-5">
            {/* `max-w-[1000px] mx-auto` sits on the Accordion itself (its
                root is `w-full`, accordion.tsx), not just the content div
                inside — matching lyra-ui's `FormTemplate`'s own new
                "Placement" Accordion example (form-template.tsx), where the
                whole accordion — header row included — is capped/centered
                at the form's 1000px width. Capping only the inner content
                left the header spanning the full tab width, misaligned
                with the fields underneath it. */}
            <Accordion
              className="max-w-[1000px] mx-auto"
              defaultValue="general"
              items={[
                {
                  id: "general",
                  // lyra-heading-md — plain string titles render at
                  // `lyra-body-md` (accordion.tsx's default), which is too
                  // light for a section header; wrap in the same heading
                  // token dashboard-queue.tsx uses for its own Accordion
                  // titles (there, explicitly matched to DashboardCard's
                  // header weight) so this reads as a real header.
                  title: <span className="lyra-heading-md">General Information</span>,
                  content: (
                    <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                      <div className="flex flex-col gap-5">
                        <LabelField label="Campaign ID" value={campaignId} />
                        <LabelField label="Name" value={displayRecord.name} />
                        <Field label="Campaign State">
                          <ActionIconButton
                            size="sm"
                            title="Edit campaign state"
                            className="text-lyra-status-warning-strong"
                          >
                            <Pencil className="h-4 w-4" strokeWidth={1.5} />
                          </ActionIconButton>
                        </Field>
                        <LabelField label="Type" value={displayRecord.type} />
                        <LabelField
                          label="Service"
                          value={`${displayRecord.serviceName} (${campaignId})`}
                        />
                        <LabelField label="Voice" value="🇺🇸 Julie" />
                        <Field label="AM Option">
                          {displayRecord.amOption === "headset" ? (
                            <Headset className="h-4 w-4 text-lyra-fg-secondary" strokeWidth={1.5} />
                          ) : (
                            <ClipboardPen className="h-4 w-4 text-lyra-fg-secondary" strokeWidth={1.5} />
                          )}
                          {amOptionLabel}
                        </Field>
                        <LabelField label="Scrub" value="None" />
                        <Field label="Schedule">
                          <CalendarDays className="h-4 w-4 text-lyra-fg-secondary" strokeWidth={1.5} />
                          {displayRecord.schedule}
                        </Field>
                      </div>
                      <div className="flex flex-col gap-5">
                        <LabelField label="Dialing Profile (Current Service Value)" value="--" />
                        <LabelField label="Dialing Regime (Current Service Value)" value="(1000049)" />
                        <LabelField label="Dialing Sort (Current Service Value)" value="default" />
                        <LabelField label="Dialing Strategy" value={dialingStrategy} />
                        <LabelField label="Operator Phone" value="(628) 386-0829" />
                        <LabelField label="Caller ID" value="(650) 458-5753" />
                        <LabelField label="Callback Phone" value="(650) 458-5753" />
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
      </Fragment>
    </Modal>
  );
}

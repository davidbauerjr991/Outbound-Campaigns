import { useEffect, useState } from "react";
import { FilePen, Pencil, RefreshCw, Trash2 } from "lucide-react";
import {
  AdminShell,
  AiIcon,
  Button,
  Checkbox,
  DashboardCard,
  DashboardTemplate,
  DateRangeFilterChip,
  FilterChip,
  InteriorPanel,
  Tag,
  type DateRangeFilterValue,
  type MenuEntry,
  type TreeMenuItem,
} from "@nicecxone/lyra-ui";
import { useTreeOpenState, withRememberedOpen } from "../lib/tree-open-state";
import { ContactWindowsCard } from "./ContactWindowsCard";
import { EffectivenessCard } from "./EffectivenessCard";
import {
  CAMPAIGN_OPTIONS,
  EFFECTIVENESS_RANGE_OPTIONS,
  SEGMENT_OPTIONS,
  bestWindowsByChannel,
  campaignOptionsFor,
  scopePairs,
  segmentOptionsFor,
  type EffectivenessRange,
} from "../data/contact-timing-data";

/* ── Review area — opens from the LeftNav "Review" icon (App.tsx), reachable
   at `/review`. A Lyra rebuild of the legacy reporting page's left tree
   (Inbound / Campaign / Call / Agent / Billing Reports, plus an expanded
   "Analytics" group) with "Contact Timing" added to the Analytics reports in alphabetical order.

   Only Contact Timing has a page; every other report row is an inert
   placeholder so the tree reads like the real one. Report names are copied
   from the legacy reference screenshots as-is (including their original
   capitalization, e.g. "SMS Volume report"). Only Analytics starts expanded
   so the selected Contact Timing row is visible on load.

   Same two widgets as the Monitor tab, but not driven by a scope tree, and
   each card carries its own date filter in its header. */

const REPORT_ICON = <FilePen className="h-4 w-4 text-lyra-fg-active-strong" strokeWidth={1.5} />;

const reports = (labels: string[]) => labels.map((label) => ({ label, icon: REPORT_ICON }));

const REVIEW_NAV_ITEMS: TreeMenuItem[] = [
  { label: "Inbound Reports", children: reports(["Inbound Efficiency Report", "Inbound Phone Volume Report"]) },
  {
    label: "Campaign Reports",
    children: reports([
      "Contact Lookup Report",
      "Call Statistics Report",
      "Campaign Line Summary Report",
      "Email Campaign Summary Report",
      "Phone Lookup Report",
      "Real Time Reports (RTR)",
      "Service Efficiency Report",
      "SMS Volume report",
      "Email Volume report",
    ]),
  },
  { label: "Call Reports", children: reports(["Call Detail Report (CDR)", "Failed Operator Report"]) },
  {
    label: "Agent Reports",
    children: reports([
      "Agent Activity Report",
      "Agent Summary Report",
      "Agent Skill Report",
      "Agent Team Summary Report",
      "Call Monitoring Report",
      "Call Recording Report",
      "Call Transfer Report",
      "Clicker Efficiency Report",
      "Recording Events Report",
      "Voicemail Recording Report",
    ]),
  },
  { label: "Billing Reports", children: reports(["Estimated Billing Duration Report"]) },
  {
    label: "Analytics",
    defaultOpen: true,
    children: [
      { label: "Analytics Dashboard", icon: REPORT_ICON },
      { label: "Contact Timing", icon: REPORT_ICON, active: true },
      { label: "Hourly Analytics", icon: REPORT_ICON },
      { label: "Operator Transfer Analytics", icon: REPORT_ICON },
      { label: "Penetration Detail Analytics", icon: REPORT_ICON },
      { label: "Penetration Summary Analytics", icon: REPORT_ICON },
      { label: "Service Comparison Analytics", icon: REPORT_ICON },
    ],
  },
];

const WIDGET_TITLES = {
  windows: "Suggested Contact Windows",
  effectiveness: "How Well Are The Suggestions Working?",
} as const;

type PanelState = { kind: "edit"; title: string } | { kind: "reco"; channel: string };

/** "All", the one selected label, or "N Selected". */
function selectionText(values: string[], options: { value: string; label: string }[]) {
  if (values.length === 0) return "All";
  if (values.length === 1) return options.find((o) => o.value === values[0])?.label ?? "1 Selected";
  return `${values.length} Selected`;
}

export function ReviewPage({
  onAskAiToggle,
  scopeRequest,
}: {
  onAskAiToggle?: () => void;
  /** An answer in the Ask AI panel can set the page's scope; `nonce` re-applies a repeat request. */
  scopeRequest?: { kind: "segments" | "campaigns"; values: string[]; nonce: number } | null;
}) {
  useTreeOpenState();
  // Quick filters — one set for the whole page, left-aligned above the cards.
  const [range, setRange] = useState<EffectivenessRange>("last30");
  const [campaigns, setCampaigns] = useState<string[]>([]);
  const [segments, setSegments] = useState<string[]>([]);
  const filters = { campaigns, segments };
  // Segments and campaigns are many-to-many, so each filter narrows the other's options,
  // and a selection that no longer fits is dropped rather than left showing an empty combination.
  const campaignOptions = campaignOptionsFor(segments);
  const segmentOptions = segmentOptionsFor(campaigns);
  const pairs = scopePairs(campaigns, segments);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [mountedAt] = useState(() => Date.now());
  useEffect(() => {
    // Ignore a request made before this page mounted (e.g. left over from an earlier visit).
    if (!scopeRequest || scopeRequest.nonce < mountedAt) return;
    if (scopeRequest.kind === "segments") {
      setCampaigns([]);
      setSegments(scopeRequest.values);
    } else {
      setSegments([]);
      setCampaigns(scopeRequest.values);
    }
    setSkipped([]);
  }, [scopeRequest, mountedAt]);
  const chosenPairs = pairs.filter((p) => !skipped.includes(p.key));
  const changeCampaigns = (next: string[]) => {
    setCampaigns(next);
    const valid = segmentOptionsFor(next).map((o) => o.value);
    setSegments((prev) => prev.filter((v) => valid.includes(v)));
    setSkipped([]);
  };
  const changeSegments = (next: string[]) => {
    setSegments(next);
    const valid = campaignOptionsFor(next).map((o) => o.value);
    setCampaigns((prev) => prev.filter((v) => valid.includes(v)));
    setSkipped([]);
  };
  const rangeLabel = EFFECTIVENESS_RANGE_OPTIONS.find((o) => o.value === range)?.label ?? "";
  const scopeLabel = `Segment: ${selectionText(segments, SEGMENT_OPTIONS)} · Campaign: ${selectionText(campaigns, CAMPAIGN_OPTIONS)}`;

  // One side panel serves two jobs: a widget's Edit action and a recommendation's detail.
  const [panelOpen, setPanelOpen] = useState(false);
  const [panel, setPanel] = useState<PanelState | null>(null);
  const [applied, setApplied] = useState<string[]>([]);
  const openPanel = (next: PanelState) => {
    setPanel(next);
    if (next.kind === "reco") setSkipped([]);
    setPanelOpen(true);
  };
  const kebabItems = (title: string): MenuEntry[] => [
    { id: "edit", label: "Edit", icon: <Pencil className="h-4 w-4" strokeWidth={1.5} />, onClick: () => openPanel({ kind: "edit", title }) },
    { id: "refresh", label: "Refresh", icon: <RefreshCw className="h-4 w-4" strokeWidth={1.5} /> },
    { id: "remove", label: "Remove", icon: <Trash2 className="h-4 w-4" strokeWidth={1.5} /> },
  ];

  const recommendations = bestWindowsByChannel(range, filters);
  const activeReco = panel?.kind === "reco" ? recommendations.find((r) => r.channel === panel.channel) : undefined;
  const panelTitle = panel?.kind === "edit" ? panel.title : activeReco ? `Update ${activeReco.channel} Contact Timing` : undefined;

  return (
    <AdminShell
      storageKeyPrefix="lyra_review"
      navTitle="Review"
      navItems={withRememberedOpen("review", REVIEW_NAV_ITEMS)}
      defaultLeftPinned
      showPageHeader
      pageTitle="Contact Timing"
      pageSubtitle="Analytics"
      pageActions={
        onAskAiToggle ? (
          <Button variant="outline" onClick={onAskAiToggle}>
            <AiIcon className="h-4 w-4" />
            Ask AI
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto">
          <DashboardTemplate maxWidth="none" className="flex flex-col">
            {/* Quick filters, left-aligned. They drive the recommendations and both widgets. */}
            <div className="flex flex-wrap items-center gap-2 px-4 pt-4">
              <DateRangeFilterChip
                value={range}
                onValueChange={(v: DateRangeFilterValue) => setRange(v as EffectivenessRange)}
                options={EFFECTIVENESS_RANGE_OPTIONS}
              />
              <FilterChip
                label="Campaign"
                options={campaignOptions}
                selectedValues={campaigns}
                onSelectionChange={changeCampaigns}
                dropdownAlign="left"
              />
              <FilterChip
                label="Segment"
                options={segmentOptions}
                selectedValues={segments}
                onSelectionChange={changeSegments}
                dropdownAlign="left"
              />
            </div>

            <div className="flex flex-col gap-4 p-4">
              {/* Recommendations: one actionable card per channel. Click opens the side panel. */}
              <div className="lyra-container-grid-wrap">
                <div className="lyra-container-grid">
                  {recommendations.map((r) => {
                    const isApplied = applied.includes(r.channel);
                    const isOpen = panelOpen && panel?.kind === "reco" && panel.channel === r.channel;
                    return (
                      <DashboardCard
                        key={r.channel}
                        headerTitle={`Update ${r.channel} Contact Timing`}
                        headerTopSlot={isApplied ? <Tag label="Applied" variant="success" /> : undefined}
                        metrics={[{ value: `+${r.lift} Pts`, label: `${r.metric} · ${r.day} ${r.start}` }]}
                        variant={isOpen ? "info-strong" : "neutral-subtle"}
                        onClick={() => openPanel({ kind: "reco", channel: r.channel })}
                        role="button"
                        aria-pressed={isOpen}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openPanel({ kind: "reco", channel: r.channel });
                          }
                        }}
                        className="cursor-pointer"
                      />
                    );
                  })}
                </div>
              </div>

              <div className="lyra-container-grid-wrap">
                <div className="lyra-container-grid">
                  <ContactWindowsCard
                    range={range}
                    filters={filters}
                    scopeLabel={scopeLabel}
                    kebabMenuItems={kebabItems(WIDGET_TITLES.windows)}
                  />
                  <EffectivenessCard
                    range={range}
                    filters={filters}
                    scopeLabel={scopeLabel}
                    kebabMenuItems={kebabItems(WIDGET_TITLES.effectiveness)}
                  />
                </div>
              </div>
            </div>
          </DashboardTemplate>
        </div>
        </div>

        <InteriorPanel side="right" open={panelOpen} onClose={() => setPanelOpen(false)} headerTitle={panelTitle}>
          {activeReco ? (
            <div className="flex flex-col gap-4 p-4">
              <p className="lyra-body-md text-lyra-fg-default">
                Contact {activeReco.channel} customers on{" "}
                <span className="lyra-body-md-emphasis">
                  {activeReco.day}, {activeReco.start} – {activeReco.end}
                </span>
                .
              </p>
              <p className="lyra-body-sm text-lyra-fg-secondary">
                Expected improvement: <span className="lyra-body-sm-emphasis text-lyra-fg-default">+{activeReco.lift} Pts {activeReco.metric}</span>, the
                gap between contacts placed inside and outside the recommended windows ({rangeLabel}). Confidence {activeReco.confidence}, based on{" "}
                {activeReco.interactions.toLocaleString()} historical interactions.
              </p>
              <div className="flex flex-col gap-2">
                <p className="lyra-label text-lyra-fg-default">Applies To</p>
                <p className="lyra-body-sm text-lyra-fg-secondary">
                  Segments can be used by several campaigns, so this is set per campaign and segment pairing. Uncheck any pairing you want to leave as it is.
                </p>
                <div className="flex max-h-[260px] flex-col gap-2 overflow-y-auto">
                  {pairs.map((p) => (
                    <Checkbox
                      key={p.key}
                      label={`${p.campaign} › ${p.segment}`}
                      checked={!skipped.includes(p.key)}
                      onCheckedChange={(checked) =>
                        setSkipped((prev) => (checked ? prev.filter((k) => k !== p.key) : [...prev, p.key]))
                      }
                    />
                  ))}
                </div>
              </div>
              <Button
                disabled={applied.includes(activeReco.channel) || chosenPairs.length === 0}
                onClick={() => setApplied((prev) => [...prev, activeReco.channel])}
              >
                {applied.includes(activeReco.channel)
                  ? "Applied"
                  : `Update ${activeReco.channel} Contact Timing (${chosenPairs.length} ${chosenPairs.length === 1 ? "Pairing" : "Pairings"})`}
              </Button>
            </div>
          ) : (
            <p className="lyra-body-sm text-lyra-fg-secondary p-4">
              Details for <span className="text-lyra-fg-default lyra-body-sm-emphasis">{panelTitle}</span> go here.
            </p>
          )}
        </InteriorPanel>
      </div>
    </AdminShell>
  );
}

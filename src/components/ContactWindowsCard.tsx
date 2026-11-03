import { useState } from "react";
import { CalendarClock, Download, Sparkles } from "lucide-react";
import { ActionIconButton, Container, DashboardCard, Icon, Tag, ToggleGroup } from "@nicecxone/lyra-ui";
import type { MenuEntry } from "@nicecxone/lyra-ui";
// HeatmapChart is a real lyra-ui component (Storybook: Custom Primitives/Chart)
// that isn't exported from lyra-ui's public index.ts yet — hence the deep alias.
import { HeatmapChart } from "@nicecxone/lyra-ui/heatmap-chart";
import { CHANNELS_BOTTOM_UP, DAYS, HOURS, heatmapDataForDay, topWindowFor, EFFECTIVENESS_RANGE_OPTIONS, type ContactFilters, type Day, type EffectivenessRange } from "../data/contact-timing-data";

const DAY_ITEMS = DAYS.map((d) => ({ value: d, label: d }));

/** Widget A — suggested contact windows by channel and hour. `range` comes from the page toolbar's date filter. `filters` (campaign/segment) and `scopeLabel` are only passed by the Review page. */
export function ContactWindowsCard({ range, kebabMenuItems, filters, scopeLabel = "Scope: East Region Sales" }: { range: EffectivenessRange; kebabMenuItems: MenuEntry[]; filters?: ContactFilters; scopeLabel?: string }) {
  const [day, setDay] = useState<Day>("Tue");
  const data = heatmapDataForDay(day, range, filters);
  const top = topWindowFor(data, range);
  const rangeLabel = EFFECTIVENESS_RANGE_OPTIONS.find((o) => o.value === range)?.label ?? "";

  return (
    <DashboardCard
      variant="neutral-subtle"
      headerTopSlot={<Tag label={scopeLabel} variant="neutral" />}
      headerTitle="Suggested Contact Windows"
      headerSubhead="Heatmap intensity reflects model confidence. Stronger color = stronger recommendation."
      showKebabMenu
      kebabMenuItems={kebabMenuItems}
      headerIcon={<Icon icon={CalendarClock} size="md" background="active" shape="rounded" decorative />}
      headerActions={
        <ActionIconButton title="Download">
          <Download className="h-5 w-5" strokeWidth={1.5} />
        </ActionIconButton>
      }
    >
      <div className="flex min-w-0 flex-col gap-4 px-4 pb-4">
        <Container variant="info-subtle" className="flex items-start gap-3 p-4">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-lyra-fg-active-strong" strokeWidth={1.5} />
          <p className="lyra-body-md text-lyra-fg-secondary">
            <span className="lyra-body-md-emphasis text-lyra-fg-default">Top Window ({rangeLabel}, {day}):</span>{" "}
            {top.channel} {top.start} – {top.end} · confidence {top.confidence} · based on{" "}
            {top.interactions.toLocaleString()} historical interactions in this segment
          </p>
        </Container>
        <ToggleGroup
          type="single"
          fullWidth
          items={DAY_ITEMS}
          value={day}
          onValueChange={(v) => v && setDay(v as Day)}
        />
        <div className="h-[300px] w-full">
          <HeatmapChart
            xCategories={HOURS}
            yCategories={[...CHANNELS_BOTTOM_UP]}
            data={data}
            valueLabel="confidence"
          />
        </div>
      </div>
    </DashboardCard>
  );
}

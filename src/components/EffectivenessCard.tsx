import { TrendingUp, Target } from "lucide-react";
import { BarChart, Container, DashboardCard, Icon, Metric, Tag } from "@nicecxone/lyra-ui";
import type { MenuEntry } from "@nicecxone/lyra-ui";
import { EFFECTIVENESS_RANGE_OPTIONS, effectivenessForRange, type ContactFilters, type EffectivenessRange } from "../data/contact-timing-data";

/** Widget B — how well the suggested windows are working. `range` comes from the page toolbar's date filter. `filters` (campaign/segment) and `scopeLabel` are only passed by the Review page. */
export function EffectivenessCard({ range, kebabMenuItems, filters, scopeLabel = "Scope: East Region Sales" }: { range: EffectivenessRange; kebabMenuItems: MenuEntry[]; filters?: ContactFilters; scopeLabel?: string }) {
  const { rows, accuracy } = effectivenessForRange(range, filters);
  const rangeLabel = EFFECTIVENESS_RANGE_OPTIONS.find((o) => o.value === range)?.label ?? "";

  return (
    <DashboardCard
      variant="neutral-subtle"
      headerTopSlot={<Tag label={scopeLabel} variant="neutral" />}
      headerTitle="How Well Are The Suggestions Working?"
      headerSubhead={`Outcomes for contacts placed inside vs. outside the recommended windows. ${rangeLabel}.`}
      showKebabMenu
      kebabMenuItems={kebabMenuItems}
      headerIcon={<Icon icon={Target} size="md" background="info" shape="rounded" decorative />}
    >
      <div className="flex min-w-0 flex-col gap-6 px-4 pb-4">
        <Container variant="info-subtle" className="flex items-start gap-3 p-4">
          <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-lyra-fg-active-strong" strokeWidth={1.5} />
          <p className="lyra-body-md text-lyra-fg-secondary">
            <span className="lyra-body-md-emphasis text-lyra-fg-default">Recommendation Accuracy: {accuracy}%</span> ·
            campaigns aligned with AI windows outperformed baseline on all three channels this period.
          </p>
        </Container>
        <div className="flex flex-row flex-wrap gap-3">
          {rows.map((row) => (
            <Container key={row.channel} variant="neutral-subtle" className="flex min-w-[160px] flex-1 flex-col gap-2 p-4">
              <Metric
                className="flex-none"
                metric={{ value: `${row.inWindow}%`, label: `${row.channel} ${row.metric} (In Window)` }}
              />
              <Tag
                variant="success"
                icon={<TrendingUp className="h-3 w-3" strokeWidth={1.5} />}
                label={`${row.inWindow - row.outside} Pts vs. Outside`}
              />
            </Container>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="lyra-body-md-emphasis text-lyra-fg-default">Inside vs. Outside Recommended Windows</h3>
          <p className="lyra-body-sm text-lyra-fg-secondary">
            Lift shows performance gain attributable to following the recommendation.
          </p>
          <div className="h-[260px] w-full">
            <BarChart
              orientation="horizontal"
              showLegend
              valueAxisLabel="Rate (%)"
              categories={rows.map((r) => r.channel)}
              series={[
                { label: "In Window", data: rows.map((r) => r.inWindow), colorVar: "var(--lyra-color-accent-teal-strong)" },
                { label: "Outside", data: rows.map((r) => r.outside), colorVar: "var(--lyra-color-accent-slate-strong)" },
              ]}
            />
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

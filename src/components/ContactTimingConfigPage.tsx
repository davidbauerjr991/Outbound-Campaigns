import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { ActionIconButton, Button, Checkbox, Input, Select, Tab, TabList, TabPanel } from "@nicecxone/lyra-ui";

/* Configure > Channels > Contact Timing. Renders content only; ConfigureLayout supplies the shell, nav and the
   "Add Contact Timing" header button. Data is local prototype state: Copy and Delete change the list, Save and
   the refresh icon only commit / discard the draft. */

type WindowKey = "weekdayMorning" | "weekdayEvening" | "saturdayMorning" | "saturdayEvening" | "sundayMorning" | "sundayEvening";

interface ContactTimingProfile {
  id: string;
  name: string;
  restrict: boolean;
  windows: Record<WindowKey, string>;
  createdBy: string;
  modifiedBy: string;
  modified: string;
}

const OFF = "00:00 - 00:00";
const WINDOW_OPTIONS = [OFF, "08:00 - 09:00", "08:00 - 10:00", "09:00 - 12:00", "10:00 - 12:00", "12:00 - 17:00", "13:00 - 21:00", "17:00 - 18:00", "17:00 - 20:00", "18:00 - 21:00"].map((v) => ({ value: v, label: v }));

const SEED: ContactTimingProfile[] = [
  { id: "1004184", name: "Ray", restrict: false, createdBy: "David Bauer - 4 days ago", modifiedBy: "David Bauer - 4 days ago", modified: "4 days ago",
    windows: { weekdayMorning: "08:00 - 10:00", weekdayEvening: "13:00 - 21:00", saturdayMorning: "08:00 - 09:00", saturdayEvening: OFF, sundayMorning: OFF, sundayEvening: "17:00 - 18:00" } },
  { id: "1004185", name: "Standard Business Hours", restrict: true, createdBy: "David Bauer - 2 weeks ago", modifiedBy: "David Bauer - 1 week ago", modified: "1 week ago",
    windows: { weekdayMorning: "09:00 - 12:00", weekdayEvening: "12:00 - 17:00", saturdayMorning: OFF, saturdayEvening: OFF, sundayMorning: OFF, sundayEvening: OFF } },
  { id: "1004186", name: "Evenings Only", restrict: false, createdBy: "David Bauer - 3 weeks ago", modifiedBy: "David Bauer - 3 weeks ago", modified: "3 weeks ago",
    windows: { weekdayMorning: OFF, weekdayEvening: "17:00 - 20:00", saturdayMorning: OFF, saturdayEvening: "17:00 - 20:00", sundayMorning: OFF, sundayEvening: OFF } },
];

const DAYS: { title: string; morning: WindowKey; evening: WindowKey }[] = [
  { title: "Weekday", morning: "weekdayMorning", evening: "weekdayEvening" },
  { title: "Saturday", morning: "saturdayMorning", evening: "saturdayEvening" },
  { title: "Sunday", morning: "sundayMorning", evening: "sundayEvening" },
];

const HISTORY = [
  { when: "4 days ago", who: "David Bauer", what: "Changed Weekday Evening from 12:00 - 17:00 to 13:00 - 21:00" },
  { when: "4 days ago", who: "David Bauer", what: "Changed Sunday Evening from 00:00 - 00:00 to 17:00 - 18:00" },
  { when: "4 days ago", who: "David Bauer", what: "Created" },
];

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="lyra-body-sm font-medium uppercase text-lyra-fg-primary">{label}</div>
      <div className="lyra-body-md text-lyra-fg-primary">{value}</div>
    </div>
  );
}

export function ContactTimingConfigPage() {
  const [profiles, setProfiles] = useState(SEED);
  const [selectedId, setSelectedId] = useState(SEED[0].id);
  const saved = profiles.find((p) => p.id === selectedId) ?? profiles[0];
  const [draft, setDraft] = useState<ContactTimingProfile>(saved);
  const [tab, setTab] = useState<"General" | "Change History">("General");

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);
  const options = profiles.map((p) => ({ value: p.id, label: p.name }));

  const select = (id: string) => {
    const next = profiles.find((p) => p.id === id);
    if (!next) return;
    setSelectedId(id);
    setDraft(next);
  };
  const save = () => setProfiles((all) => all.map((p) => (p.id === draft.id ? { ...draft, modified: "just now", modifiedBy: "David Bauer - just now" } : p)));
  const copy = () => {
    const clone = { ...draft, id: String(Date.now()).slice(-7), name: `${draft.name} (Copy)`, createdBy: "David Bauer - just now", modifiedBy: "David Bauer - just now", modified: "just now" };
    setProfiles((all) => [...all, clone]);
    setSelectedId(clone.id);
    setDraft(clone);
  };
  const remove = () => {
    if (profiles.length < 2) return;
    const rest = profiles.filter((p) => p.id !== draft.id);
    setProfiles(rest);
    setSelectedId(rest[0].id);
    setDraft(rest[0]);
  };

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-start justify-between gap-4 px-5 pt-5">
        <div className="w-[340px] max-w-full">
          <Select label="Select Contact Timing" options={options} value={selectedId} onValueChange={select} />
        </div>
        <div className="flex items-center gap-2">
          <ActionIconButton title="Discard changes" onClick={() => setDraft(saved)}>
            <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
          </ActionIconButton>
          <Button variant="outline" onClick={copy}>Copy</Button>
          <Button variant="outline" onClick={remove} disabled={profiles.length < 2}>Delete</Button>
          <Button onClick={save} disabled={!dirty}>Save</Button>
        </div>
      </div>

      <TabList className="px-5" aria-label="Contact timing sections">
        {(["General", "Change History"] as const).map((t) => (
          <Tab key={t} active={tab === t} onClick={() => setTab(t)}>{t}</Tab>
        ))}
      </TabList>

      <TabPanel active={tab === "General"} className="flex flex-col gap-4 p-5">
        <div className="flex items-end gap-6">
          <div className="min-w-0 flex-1 max-w-[640px]">
            <Input label="Name" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <Meta label="ID" value={draft.id} />
        </div>

        <Checkbox label="Restrict" checked={draft.restrict} onCheckedChange={(v) => setDraft({ ...draft, restrict: v === true })} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {DAYS.map((day) => (
            <div key={day.title} className="flex flex-col gap-3 rounded-lg border border-lyra-border-subtle bg-lyra-bg-surface-container-subtle p-4">
              <Select label={`${day.title} Morning`} options={WINDOW_OPTIONS} value={draft.windows[day.morning]} onValueChange={(v) => setDraft({ ...draft, windows: { ...draft.windows, [day.morning]: v } })} />
              <Select label={`${day.title} Evening`} options={WINDOW_OPTIONS} value={draft.windows[day.evening]} onValueChange={(v) => setDraft({ ...draft, windows: { ...draft.windows, [day.evening]: v } })} />
            </div>
          ))}
        </div>
        <p className="lyra-body-sm font-semibold text-lyra-fg-primary">Times are Eastern Time (GMT-04:00)</p>

        <div className="grid grid-cols-2 gap-6">
          <Meta label="Created By" value={draft.createdBy} />
          <Meta label="Last Modified By" value={draft.modifiedBy} />
        </div>
      </TabPanel>

      <TabPanel active={tab === "Change History"} className="p-5">
        <table className="w-full text-left lyra-body-md text-lyra-fg-primary">
          <thead>
            <tr className="border-b border-lyra-border-subtle lyra-body-sm uppercase">
              <th className="py-2 pr-4 font-medium">When</th>
              <th className="py-2 pr-4 font-medium">User</th>
              <th className="py-2 font-medium">Change</th>
            </tr>
          </thead>
          <tbody>
            {HISTORY.map((h, i) => (
              <tr key={i} className="border-b border-lyra-border-subtle">
                <td className="py-2 pr-4">{h.when}</td>
                <td className="py-2 pr-4">{h.who}</td>
                <td className="py-2">{h.what}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TabPanel>
    </div>
  );
}

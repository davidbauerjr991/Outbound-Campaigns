import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { ActionIconButton, Button, Input, Select, Tab, TabList, TabPanel } from "@nicecxone/lyra-ui";
import { ProfilePolicyMap, type PolicyRule, type StatePolicies } from "./ProfilePolicyMap";

/* Configure > Channels > Profiles. Same structure as ContactTimingConfigPage: content only (ConfigureLayout supplies the
   shell, nav and the "Add Profile" header button), local prototype state. General is built; the other tabs are
   placeholders until their designs arrive. */

interface Profile {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  modifiedBy: string;
}

const SEED: Profile[] = [
  { id: "1016445", name: "GS_U15test", description: "", createdBy: "Glenn Schwartz - 03/29/2021 14:58:57", modifiedBy: "David Bauer - 4 minutes ago" },
  { id: "1016446", name: "Collections - East", description: "East coast collections outreach", createdBy: "David Bauer - 03/02/2022 09:12:40", modifiedBy: "David Bauer - 2 weeks ago" },
  { id: "1016447", name: "Reminders - Appointments", description: "Appointment reminder calls and texts", createdBy: "David Bauer - 06/18/2023 16:30:05", modifiedBy: "David Bauer - 3 weeks ago" },
  { id: "1016448", name: "ProdMan Restricted Testing", description: "Restricted calling policy test", createdBy: "David Bauer - 08/11/2024 10:05:12", modifiedBy: "David Bauer - 1 day ago" },
];

/* Contact-policy map data per profile id (state name -> kind). Prototype data. */
const PROFILE_POLICIES: Record<string, StatePolicies> = {
  "1016448": { "North Dakota": "state", Nevada: "state", Pennsylvania: "state", Colorado: "area-codes", Texas: "area-codes", Georgia: "area-codes", Florida: "area-codes",
    "Canada/Ontario": "state", "Canada/Quebec": "area-codes", "Mexico/Jalisco": "area-codes" },
  "1016446": { Florida: "state", Georgia: "state", "North Carolina": "area-codes" },
  "1016447": { California: "area-codes", Texas: "area-codes" },
};

/* Rules shown in the State Details panel. Colorado is the design reference; every other state with a policy gets a
   default pair by kind. Prototype data. */
const COLORADO_RULES: PolicyRule[] = [
  { type: "Voice", schedule: "Everyday", doNotContact: false, doNotLeaveMessages: true },
  { type: "SMS", schedule: "Everyday", doNotContact: true, doNotLeaveMessages: false },
];
const STATEWIDE_RULES: PolicyRule[] = [
  { type: "Voice", schedule: "Everyday", doNotContact: true, doNotLeaveMessages: true },
  { type: "SMS", schedule: "Everyday", doNotContact: true, doNotLeaveMessages: true },
];
const AREA_CODE_RULES: PolicyRule[] = [{ type: "Voice", schedule: "Weekdays", doNotContact: false, doNotLeaveMessages: true }];
function rulesFor(policies: StatePolicies): Record<string, PolicyRule[]> {
  return Object.fromEntries(
    Object.entries(policies).map(([state, kind]) => [state, state === "Colorado" ? COLORADO_RULES : kind === "state" ? STATEWIDE_RULES : AREA_CODE_RULES]),
  );
}

const TABS = ["General", "Voice", "SMS", "Associated Entities", "Map", "Change History"] as const;
type TabName = (typeof TABS)[number];

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="lyra-body-sm font-medium uppercase text-lyra-fg-primary">{label}</div>
      <div className="lyra-body-md text-lyra-fg-primary">{value}</div>
    </div>
  );
}

export function ProfilesConfigPage() {
  const [profiles, setProfiles] = useState(SEED);
  const [selectedId, setSelectedId] = useState(SEED[0].id);
  const saved = profiles.find((p) => p.id === selectedId) ?? profiles[0];
  const [draft, setDraft] = useState<Profile>(saved);
  const [tab, setTab] = useState<TabName>("General");

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);
  const mapPolicies = useMemo(() => PROFILE_POLICIES[draft.id] ?? {}, [draft.id]);
  const mapRules = useMemo(() => rulesFor(mapPolicies), [mapPolicies]);
  const options = profiles.map((p) => ({ value: p.id, label: p.name }));

  const select = (id: string) => {
    const next = profiles.find((p) => p.id === id);
    if (!next) return;
    setSelectedId(id);
    setDraft(next);
  };
  const save = () => setProfiles((all) => all.map((p) => (p.id === draft.id ? { ...draft, modifiedBy: "David Bauer - just now" } : p)));
  const copy = () => {
    const clone = { ...draft, id: String(Date.now()).slice(-7), name: `${draft.name} (Copy)`, createdBy: "David Bauer - just now", modifiedBy: "David Bauer - just now" };
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
          <Select label="Profiles" options={options} value={selectedId} onValueChange={select} />
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

      <TabList className="px-5" aria-label="Profile sections">
        {TABS.map((t) => (
          <Tab key={t} active={tab === t} onClick={() => setTab(t)}>{t}</Tab>
        ))}
      </TabList>

      <TabPanel active={tab === "General"} className="flex flex-col gap-4 p-5">
        <Meta label="Profile ID" value={draft.id} />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Input label="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <Input label="Description" placeholder="250 Characters Max" maxLength={250} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </div>
        <hr className="my-2 border-lyra-border-subtle" />
        <div className="grid grid-cols-2 gap-6">
          <Meta label="Created By" value={draft.createdBy} />
          <Meta label="Last Modified By" value={draft.modifiedBy} />
        </div>
      </TabPanel>

      <TabPanel active={tab === "Map"}>
        {tab === "Map" && <ProfilePolicyMap policies={mapPolicies} rules={mapRules} />}
      </TabPanel>

      {TABS.filter((t) => t !== "General" && t !== "Map").map((t) => (
        <TabPanel key={t} active={tab === t} className="p-5">
          <p className="lyra-body-md text-lyra-fg-secondary">{t} settings go here.</p>
        </TabPanel>
      ))}
    </div>
  );
}

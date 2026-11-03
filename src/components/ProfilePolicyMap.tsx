import { useCallback, useEffect, useMemo, useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { geoArea, geoNaturalEarth1, geoPath, type GeoProjection } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry, Polygon } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import statesTopology from "us-atlas/states-albers-10m.json";
import { ActionIconButton, Select } from "@nicecxone/lyra-ui";
import { useConfigureInteriorPanel } from "./ConfigurePanel";

/* The Map tab of a Profile: which US states the profile has a contact policy for. Clicking a state opens the shell's
   interior panel (see ConfigurePanel) with that state's policy rules. The drawing uses open-source
   pieces: us-atlas (US Census boundaries, already projected with Alaska and Hawaii as insets), topojson-client to
   turn them into shapes, and d3-geo's geoPath to draw each state as an SVG path. Zoom is a CSS scale of the SVG.

   The country dropdown lists every country in Natural Earth (via the world-atlas package, loaded on first use so it
   stays out of the main bundle) and has a search box. The United States is drawn state by state because that is the
   data we have. Every other country is drawn region by region (states, provinces, ...) from Natural Earth's admin-1
   boundaries (public domain), pre-simplified into src/data/admin1-regions.json and loaded on first use; a country
   with no regions in that file (a few micro-states) is drawn as one outline. Regions have no policy by default. */

export type PolicyKind = "state" | "area-codes";
/** Per profile: state name -> kind of policy. A state that is not listed has no policy. */
export type StatePolicies = Record<string, PolicyKind>;

const FILL: Record<PolicyKind | "none", string> = { state: "#B22424", "area-codes": "#E5A93D", none: "#C9CACE" };
const LEGEND: { kind: PolicyKind | "none"; label: string }[] = [
  { kind: "state", label: "Policy throughout the state" },
  { kind: "area-codes", label: "Policy for some area codes" },
  { kind: "none", label: "No Policy" },
];
/** One rule inside a state's policy, as listed in the State Details panel. */
export interface PolicyRule {
  type: "Voice" | "SMS";
  schedule: string;
  doNotContact: boolean;
  doNotLeaveMessages: boolean;
}

const HOME_COUNTRY = "United States of America";
const ZOOM_STEPS = [50, 75, 100, 125, 150, 200, 300];

const topology = statesTopology as unknown as Topology;
const states = feature(topology, topology.objects.states as GeometryCollection) as FeatureCollection<Geometry, { name: string }>;
const toPath = geoPath();
const SHAPES = states.features.map((f) => ({ name: f.properties.name, d: toPath(f) ?? "" }));

type CountryFeature = Feature<Geometry, { name: string }>;
let countriesPromise: Promise<CountryFeature[]> | null = null;
/** All countries, sorted by name. Loaded once, the first time the Map tab is used. */
function loadCountries(): Promise<CountryFeature[]> {
  countriesPromise ??= import("world-atlas/countries-50m.json").then((m) => {
    const world = m.default as unknown as Topology;
    const all = feature(world, world.objects.countries as GeometryCollection) as FeatureCollection<Geometry, { name: string }>;
    return [...all.features].sort((a, b) => a.properties.name.localeCompare(b.properties.name));
  });
  return countriesPromise;
}

type RegionsByCountry = Record<string, Topology>;
let regionsPromise: Promise<RegionsByCountry> | null = null;
/** Admin-1 regions (states, provinces, ...) for every country that has them, keyed by country name. */
function loadRegions(): Promise<RegionsByCountry> {
  regionsPromise ??= import("../data/admin1-regions.json").then((m) => m.default as unknown as RegionsByCountry);
  return regionsPromise;
}

/** Projection that fits a country to the 975 x 610 map area. Far-flung pieces (French Guiana, Svalbard, ...) are
    left out of the fit, so the mainland fills the map; the pieces are still drawn, just cropped by the viewBox. */
function fitProjection(f: CountryFeature): GeoProjection {
  const g = f.geometry;
  const polys: Polygon[] = g.type === "MultiPolygon" ? g.coordinates.map((coordinates) => ({ type: "Polygon", coordinates })) : g.type === "Polygon" ? [g] : [];
  const areas = polys.map((p) => geoArea(p));
  const biggest = Math.max(...areas);
  const main = polys.filter((_, i) => areas[i] >= biggest * 0.25);
  return geoNaturalEarth1().fitExtent([[24, 24], [951, 586]], { type: "GeometryCollection", geometries: main });
}

interface DrawnShape {
  /** Unique key; also the policy key (bare state name for the US, "Country/Region" elsewhere). */
  key: string;
  name: string;
  d: string;
}

const POLICY_LABEL: Record<PolicyKind | "none", string> = { state: "Policy throughout the state", "area-codes": "Policy for some area codes", none: "No policy" };

const yesNo = (v: boolean) => (v ? "Yes" : "No");

function StateDetails({ state, kind, rules }: { state: string; kind: PolicyKind | "none"; rules: PolicyRule[] }) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div>
        <div className="lyra-heading-xs text-lyra-fg-primary">{state}</div>
        <div className="lyra-body-sm text-lyra-fg-secondary">{POLICY_LABEL[kind]}</div>
      </div>
      {rules.length === 0 ? (
        <p className="lyra-body-md text-lyra-fg-secondary">This profile has no policy for {state}.</p>
      ) : (
        <ul className="overflow-hidden rounded-md border border-lyra-border-subtle" aria-label={`${state} policy rules`}>
          {rules.map((r, i) => (
            <li key={`${r.type}-${i}`} className="border-b border-lyra-border-subtle px-3 py-2 last:border-b-0 even:bg-lyra-bg-surface-container-subtle">
              <div className="lyra-body-sm text-lyra-fg-primary"><span className="font-semibold">Type:</span> {r.type}</div>
              <div className="lyra-body-sm text-lyra-fg-secondary">{r.schedule}</div>
              <div className="lyra-body-sm text-lyra-fg-primary">
                <span className="font-semibold">Do Not Contact:</span> {yesNo(r.doNotContact)} <span aria-hidden>|</span>{" "}
                <span className="font-semibold">Do Not Leave Messages:</span> {yesNo(r.doNotLeaveMessages)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ProfilePolicyMap({ policies, rules }: { policies: StatePolicies; rules: Record<string, PolicyRule[]> }) {
  const panel = useConfigureInteriorPanel();
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [country, setCountry] = useState(HOME_COUNTRY);
  const [countries, setCountries] = useState<CountryFeature[] | null>(null);
  const stepIndex = ZOOM_STEPS.indexOf(zoom);
  const isHome = country === HOME_COUNTRY;

  useEffect(() => {
    let live = true;
    loadCountries().then((list) => live && setCountries(list));
    return () => {
      live = false;
    };
  }, []);
  const countryOptions = useMemo(
    () => (countries ? countries.map((c) => ({ value: c.properties.name, label: c.properties.name })) : [{ value: HOME_COUNTRY, label: HOME_COUNTRY }]),
    [countries],
  );
  const [regions, setRegions] = useState<RegionsByCountry | null>(null);
  useEffect(() => {
    if (isHome) return;
    let live = true;
    loadRegions().then((r) => live && setRegions(r));
    return () => {
      live = false;
    };
  }, [isHome]);
  /* The shapes to draw for a non-US country: its regions once loaded, otherwise (or when it has none) its outline. */
  const otherShapes = useMemo<DrawnShape[]>(() => {
    const f = !isHome && countries?.find((c) => c.properties.name === country);
    if (!f) return [];
    const path = geoPath(fitProjection(f));
    const topo = regions?.[country];
    if (topo) {
      const fc = feature(topo, topo.objects.regions as GeometryCollection) as FeatureCollection<Geometry, { name: string }>;
      const seen = new Set<string>();
      return fc.features.map((r) => {
        let key = `${country}/${r.properties.name}`;
        while (seen.has(key)) key += "'"; // two regions can share a name; keep keys unique
        seen.add(key);
        return { key, name: r.properties.name, d: path(r) ?? "" };
      });
    }
    return [{ key: country, name: country, d: path(f) ?? "" }];
  }, [isHome, countries, country, regions]);
  const shapes = useMemo(() => SHAPES.map((s) => ({ ...s, kind: (policies[s.name] ?? "none") as PolicyKind | "none" })), [policies]);

  const pick = useCallback(
    (key: string, name: string) => {
      setSelected(key);
      panel.open({
        title: isHome ? "State Details" : "Region Details",
        content: <StateDetails state={name} kind={policies[key] ?? "none"} rules={rules[key] ?? []} />,
        onClose: () => setSelected(null),
      });
    },
    [panel, policies, rules, isHome],
  );

  /* A different profile, or leaving the tab, makes the open panel stale: close it. */
  useEffect(() => {
    setSelected(null);
    panel.close();
    return () => panel.close();
  }, [policies, country, panel]);

  const drawn: DrawnShape[] = useMemo(() => (isHome ? shapes.map((s) => ({ key: s.name, name: s.name, d: s.d })) : otherShapes), [isHome, shapes, otherShapes]);

  return (
    <div className="flex flex-col gap-6 p-5 lg:flex-row">
      <div className="flex w-full shrink-0 flex-col gap-4 lg:w-[340px]">
        <div className="flex w-fit items-center gap-1 rounded-md bg-lyra-bg-surface-container-subtle px-2 py-1">
          <ActionIconButton title="Zoom in" disabled={stepIndex >= ZOOM_STEPS.length - 1} onClick={() => setZoom(ZOOM_STEPS[stepIndex + 1])}>
            <ZoomIn className="h-4 w-4" strokeWidth={1.5} />
          </ActionIconButton>
          <ActionIconButton title="Zoom out" disabled={stepIndex <= 0} onClick={() => setZoom(ZOOM_STEPS[stepIndex - 1])}>
            <ZoomOut className="h-4 w-4" strokeWidth={1.5} />
          </ActionIconButton>
          <span className="lyra-body-sm w-12 text-lyra-fg-primary">{zoom}%</span>
        </div>

        <Select label="Select Country" searchable loading={!countries} options={countryOptions} value={country} onValueChange={setCountry} />

        <ul className="flex flex-col gap-4 rounded-md border border-lyra-border-subtle p-4" aria-label="Map legend">
          {LEGEND.map((l) => (
            <li key={l.kind} className="flex items-center gap-3">
              <span className="h-4 w-4 shrink-0 rounded-full" style={{ background: FILL[l.kind] }} aria-hidden />
              <span className="lyra-body-md text-lyra-fg-primary">{l.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="min-w-0 flex-1 overflow-auto">
        <svg viewBox="0 0 975 610" role="img" aria-label={isHome ? "Map of contact policies by US state" : `Map of ${country}`} style={{ width: `${zoom}%`, height: "auto" }}>
          {drawn.map((s) => {
            const kind = (policies[s.key] ?? "none") as PolicyKind | "none";
            return (
              <path
                key={s.key}
                d={s.d}
                fill={FILL[kind]}
                stroke="#fff"
                strokeWidth={0.75}
                strokeLinejoin="round"
                role="button"
                tabIndex={0}
                aria-label={`${s.name}: ${POLICY_LABEL[kind]}`}
                aria-pressed={selected === s.key}
                className="cursor-pointer outline-none hover:brightness-95 focus-visible:brightness-90"
                onClick={() => pick(s.key, s.name)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    pick(s.key, s.name);
                  }
                }}
              >
                <title>{`${s.name}: ${POLICY_LABEL[kind]}`}</title>
              </path>
            );
          })}
          {/* The selection outline is its own top layer: drawn inside the loop above, later neighbours would paint
              over half of it. */}
          {drawn.filter((s) => s.key === selected).map((s) => (
            <path key={`sel-${s.key}`} d={s.d} fill="none" stroke="#1F2937" strokeWidth={2} strokeLinejoin="round" pointerEvents="none" />
          ))}
        </svg>
      </div>
    </div>
  );
}

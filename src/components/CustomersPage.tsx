import { useState } from "react";
import { ArrowRight, Download, Meh, RefreshCw, Upload } from "lucide-react";
import {
  ActionIconButton,
  Button,
  SearchInput,
  Select,
  ColumnToggle,
  SortableTableHead,
  Tab,
  TabList,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  type ColumnToggleItem,
  type QueryChip,
  type QueryGroup,
  type SortDirection,
} from "@nicecxone/lyra-ui";
import { CUSTOMERS, type CustomerRecord } from "../data/customers-data";
import { SegmentQueryBuilder } from "./SegmentQueryBuilder";

/* The Query Builder is lyra-ui's `QueryBuilder` (see SegmentQueryBuilder); its query is a
   `QueryGroup` that this page evaluates against the customers below. */

/** Evaluate one criteria chip against a customer. Only first/last name and department
    exist on the placeholder data; the builder's other criteria (age, gender, status) don't filter. */
function chipMatches(c: CustomerRecord, chip: QueryChip): boolean {
  const field =
    chip.criteriaId === "first-name" ? c.firstName
    : chip.criteriaId === "last-name" ? c.lastName
    : chip.criteriaId === "department" ? c.department
    : null;
  if (field === null || chip.values.length === 0) return true;
  const v = field.toLowerCase();
  const test = (x: string) =>
    chip.operator === "equals" || chip.operator === "not-equals" ? v === x
    : chip.operator === "starts-with" ? v.startsWith(x)
    : chip.operator === "ends-with" ? v.endsWith(x)
    : v.includes(x);
  const hit = chip.values.some(test);
  return chip.operator === "not-equals" || chip.operator === "does-not-contain" ? !hit : hit;
}

function groupMatches(c: CustomerRecord, g: QueryGroup): boolean {
  const results = [...g.chips.map((ch) => chipMatches(c, ch)), ...g.subGroups.map((sg) => groupMatches(c, sg))];
  if (results.length === 0) return true;
  if (g.logicOperator === "or") return results.some(Boolean);
  if (g.logicOperator === "not") return !results.some(Boolean);
  return results.every(Boolean);
}

/* ── Customers — the Customer Manager page (Configure › Customers › Customer
   Manager). The legacy page was called "Contacts"; here it is "Customers".
   Same Lyra table pattern as the Campaigns page: AdminShell, TableToolbar,
   sortable headers, TableFooter pagination. Data is placeholder. ── */

type ColKey =
  | "account" | "firstName" | "lastName" | "salutation" | "department" | "description" | "title"
  | "phone1" | "paymentBalance" | "happinessIndex" | "happinessTrend" | "happinessUpdated";
type SortKey = Exclude<ColKey, "happinessIndex" | "happinessTrend">;

const COLUMNS: Record<ColKey, { label: string; flex: string; sortable: boolean }> = {
  account:          { label: "Account",                flex: "flex-[1] min-w-[100px]", sortable: true },
  firstName:        { label: "First Name",             flex: "flex-[0.9] min-w-[80px]",     sortable: true },
  lastName:         { label: "Last Name",              flex: "flex-[0.9] min-w-[80px]",     sortable: true },
  salutation:       { label: "Salutation",             flex: "flex-[0.6] min-w-[70px]",     sortable: true },
  department:       { label: "Department",             flex: "flex-[0.8] min-w-[80px]",     sortable: true },
  description:      { label: "Description",            flex: "flex-[0.8] min-w-[80px]", sortable: true },
  title:            { label: "Title",                  flex: "flex-[0.5] min-w-[50px]",      sortable: true },
  phone1:           { label: "Phone 1",                flex: "flex-[1.5] min-w-[145px]", sortable: true },
  paymentBalance:   { label: "Payment Balance",        flex: "flex-[1.3] min-w-[110px]",     sortable: true },
  happinessIndex:   { label: "Happiness Index",        flex: "flex-[1.2] min-w-[110px]",     sortable: false },
  happinessTrend:   { label: "Happiness Trend",        flex: "flex-[1.2] min-w-[110px]",     sortable: false },
  happinessUpdated: { label: "Happiness Last Updated", flex: "flex-[1.4] min-w-[130px]", sortable: true },
};

const TABS = ["Customers", "Groups", "Scheduled Campaign Jobs", "Import/Export Jobs"] as const;

const SEARCH_FIELDS = [
  { value: "fullName", label: "Full Name" },
  { value: "firstName", label: "First Name" },
  { value: "lastName", label: "Last Name" },
  { value: "account", label: "Account" },
  { value: "phone1", label: "Phone 1" },
  { value: "department", label: "Department" },
];
const SEARCH_OPERATORS = [
  { value: "contains", label: "Contains" },
  { value: "equals", label: "Equals" },
  { value: "startsWith", label: "Starts With" },
];

export function CustomersPage() {

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Customers");
  const [searchQuery, setSearchQuery] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [draftQuery, setDraftQuery] = useState("");
  const [searchField, setSearchField] = useState("fullName");
  const [searchOp, setSearchOp] = useState("contains");
  const [segmentName, setSegmentName] = useState<string | undefined>();
  const [qbApplied, setQbApplied] = useState<QueryGroup | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  const allColumnDefs: ColumnToggleItem[] = (Object.keys(COLUMNS) as ColKey[]).map((key) => ({ key, label: COLUMNS[key].label }));
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(Object.keys(COLUMNS)));
  const columnOrder = (Object.keys(COLUMNS) as ColKey[]).filter((k) => visibleCols.has(k));

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      const next: SortDirection = sortDir === null ? "asc" : sortDir === "asc" ? "desc" : null;
      setSortDir(next);
      if (next === null) setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const q = searchQuery.trim().toLowerCase();
  const filtered = CUSTOMERS.filter((c) => {
    // An applied Query Builder query takes over from the field / operator search.
    if (qbApplied) return groupMatches(c, qbApplied);
    if (!q) return true;
    const v = (
      searchField === "fullName" ? `${c.firstName} ${c.lastName}` : String(c[searchField as keyof CustomerRecord] ?? "")
    ).toLowerCase();
    return searchOp === "equals" ? v === q : searchOp === "startsWith" ? v.startsWith(q) : v.includes(q);
  });  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey || !sortDir) return 0;
    const cmp = String(a[sortKey as keyof CustomerRecord] ?? "").toLowerCase().localeCompare(String(b[sortKey as keyof CustomerRecord] ?? "").toLowerCase(), undefined, { numeric: true });
    return sortDir === "asc" ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * rowsPerPage;
  const pageRows = sorted.slice(start, start + rowsPerPage);

  function renderCell(c: CustomerRecord, key: ColKey) {
    switch (key) {
      case "happinessIndex":
        return <Meh className="h-5 w-5 text-lyra-fg-secondary" strokeWidth={1.5} aria-label="Neutral" />;
      case "happinessTrend":
        return <ArrowRight className="h-4 w-4 text-lyra-fg-secondary" strokeWidth={1.5} aria-label="Flat" />;
      default:
        return c[key];
    }
  }

  return (
    <>
      <div className="shrink-0 bg-lyra-bg-surface-base">
        <TabList aria-label="Customer tabs" className="px-6" overflowMenu overflowBreakpoint="wide">
          {TABS.map((tab) => (
            <Tab key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>
              {tab}
            </Tab>
          ))}
        </TabList>
      </div>

      {activeTab !== "Customers" ? (
        <p className="lyra-body-sm text-lyra-fg-secondary p-6">{activeTab} go here.</p>
      ) : (
        <>
          <TableToolbar
            className="px-6"
            title={`${sorted.length} Records`}
            {...({
                  filters: (
                    <>
                      {!qbApplied && (
                        <>
                      <div className="w-[140px]">
                        <Select aria-label="Search field" size="sm" options={SEARCH_FIELDS} value={searchField} onValueChange={setSearchField} />
                      </div>
                      <div className="w-[130px]">
                        <Select aria-label="Search operator" size="sm" options={SEARCH_OPERATORS} value={searchOp} onValueChange={setSearchOp} />
                      </div>
                      <SearchInput
                        size="sm"
                        placeholder="Search"
                        aria-label="Search"
                        className="w-[240px]"
                        value={draftQuery}
                        onValueChange={(v) => {
                          setDraftQuery(v);
                          // Clearing the field also clears the results.
                          if (v === "") {
                            setSearchQuery("");
                            setCurrentPage(1);
                          }
                        }}
                        onSubmit={(v) => {
                          // Server-side search: only runs on Enter / the arrow button.
                          setSearchQuery(v);
                          setCurrentPage(1);
                        }}
                      />
                        </>
                      )}
                      <SegmentQueryBuilder
                        applied={qbApplied}
                        segmentName={segmentName}
                        onApply={(query) => {
                          setQbApplied(query);
                          if (!query) setSegmentName(undefined);
                          setCurrentPage(1);
                        }}
                        onSaveSegment={(name, query) => {
                          setSegmentName(name);
                          setQbApplied(query);
                          setCurrentPage(1);
                        }}
                      />
                      {qbApplied && (
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setQbApplied(null);
                            setSegmentName(undefined);
                            setCurrentPage(1);
                          }}
                        >
                          Clear
                        </Button>
                      )}
                    </>
                  ),
                })}
            actions={
              <>
                <ActionIconButton title="Sync"><RefreshCw className="h-4 w-4" strokeWidth={1.5} /></ActionIconButton>
                <ActionIconButton title="Import"><Upload className="h-4 w-4" strokeWidth={1.5} /></ActionIconButton>
                <ActionIconButton title="Export"><Download className="h-4 w-4" strokeWidth={1.5} /></ActionIconButton>
                <ColumnToggle columns={allColumnDefs} visibleColumns={visibleCols} onVisibilityChange={setVisibleCols} />
              </>
            }
          />

          <div className="flex-1 overflow-hidden px-6">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {columnOrder.map((key) => {
                    const col = COLUMNS[key];
                    return col.sortable ? (
                      <SortableTableHead
                        key={key}
                        className={col.flex}
                        sortDirection={sortKey === key ? sortDir : null}
                        onSort={() => handleSort(key as SortKey)}
                        columnKey={key}
                      >
                        {col.label}
                      </SortableTableHead>
                    ) : (
                      <TableHead key={key} className={col.flex}>
                        {col.label}
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((c) => (
                  <TableRow key={c.id}>
                    {columnOrder.map((key) => (
                      <TableCell key={key} className={COLUMNS[key].flex} columnKey={key}>
                        {renderCell(c, key)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <TableFooter
            className="px-6 shrink-0"
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 20, 50, 100]}
            onRowsPerPageChange={(val) => {
              setRowsPerPage(val);
              setCurrentPage(1);
            }}
            totalRecords={sorted.length}
            displayStart={sorted.length ? start + 1 : 0}
            displayEnd={Math.min(start + rowsPerPage, sorted.length)}
          />
        </>
      )}
    </>
  );
}

import { useState } from "react";
import {
  Phone,
  Star,
  Headset,
  ClipboardPen,
  Filter,
  Search,
  RefreshCw,
  Pause,
  Square,
} from "lucide-react";

import {
  Button,
  ActionIconButton,
  Checkbox,
  Select,
  AdminShell,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  SortableTableHead,
  TableToolbar,
  TableFooter,
  ColumnToggle,
  useColumnReorder,
  type TreeMenuItem,
} from "@nicecxone/lyra-ui";
import type { SortDirection, ColumnToggleItem } from "@nicecxone/lyra-ui";
import { CampaignDetailsModal } from "./CampaignDetailsModal";

/* ── Navigation items — grouped nav tree matching the "Configure" reference
   screenshot: a "Campaigns" group (defaultOpen) containing Campaigns
   (active)/Campaign Templates/Segmentation, plus every other top-level
   section from the screenshot below it — each collapsed by default and
   expandable, matching the reference exactly. TreeMenuChild has no icon
   prop in lyra-ui today, so all children render as plain text rows, per
   the user's direction not to add icon support to lyra-ui for this.
   TreeMenu only renders a group's expand chevron when it has at least one
   child (`children.length > 0`), so each section below gets a single
   placeholder child sharing its parent's name — real sub-items for these
   sections weren't specified, so nothing beyond "this section exists and
   expands" is invented here. ── */
const panelItems: TreeMenuItem[] = [
  {
    label: "Campaigns",
    defaultOpen: true,
    children: [
      { label: "Campaigns", active: true },
      { label: "Campaign Templates" },
      { label: "Segmentation" },
    ],
  },
  { label: "Services", children: [{ label: "Services" }] },
  { label: "Agents", children: [{ label: "Agents" }] },
  { label: "Ticketing", children: [{ label: "Ticketing" }] },
  { label: "Contacts", children: [{ label: "Contacts" }] },
  { label: "Account", children: [{ label: "Account" }] },
  { label: "Voice", children: [{ label: "Voice" }] },
  { label: "Email", children: [{ label: "Email" }] },
  { label: "SMS", children: [{ label: "SMS" }] },
  { label: "Web Widget", children: [{ label: "Web Widget" }] },
  { label: "Messaging", children: [{ label: "Messaging" }] },
  { label: "Input / Output", children: [{ label: "Input / Output" }] },
  { label: "System", children: [{ label: "System" }] },
];

/* ── Mock data — mirrors the "Campaigns" reference screenshot ── */
export interface CampaignRecord {
  id: number;
  name: string;
  playState: "phone" | "star";
  schedule: string;
  type: string;
  serviceName: string;
  amOption: "headset" | "note";
  strategy: string;
  uploaded: number | null;
  loaded: number | null;
  completed: number | null;
  remaining: number | null;
  percentComplete: number;
  controlsActive: boolean;
}

const records: CampaignRecord[] = [
  { id: 1, name: "3160340_CALLBACK_CALLS_07-06-2026", playState: "phone", schedule: "On Demand", type: "CALLBACK", serviceName: "Virtual_Agent_IB", amOption: "headset", strategy: "(0)", uploaded: null, loaded: null, completed: null, remaining: null, percentComplete: 0, controlsActive: false },
  { id: 2, name: "jritchiedemo", playState: "phone", schedule: "ASAP - End Of", type: "OUTBOUND", serviceName: "Ritchie QC", amOption: "note", strategy: "Standard (30)", uploaded: 1, loaded: 0, completed: 0, remaining: 0, percentComplete: 0, controlsActive: false },
  { id: 3, name: "GA_Daily", playState: "phone", schedule: "ASAP - 08:00 PM", type: "OUTBOUND", serviceName: "Virtual_QC", amOption: "headset", strategy: "Standard (30)", uploaded: 15000, loaded: 15000, completed: 0, remaining: 15000, percentComplete: 0, controlsActive: false },
  { id: 4, name: "append", playState: "phone", schedule: "ASAP - End Of", type: "SMS", serviceName: "SMS_TSUP", amOption: "note", strategy: "Standard (30)", uploaded: 8, loaded: 7, completed: 7, remaining: 0, percentComplete: 100, controlsActive: false },
  { id: 5, name: "Email_Participation_Offer", playState: "star", schedule: "On Demand", type: "EMAIL", serviceName: "BFLO LiveVox Bot", amOption: "note", strategy: "Standard (30)", uploaded: 9, loaded: 0, completed: 0, remaining: 0, percentComplete: 0, controlsActive: true },
  { id: 6, name: "SMS_Application_Follow_Up", playState: "star", schedule: "On Demand", type: "SMS", serviceName: "BFLO LiveVox Bot", amOption: "note", strategy: "Standard (30)", uploaded: 9, loaded: 0, completed: 0, remaining: 0, percentComplete: 0, controlsActive: true },
  { id: 7, name: "Delivery_MO", playState: "star", schedule: "On Demand", type: "OUTBOUND", serviceName: "BFLO MO", amOption: "note", strategy: "Standard (30)", uploaded: 24, loaded: 0, completed: 0, remaining: 0, percentComplete: 0, controlsActive: true },
  { id: 8, name: "Loan_Approvals", playState: "phone", schedule: "08:00 AM - Encore", type: "OUTBOUND", serviceName: "BFLO Preview", amOption: "headset", strategy: "Standard (30)", uploaded: 20, loaded: 20, completed: 0, remaining: 20, percentComplete: 0, controlsActive: false },
  { id: 9, name: "Follow_Up_QC", playState: "phone", schedule: "08:00 AM - Encore", type: "OUTBOUND", serviceName: "BFLO QC", amOption: "headset", strategy: "Standard (30)", uploaded: 21, loaded: 21, completed: 0, remaining: 21, percentComplete: 0, controlsActive: false },
  { id: 10, name: "Risk_Mitigation", playState: "phone", schedule: "08:00 AM - Encore", type: "HCI", serviceName: "BFLO HCI", amOption: "headset", strategy: "Standard (30)", uploaded: 12, loaded: 12, completed: 0, remaining: 12, percentComplete: 0, controlsActive: false },
  { id: 11, name: "Colombia_SMS", playState: "star", schedule: "On Demand", type: "SMS", serviceName: "Colombia LiveVox Bot", amOption: "note", strategy: "Standard (30)", uploaded: 25, loaded: 0, completed: 0, remaining: 0, percentComplete: 0, controlsActive: true },
  { id: 12, name: "Colombia_Preview", playState: "phone", schedule: "08:00 AM - Encore", type: "OUTBOUND", serviceName: "Colombia Preview", amOption: "headset", strategy: "Standard (30)", uploaded: 20, loaded: 20, completed: 0, remaining: 20, percentComplete: 0, controlsActive: false },
  { id: 13, name: "Colombia_HCI", playState: "phone", schedule: "07:30 AM - Encore", type: "HCI", serviceName: "Colombia HCI", amOption: "headset", strategy: "Standard (30)", uploaded: 19, loaded: 19, completed: 13, remaining: 6, percentComplete: 68, controlsActive: false },
];

const CALL_CENTER_OPTIONS = [
  { value: "buffalo", label: "Buffalo" },
  { value: "colombia", label: "Colombia" },
];
const SERVICE_OPTIONS = [
  { value: "outbound", label: "Outbound" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
];
const DATE_RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "last7", label: "Last 7 Days" },
  { value: "last30", label: "Last 30 Days" },
];

export function OutboundCampaignsPage({ showBadge = false }: { showBadge?: boolean }) {
  /* ── Filter panel row (funnel icon toggle) ── */
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [callCenter, setCallCenter] = useState("");
  const [service, setService] = useState("");
  const [dateRange, setDateRange] = useState("today");

  /* ── Misc toolbar state ── */
  const [hierarchical, setHierarchical] = useState(false);

  /* ── Campaign details modal ── */
  const [selectedRecord, setSelectedRecord] = useState<CampaignRecord | null>(null);

  /* ── Table state ── */
  const [searchQuery, setSearchQuery] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  type ColKey = "name" | "playState" | "schedule" | "type" | "serviceName" | "amOption" | "strategy" | "uploaded" | "loaded" | "completed" | "remaining" | "percentComplete" | "controls";
  type SortKey = Exclude<ColKey, "playState" | "amOption" | "controls">;

  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  const columnConfig: Record<ColKey, { label: string; flex: string; sortable: boolean }> = {
    name:            { label: "Campaign Name",     flex: "flex-[2.2] min-w-[200px]", sortable: true },
    playState:       { label: "Play State",        flex: "flex-1 min-w-[80px]",      sortable: false },
    schedule:        { label: "Schedule",          flex: "flex-[1.4] min-w-[120px]", sortable: true },
    type:            { label: "Type",              flex: "flex-1 min-w-[90px]",      sortable: true },
    serviceName:     { label: "Service Name",      flex: "flex-[1.4] min-w-[140px]", sortable: true },
    amOption:        { label: "AM Option",         flex: "flex-1 min-w-[90px]",      sortable: false },
    strategy:        { label: "Strategy",          flex: "flex-[1.2] min-w-[110px]", sortable: true },
    uploaded:        { label: "Uploaded",          flex: "flex-1 min-w-[85px]",      sortable: true },
    loaded:          { label: "Loaded",            flex: "flex-1 min-w-[80px]",      sortable: true },
    completed:       { label: "Completed",         flex: "flex-1 min-w-[95px]",      sortable: true },
    remaining:       { label: "Remaining",         flex: "flex-1 min-w-[95px]",      sortable: true },
    percentComplete: { label: "% Complete",        flex: "flex-1 min-w-[95px]",      sortable: true },
    controls:        { label: "Campaign Controls", flex: "w-[120px] shrink-0",       sortable: false },
  };

  const allColumnDefs: ColumnToggleItem[] = (Object.keys(columnConfig) as ColKey[]).map((key) => ({
    key, label: columnConfig[key].label,
  }));

  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(Object.keys(columnConfig) as ColKey[]));

  const { columnOrder: allColumnOrder, dragOverKey, dragHandlers } = useColumnReorder<ColKey>(Object.keys(columnConfig) as ColKey[]);
  const columnOrder = allColumnOrder.filter((k) => visibleCols.has(k));

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      const next: SortDirection = sortDir === null ? "asc" : sortDir === "asc" ? "desc" : null;
      setSortDir(next);
      if (next === null) setSortKey(null);
    } else { setSortKey(key); setSortDir("asc"); }
  }

  function dirFor(key: SortKey): SortDirection { return sortKey === key ? sortDir : null; }

  const filteredRecords = records.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.serviceName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (!sortKey || !sortDir) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    let cmp: number;
    if (typeof aVal === "number" && typeof bVal === "number") {
      cmp = aVal - bVal;
    } else {
      cmp = String(aVal ?? "").toLowerCase().localeCompare(String(bVal ?? "").toLowerCase());
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * rowsPerPage;
  const paginatedRecords = sortedRecords.slice(startIndex, startIndex + rowsPerPage);
  const displayStart = sortedRecords.length > 0 ? startIndex + 1 : 0;
  const displayEnd = Math.min(startIndex + rowsPerPage, sortedRecords.length);

  /* ── Campaign details modal navigation — steps through the current
     sorted/filtered list (not just the visible page), so Prev/Next in the
     modal stay meaningful regardless of which page was open when a row
     was clicked. Disabled at either end (undefined prop) rather than
     wrapping around. ── */
  const selectedIndex = selectedRecord
    ? sortedRecords.findIndex((r) => r.id === selectedRecord.id)
    : -1;
  const handleNavigatePrev =
    selectedIndex > 0 ? () => setSelectedRecord(sortedRecords[selectedIndex - 1]) : undefined;
  const handleNavigateNext =
    selectedIndex !== -1 && selectedIndex < sortedRecords.length - 1
      ? () => setSelectedRecord(sortedRecords[selectedIndex + 1])
      : undefined;

  function formatNum(n: number | null): string {
    return n === null ? "—" : n.toLocaleString();
  }

  return (
    <>
    <AdminShell
      storageKeyPrefix="lyra_outbound_campaigns"
      navTitle="Configure"
      navItems={panelItems}
      defaultLeftPinned
      showPageHeader
      pageTitle="Campaigns"
      pageBadge={showBadge ? "Active" : undefined}
      pageActions={
        <>
          <Button variant="outline">Deactivate</Button>
          <Button variant="outline">Requeue</Button>
          <Button>Upload</Button>
        </>
      }
      interiorPanelContent={
        <div className="p-4">
          <p className="lyra-body-md text-lyra-fg-secondary">Panel content goes here.</p>
        </div>
      }
      rightPanelContent={
        <div className="p-4">
          <p className="lyra-body-md text-lyra-fg-secondary">Side panel content.</p>
        </div>
      }
    >
      {/* ════ Toolbar ════ */}
      <TableToolbar
        className="px-6"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Quick Search"
        filters={
          <span className="lyra-body-md text-lyra-fg-secondary whitespace-nowrap">
            {sortedRecords.length} Records
          </span>
        }
        actionDefs={[
          { key: "refresh", label: "Refresh", icon: <RefreshCw className="h-4 w-4" strokeWidth={1.5} /> },
        ]}
        actions={
          <>
            <Checkbox
              label="Show Hierarchical Mode"
              checked={hierarchical}
              onCheckedChange={(checked) => setHierarchical(!!checked)}
            />
            <ColumnToggle
              columns={allColumnDefs}
              visibleColumns={visibleCols}
              onVisibilityChange={setVisibleCols}
            />
            <ActionIconButton
              title="Filters"
              badge={1}
              onClick={() => setFilterPanelOpen((v) => !v)}
            >
              <Filter className="h-4 w-4" strokeWidth={1.5} />
            </ActionIconButton>
          </>
        }
      />

      {/* ════ Filter panel row ════ */}
      {filterPanelOpen && (
        <div className="flex items-end gap-3 px-6 pb-3">
          <div className="w-[200px]">
            <Select
              label="Call Center"
              placeholder="Select"
              options={CALL_CENTER_OPTIONS}
              value={callCenter}
              onValueChange={setCallCenter}
            />
          </div>
          <div className="w-[200px]">
            <Select
              label="Service"
              placeholder="Select"
              options={SERVICE_OPTIONS}
              value={service}
              onValueChange={setService}
            />
          </div>
          <div className="w-[200px]">
            <Select
              label="Date Range"
              options={DATE_RANGE_OPTIONS}
              value={dateRange}
              onValueChange={setDateRange}
            />
          </div>
          <ActionIconButton title="Search" className="mb-0.5">
            <Search className="h-4 w-4" strokeWidth={1.5} />
          </ActionIconButton>
        </div>
      )}

      {/* ════ Data Table ════ */}
      <div className="flex-1 overflow-hidden px-6">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columnOrder.map((key) => {
                const col = columnConfig[key];
                if (col.sortable) {
                  return (
                    <SortableTableHead
                      key={key}
                      className={col.flex}
                      sortDirection={dirFor(key as SortKey)}
                      onSort={() => handleSort(key as SortKey)}
                      columnKey={key}
                      dragHandlers={dragHandlers}
                      isDragOver={dragOverKey === key}
                    >
                      {col.label}
                    </SortableTableHead>
                  );
                }
                return (
                  <TableHead
                    key={key}
                    className={col.flex}
                    draggable
                    onDragStart={(e) => dragHandlers.onDragStart(e, key)}
                    onDragOver={(e) => dragHandlers.onDragOver(e, key)}
                    onDrop={(e) => dragHandlers.onDrop(e, key)}
                    onDragEnd={dragHandlers.onDragEnd}
                    onDragLeave={dragHandlers.onDragLeave}
                    style={dragOverKey === key ? { backgroundColor: "var(--lyra-color-bg-active-moderate)" } : undefined}
                  >
                    {col.label}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRecords.map((record) => (
              <TableRow key={record.id}>
                {columnOrder.map((key) => {
                  const col = columnConfig[key];

                  if (key === "playState") {
                    return (
                      <TableCell key={key} className={col.flex}>
                        {record.playState === "phone"
                          ? <Phone className="h-4 w-4 text-lyra-fg-link" strokeWidth={1.5} />
                          : <Star className="h-4 w-4 text-lyra-fg-disabled" strokeWidth={1.5} />}
                      </TableCell>
                    );
                  }
                  if (key === "amOption") {
                    return (
                      <TableCell key={key} className={col.flex}>
                        {record.amOption === "headset"
                          ? <Headset className="h-4 w-4 text-lyra-fg-secondary" strokeWidth={1.5} />
                          : <ClipboardPen className="h-4 w-4 text-lyra-fg-secondary" strokeWidth={1.5} />}
                      </TableCell>
                    );
                  }
                  if (key === "controls") {
                    const activeClass = record.controlsActive ? "text-lyra-status-success-strong" : "text-lyra-fg-disabled";
                    return (
                      <TableCell key={key} className={col.flex}>
                        <div className="flex items-center gap-1">
                          <ActionIconButton size="sm" title="Refresh" className={activeClass}>
                            <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
                          </ActionIconButton>
                          <ActionIconButton size="sm" title="Pause" className={activeClass}>
                            <Pause className="h-4 w-4" strokeWidth={1.5} />
                          </ActionIconButton>
                          <ActionIconButton size="sm" title="Stop" className={activeClass}>
                            <Square className="h-4 w-4" strokeWidth={1.5} />
                          </ActionIconButton>
                        </div>
                      </TableCell>
                    );
                  }
                  if (key === "uploaded" || key === "loaded" || key === "completed" || key === "remaining") {
                    return (
                      <TableCell key={key} className={col.flex}>
                        {formatNum(record[key])}
                      </TableCell>
                    );
                  }
                  if (key === "percentComplete") {
                    return (
                      <TableCell key={key} className={col.flex}>
                        {record.percentComplete}%
                      </TableCell>
                    );
                  }
                  if (key === "name") {
                    return (
                      <TableCell
                        key={key}
                        className={`${col.flex} text-lyra-fg-link cursor-pointer hover:underline`}
                        onClick={() => setSelectedRecord(record)}
                      >
                        {record.name}
                      </TableCell>
                    );
                  }
                  return (
                    <TableCell key={key} className={col.flex}>
                      {String(record[key as keyof CampaignRecord])}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ════ Footer ════ */}
      <TableFooter
        className="px-6 shrink-0"
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(val) => { setRowsPerPage(val); setCurrentPage(1); }}
        totalRecords={sortedRecords.length}
        displayStart={displayStart}
        displayEnd={displayEnd}
      />
    </AdminShell>

    <CampaignDetailsModal
      record={selectedRecord}
      onClose={() => setSelectedRecord(null)}
      onNavigatePrev={handleNavigatePrev}
      onNavigateNext={handleNavigateNext}
    />
    </>
  );
}

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import {
  Button,
  Input,
  Popover,
  QueryBuilder,
  Tooltip,
  describeQuery,
  emptyQuery,
  queryHasCriteria,
  type QueryGroup,
} from "@nicecxone/lyra-ui";
import { CUSTOMER_QUERY_CRITERIA } from "../data/customer-query-criteria";

/* Query Builder popover for the Customers toolbar, with "Save Segment".
   TableToolbar's own Advanced Search popover hard-codes "Save Search" (button, heading and
   field label) with no prop to rename it, so this local version composes the same real
   pieces — Popover, lyra-ui's QueryBuilder, Button, Input — and owns the
   wording. If lyra-ui adds a label prop, this can go back to TableToolbar's `showAdvancedSearch`. */

export function SegmentQueryBuilder({
  applied,
  segmentName,
  onApply,
  onSaveSegment,
}: {
  /** The currently applied query, or null. */
  applied: QueryGroup | null;
  /** Name of the saved segment the applied query came from, if saved. */
  segmentName?: string;
  onApply: (query: QueryGroup | null) => void;
  onSaveSegment: (name: string, query: QueryGroup) => void;
}) {
  const [open, setOpen] = useState(false);
  const [root, setRoot] = useState<QueryGroup>(applied ?? emptyQuery());
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState("");

  const closeSave = () => {
    setSaveOpen(false);
    setName("");
  };
  const save = () => {
    if (!name.trim()) return;
    onSaveSegment(name.trim(), root);
    closeSave();
    setOpen(false);
  };

  const trigger = (
    <Button variant={applied ? "default" : "outline"} size="md">
      <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
      {applied ? "Applied Filters" : "Query Builder"}
    </Button>
  );

  const popover = (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setRoot(applied ?? emptyQuery());
          closeSave();
        }
      }}
      showArrow={false}
      maxHeight="calc(100vh - 120px)"
      bodyPadding={false}
      placement="bottom"
      className="w-[min(1024px,90vw)]"
      content={<QueryBuilder criteria={CUSTOMER_QUERY_CRITERIA} value={root} onChange={setRoot} />}
      footer={
        <div className="flex items-center justify-end gap-2 px-4 pb-4 pt-2">
          <Popover
            open={saveOpen}
            onOpenChange={(o) => (o ? setSaveOpen(true) : closeSave())}
            showArrow={false}
            placement="top"
            title="Save Segment"
            className="w-[320px]"
            content={
              <div className="flex flex-col gap-4 p-4">
                <Input
                  label="Segment Name"
                  placeholder="e.g. East Region Customers"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") save();
                  }}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={closeSave}>
                    Cancel
                  </Button>
                  <Button disabled={!name.trim()} onClick={save}>
                    Save
                  </Button>
                </div>
              </div>
            }
            bodyPadding={false}
          >
            <Button variant="outline" disabled={!queryHasCriteria(root)}>
              Save Segment
            </Button>
          </Popover>
          <div className="flex-1" />
          <Button
            variant="outline"
            onClick={() => {
              setRoot(applied ?? emptyQuery());
              closeSave();
              setOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onApply(queryHasCriteria(root) ? root : null);
              setOpen(false);
            }}
          >
            Apply
          </Button>
        </div>
      }
    >
      {trigger}
    </Popover>
  );

  return applied ? (
    <Tooltip
      placement="bottom"
      delayMs={300}
      content={
        <div className="flex max-w-xs flex-col gap-1">
          {segmentName && <span className="lyra-label text-lyra-fg-default">{segmentName}</span>}
          <span className="lyra-body-sm break-all font-mono text-lyra-fg-secondary">{describeQuery(applied, CUSTOMER_QUERY_CRITERIA)}</span>
        </div>
      }
    >
      <span className="inline-flex">{popover}</span>
    </Tooltip>
  ) : (
    popover
  );
}

"use client";

import type { MapStatusFilter } from "@/types/map";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface WardOption {
  id: number;
  alderman: string | null;
}

interface MapFiltersProps {
  wards: WardOption[];
  status: MapStatusFilter;
  ward: number | null;
  onStatusChange: (status: MapStatusFilter) => void;
  onWardChange: (ward: number | null) => void;
}

const STATUS_OPTIONS: { value: MapStatusFilter; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "completed", label: "Completed" },
  { value: "canceled", label: "Canceled" },
  { value: "all", label: "All" },
];

export function MapFilters({
  wards,
  status,
  ward,
  onStatusChange,
  onWardChange,
}: MapFiltersProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="mb-2 block font-mono text-[0.65rem] tracking-[0.2em] text-neutral-500 uppercase">
          Ward
        </label>
        <Select
          value={ward == null ? "all" : String(ward)}
          onValueChange={(v) => onWardChange(v === "all" ? null : Number(v))}
        >
          <SelectTrigger aria-label="Filter by ward">
            <SelectValue placeholder="All wards" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All wards</SelectItem>
            {wards.map((w) => (
              <SelectItem key={w.id} value={String(w.id)}>
                Ward {w.id}
                {w.alderman ? ` · ${w.alderman}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="mb-2 block font-mono text-[0.65rem] tracking-[0.2em] text-neutral-500 uppercase">
          Status
        </label>
        <Select
          value={status}
          onValueChange={(v) => onStatusChange(v as MapStatusFilter)}
        >
          <SelectTrigger aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

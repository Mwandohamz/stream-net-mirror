import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange as DayRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { DateRange, RangePreset } from "@/lib/dateRange";

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "month", label: "This month" },
  { value: "lastMonth", label: "Last month" },
  { value: "year", label: "This year" },
  { value: "custom", label: "Custom dates" },
];

/** Shared admin date filter: presets plus a calendar range for custom dates. */
const DateRangeFilter = ({ value, onChange }: { value: DateRange; onChange: (next: DateRange) => void }) => (
  <div className="flex flex-wrap items-center gap-2">
    <Select value={value.preset} onValueChange={(preset) => onChange({ ...value, preset: preset as RangePreset })}>
      <SelectTrigger className="h-9 w-[150px]" aria-label="Date range"><SelectValue /></SelectTrigger>
      <SelectContent>{PRESETS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
    </Select>
    {value.preset === "custom" && (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("h-9 justify-start gap-2 font-normal", !value.from && "text-muted-foreground")}>
            <CalendarIcon size={14} />
            {value.from ? `${format(value.from, "d MMM yyyy")}${value.to ? ` – ${format(value.to, "d MMM yyyy")}` : ""}` : "Pick dates"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={{ from: value.from, to: value.to } as DayRange}
            onSelect={(r) => onChange({ preset: "custom", from: r?.from, to: r?.to })}
            disabled={{ after: new Date() }}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    )}
  </div>
);

export default DateRangeFilter;

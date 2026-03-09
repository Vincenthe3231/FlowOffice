"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ClaimDatePickerProps {
  date?: Date;
  onSelect: (date?: Date) => void;
  placeholder: string;
  className?: string;
}

export function ClaimDatePicker({
  date,
  onSelect,
  placeholder,
  className,
}: ClaimDatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-10 w-full justify-between rounded-xl border-border/70 bg-muted/10 px-3 text-left font-normal shadow-none hover:bg-muted/30",
            !date && "text-muted-foreground",
            className
          )}
        >
          <span>{date ? format(date, "dd/MM/yyyy") : placeholder}</span>
          <CalendarIcon className="h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto rounded-2xl border-border/70 p-0">
        <Calendar mode="single" selected={date} onSelect={onSelect} initialFocus />
      </PopoverContent>
    </Popover>
  );
}

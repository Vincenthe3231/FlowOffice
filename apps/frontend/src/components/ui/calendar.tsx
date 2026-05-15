"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  modifiersClassNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("rounded-2xl bg-background p-3", className)}
      classNames={{
        root: "w-fit",
        months: "flex flex-col",
        month: "space-y-4",
        month_caption: "relative flex items-center justify-center pt-1",
        caption_label: "text-sm font-semibold text-foreground",
        nav: "absolute inset-x-0 top-1 flex items-center justify-between px-1",
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "h-7 w-7 rounded-lg p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "h-7 w-7 rounded-lg p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
        ),
        table: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 text-xs font-medium text-muted-foreground",
        week: "mt-1 flex w-full",
        day: "h-9 w-9 p-0 text-center text-sm",
        day_button: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "h-9 w-9 rounded-xl p-0 font-normal text-foreground aria-selected:opacity-100"
        ),
        today: "text-foreground",
        outside: "text-muted-foreground opacity-45",
        disabled: "text-muted-foreground opacity-35",
        hidden: "invisible",
        ...classNames,
      }}
      modifiersClassNames={{
        selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        today: "bg-muted text-foreground",
        ...modifiersClassNames,
      }}
      components={{
        Chevron: ({ orientation, className: iconClassName, ...iconProps }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("h-4 w-4", iconClassName)} {...iconProps} />
          ) : (
            <ChevronRight className={cn("h-4 w-4", iconClassName)} {...iconProps} />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };

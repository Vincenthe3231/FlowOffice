"use client";

import * as React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { addYears, format as formatDate, subYears } from "date-fns";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  animate,
  AnimatePresence,
  type PanInfo,
} from "framer-motion";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const CENTER_OFFSET = Math.floor(VISIBLE_ITEMS / 2) * ITEM_HEIGHT;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

function triggerHaptic() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(4);
  }
}

function getDefaultYearRange(): [number, number] {
  const now = new Date();
  return [subYears(now, 2).getFullYear(), addYears(now, 1).getFullYear()];
}

interface ScrollColumnProps {
  items: (string | number)[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  width?: string;
}

function ScrollColumn({
  items,
  selectedIndex,
  onSelect,
  width = "flex-1",
}: ScrollColumnProps) {
  const y = useMotionValue(-selectedIndex * ITEM_HEIGHT);
  const lastSnappedIndex = useRef(selectedIndex);
  const bandScale = useSpring(1, { stiffness: 500, damping: 25 });

  const minY = -(items.length - 1) * ITEM_HEIGHT;
  const maxY = 0;

  useEffect(() => {
    animate(y, -selectedIndex * ITEM_HEIGHT, {
      type: "spring",
      stiffness: 300,
      damping: 30,
    });
    lastSnappedIndex.current = selectedIndex;
  }, [selectedIndex, y]);

  const snapToNearest = useCallback(
    (velocity = 0) => {
      const current = y.get();
      const projected = current + velocity * 0.15;
      let index = Math.round(-projected / ITEM_HEIGHT);
      index = Math.max(0, Math.min(index, items.length - 1));

      animate(y, -index * ITEM_HEIGHT, {
        type: "spring",
        stiffness: 400,
        damping: 35,
        velocity,
      });

      if (index !== lastSnappedIndex.current) {
        triggerHaptic();
        bandScale.set(1.04);
        setTimeout(() => bandScale.set(1), 120);
      }
      lastSnappedIndex.current = index;
      onSelect(index);
    },
    [y, items.length, onSelect, bandScale]
  );

  useEffect(() => {
    const unsub = y.on("change", (val) => {
      const liveIndex = Math.round(-val / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(liveIndex, items.length - 1));
      if (clamped !== lastSnappedIndex.current) {
        lastSnappedIndex.current = clamped;
        triggerHaptic();
        bandScale.set(1.04);
        setTimeout(() => bandScale.set(1), 100);
      }
    });
    return unsub;
  }, [y, items.length, bandScale]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    snapToNearest(info.velocity.y);
  };

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.stopPropagation();
      const next = y.get() - e.deltaY;
      const clamped = Math.max(minY, Math.min(maxY, next));
      y.set(clamped);
      snapToNearest(0);
    },
    [y, minY, maxY, snapToNearest]
  );

  return (
    <div
      className={cn("relative overflow-hidden", width)}
      style={{ height: CONTAINER_HEIGHT }}
      onWheel={handleWheel}
    >
      <motion.div
        className="pointer-events-none absolute inset-x-1 z-10 rounded-lg border-y border-primary/20 bg-accent/50"
        style={{
          top: CENTER_OFFSET,
          height: ITEM_HEIGHT,
          scaleY: bandScale,
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-16 bg-gradient-to-b from-background via-background/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-16 bg-gradient-to-t from-background via-background/80 to-transparent" />

      <motion.div
        className="absolute inset-x-0 touch-pan-y"
        style={{ y, top: CENTER_OFFSET }}
        drag="y"
        dragConstraints={{ top: minY, bottom: maxY }}
        dragElastic={0.15}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
      >
        {items.map((item, i) => (
          <ColumnItem
            key={`${item}-${i}`}
            item={item}
            index={i}
            y={y}
            itemHeight={ITEM_HEIGHT}
            onClick={() => {
              triggerHaptic();
              onSelect(i);
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}

function ColumnItem({
  item,
  index,
  y,
  itemHeight,
  onClick,
}: {
  item: string | number;
  index: number;
  y: ReturnType<typeof useMotionValue<number>>;
  itemHeight: number;
  onClick: () => void;
}) {
  const itemY = -index * itemHeight;
  const distance = useTransform(y, (val: number) =>
    Math.abs(val - itemY) / itemHeight
  );
  const opacity = useTransform(distance, (d: number) =>
    d <= 0 ? 1 : d <= 1 ? 0.55 : d <= 2 ? 0.25 : 0.15
  );
  const scale = useTransform(distance, (d: number) =>
    d <= 0 ? 1.05 : d <= 1 ? 0.97 : 0.88
  );
  const fontWeight = useTransform(distance, (d: number) => (d < 0.5 ? 600 : 400));

  return (
    <motion.div
      className="flex cursor-pointer select-none items-center justify-center text-foreground"
      style={{
        height: itemHeight,
        opacity,
        scale,
        fontWeight,
      }}
      onClick={onClick}
    >
      <span className="text-sm">{item}</span>
    </motion.div>
  );
}

export interface ScrollDatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  className?: string;
  placeholder?: string;
  /** Year range [startYear, endYear]. Default: 2 years back to 1 year ahead. */
  yearRange?: [number, number];
  /** Date format for display. Default: "dd/MM/yyyy" */
  format?: string;
}

export function ScrollDatePicker({
  value,
  onChange,
  className,
  placeholder = "Select date",
  yearRange = getDefaultYearRange(),
  format = "dd/MM/yyyy",
}: ScrollDatePickerProps) {
  const [open, setOpen] = useState(false);
  const current = value ?? new Date();

  const years = Array.from(
    { length: yearRange[1] - yearRange[0] + 1 },
    (_, i) => yearRange[0] + i
  );
  const [month, setMonth] = useState(current.getMonth());
  const [day, setDay] = useState(current.getDate());
  const [yearIndex, setYearIndex] = useState(
    Math.max(
      0,
      years.indexOf(
        Math.max(yearRange[0], Math.min(yearRange[1], current.getFullYear()))
      )
    )
  );

  const effectiveYear =
    yearIndex >= 0 && yearIndex < years.length ? years[yearIndex] : current.getFullYear();
  const daysInMonth = getDaysInMonth(month, effectiveYear);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    if (day > daysInMonth) setDay(daysInMonth);
  }, [daysInMonth, day]);

  useEffect(() => {
    if (open && value) {
      setMonth(value.getMonth());
      setDay(value.getDate());
      const idx = years.indexOf(value.getFullYear());
      setYearIndex(Math.max(0, idx >= 0 ? idx : 0));
    }
  }, [open, value, years]);

  const handleConfirm = () => {
    const clampedDay = Math.min(day, daysInMonth);
    const y = yearIndex >= 0 && yearIndex < years.length ? years[yearIndex] : effectiveYear;
    onChange(new Date(y, month, clampedDay));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-10 w-full justify-between rounded-xl border-border/60 px-3 text-left font-normal shadow-none hover:bg-muted/30",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {value ? formatDate(value, format) : placeholder}
          </span>
          <CalendarDays className="ml-2 h-4 w-4 shrink-0 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[320px] border-border/60 p-0 shadow-xl"
        align="start"
      >
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="px-4 pb-2 pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Pick a date
                </p>
                <div className="flex gap-0.5 overflow-hidden rounded-xl border border-border/40 bg-background">
                  <ScrollColumn
                    items={MONTHS}
                    selectedIndex={month}
                    onSelect={setMonth}
                    width="flex-[1.4]"
                  />
                  <ScrollColumn
                    items={days}
                    selectedIndex={day - 1}
                    onSelect={(i) => setDay(i + 1)}
                    width="flex-[0.6]"
                  />
                  <ScrollColumn
                    items={years}
                    selectedIndex={yearIndex}
                    onSelect={setYearIndex}
                    width="flex-[0.8]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 px-4 pb-3 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleConfirm}>
                  Confirm
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </PopoverContent>
    </Popover>
  );
}

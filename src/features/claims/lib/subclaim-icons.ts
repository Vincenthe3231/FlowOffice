import type { LucideIcon } from "lucide-react";
import {
  Bike,
  Briefcase,
  Building2,
  Bus,
  Car,
  CreditCard,
  FileText,
  Fuel,
  Plane,
  ShieldCheck,
  TrainFront,
  Utensils,
} from "lucide-react";
import type { SubclaimType } from "@/features/claims/types";

function haystack(sub: SubclaimType): string {
  return `${sub.key ?? ""} ${sub.label ?? ""}`.toLowerCase();
}

type IconRule = { test: (h: string) => boolean; Icon: LucideIcon };

/** More specific patterns first (e.g. motor before car). */
const SUBCLAIM_ICON_RULES: IconRule[] = [
  { test: (h) => /\b(motor|motorcycle|motorbike|scooter)\b/.test(h), Icon: Bike },
  { test: (h) => /\bcar\b/.test(h), Icon: Car },
  { test: (h) => /\b(fuel|petrol|diesel)\b/.test(h), Icon: Fuel },
  { test: (h) => /\b(hotel|lodging|accommodation)\b/.test(h), Icon: Building2 },
  { test: (h) => /\b(meal|food|dining|lunch|dinner|breakfast)\b/.test(h), Icon: Utensils },
  { test: (h) => /\b(air|flight|plane|air_ticket|airline)\b/.test(h), Icon: Plane },
  { test: (h) => /\b(public_transport|train|mrt|lrt|commuter)\b/.test(h), Icon: TrainFront },
  { test: (h) => /\bbus\b/.test(h), Icon: Bus },
  { test: (h) => /\b(insurance)\b/.test(h), Icon: ShieldCheck },
  { test: (h) => /\b(visa)\b/.test(h), Icon: FileText },
  { test: (h) => /\b(payment|card|credit)\b/.test(h), Icon: CreditCard },
];

export function getSubclaimTypeLucideIcon(sub: SubclaimType): LucideIcon {
  const h = haystack(sub);
  for (const { test, Icon } of SUBCLAIM_ICON_RULES) {
    if (test(h)) return Icon;
  }
  return Briefcase;
}

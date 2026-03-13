import type { ClaimType } from "@/features/claims/types";

/**
 * Fallback list of claim types when the API returns none (e.g. endpoint not yet implemented).
 * Matches the 9 types shown on the Claims Management page so the wizard always has options.
 */
export const FALLBACK_CLAIM_TYPES: ClaimType[] = [
  { id: "receipt", key: "receipt", label: "Receipt Claim", description: "Upload receipt and fill details", icon: "receipt", color: "stat-blue" },
  { id: "mileage", key: "mileage", label: "Mileage Claim", description: "Enter trip details and distance", icon: "mileage", color: "stat-purple" },
  { id: "business-travel", key: "business-travel", label: "Business Travel Claim", description: "Flights, hotels, and travel expenses", icon: "plane", color: "stat-green" },
  { id: "miscellaneous", key: "miscellaneous", label: "Miscellaneous Claim", description: "Other uncategorized expenses", icon: "package", color: "stat-orange" },
  { id: "office", key: "office", label: "Office Claim", description: "Office supplies and equipment", icon: "building", color: "stat-blue" },
  { id: "outstation", key: "outstation", label: "Outstation Allowance", description: "Allowance for outstation work", icon: "mappin", color: "stat-green" },
  { id: "renovation", key: "renovation", label: "Renovation Claim", description: "Workspace renovation expenses", icon: "hammer", color: "stat-orange" },
  { id: "special-mileage", key: "special-mileage", label: "Special Mileage Claim", description: "Special rate mileage trips", icon: "route", color: "stat-purple" },
  { id: "transportation", key: "transportation", label: "Transportation Claim", description: "Public transport and ride-hailing", icon: "bus", color: "stat-blue" },
];

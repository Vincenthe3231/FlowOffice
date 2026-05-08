/**
 * Frontend-only grouping for claim types (Manage Claims + wizard).
 * New types created as "Transport & mileage" get keys prefixed with this value
 * so they bucket with mileage/outstation/etc. without a backend category field.
 */
export const TRANSPORT_CLAIM_KEY_PREFIX = "tm-";

/** Whether a claim type key belongs in the Transport & mileage bucket (wizard step routing uses this too). */
export function isTransportClaimTypeKey(key: string): boolean {
  const normalized = key.toLowerCase();
  if (normalized.startsWith(TRANSPORT_CLAIM_KEY_PREFIX)) return true;
  const k = normalized.replace(/-/g, "_");
  return (
    k === "mileage" ||
    k === "outstation" ||
    k === "outstation_allowance" ||
    k === "special_mileage" ||
    k === "transportation" ||
    k === "transport" ||
    k === "bus" ||
    k === "bike"
  );
}

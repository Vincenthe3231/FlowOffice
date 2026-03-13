export type ClaimStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Paid"
  | "Draft";

export type ClaimFilter = "All" | ClaimStatus;

export type ClaimSubmissionType = "receipt" | "mileage";

export interface ClaimCategory {
  id: string;
  name: string;
  budget: number;
  spent: number;
}

export interface ClaimMonthlySpend {
  month: string;
  amount: number;
}

interface BaseClaim {
  id: number;
  title: string;
  category: string;
  amount: number;
  date: string;
  status: ClaimStatus;
  description: string;
  type: ClaimSubmissionType;
  merchant?: string;
}

export interface ReceiptClaim extends BaseClaim {
  type: "receipt";
  merchant: string;
}

export interface MileageClaim extends BaseClaim {
  type: "mileage";
  merchant?: string;
  fromLocation: string;
  toLocation: string;
  distance: number;
}

export type Claim = ReceiptClaim | MileageClaim;

// Wizard & approval types (mirrored from API / orbit-attendance)
export interface ClaimType {
  id: string;
  key: string;
  label: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface SubclaimType {
  id: string;
  claimTypeId: string;
  key: string;
  label: string;
  rate?: number | null;
  status?: string;
  description?: string;
}

export interface ClaimApproval {
  id: number;
  claimId: number;
  level: number;
  status: "pending" | "approved" | "rejected";
  reason?: string | null;
  decidedAt?: string | null;
}

export interface ApprovalThreshold {
  id?: number;
  level1Max?: number;
  level2Max?: number;
  level3Min?: number;
}

export interface CustomField {
  id: string;
  label: string;
  type:
    | "text"
    | "number"
    | "date"
    | "dropdown"
    | "mileage"
    | "percentage"
    | "photo";
  value: string;
  options?: string[];
}

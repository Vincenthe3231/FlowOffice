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

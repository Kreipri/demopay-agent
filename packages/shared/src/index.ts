export const CONTRACTS = {
  deviceRegistry: "CAC4KOLHDLDYDWBOKXNKRN5KVHO56PLOIFXDLTBUWGVN6GVDEB7FQHU5",
  agentRegistry: "CCMZDSPTLX7IIJWCYEUM5DJUHOSOYSTHGK777S2TXZWEMC5ZZGPJ3EBV",
  paymentEscrow: "CC7EAW5FNJEDBS7THM5IT6XIOHO4AOYMLXT3KSZ3HWUIKEACTW7E5BFS",
} as const;
export const NETWORK = "Stellar Testnet";
export type RequestItem = {
  id: string;
  invoice: string;
  vendor: string;
  description: string;
  amount: string;
  evidence: string;
  verified: boolean;
  recipientApproved: boolean;
  nonce: string;
};
// Deliberately fictional invoices. Only the first is payable; duplicate and cap
// examples cannot be converted into new payments by changing a request body.
export const REQUESTS: RequestItem[] = [
  {
    id: "req-001",
    invoice: "INV-1042",
    vendor: "Orbit Data",
    description: "Completed reconciliation report",
    amount: "3",
    evidence: "Delivery record DEMO-1042 matches the approved purchase order.",
    verified: true,
    recipientApproved: true,
    nonce: "1",
  },
  {
    id: "req-002",
    invoice: "INV-1043",
    vendor: "Orbit Data",
    description: "Additional data processing",
    amount: "8",
    evidence: "Delivery record DEMO-1043 matches the purchase order.",
    verified: true,
    recipientApproved: true,
    nonce: "2",
  },
  {
    id: "req-003",
    invoice: "INV-1042",
    vendor: "Orbit Data",
    description: "Repeated submission of INV-1042",
    amount: "3",
    evidence: "Same supplier and invoice as the first request.",
    verified: true,
    recipientApproved: true,
    nonce: "3",
  },
];
export type Decision = {
  requestId: string;
  action: "pay" | "hold";
  title: string;
  reasons: string[];
  amount: string;
};
export type Proof = { kind: string; hash: string; amount?: string };
export type Snapshot = {
  configured: boolean;
  live: boolean;
  error?: string;
  deviceHash?: string;
  owner?: string;
  agent?: string;
  merchant?: string;
  balance?: string;
  pending?: string;
  cap?: string;
  expiresAt?: string | null;
  proofs: Proof[];
  veloConfigured: boolean;
  contracts: typeof CONTRACTS;
};

import type { Decision, RequestItem } from "@demopay/shared";
export function stroops(input: string): bigint {
  if (!/^(0|[1-9]\d{0,9})(\.\d{1,7})?$/.test(input))
    throw new Error("Invalid XLM amount");
  const [whole, frac = ""] = input.split(".");
  return BigInt(whole) * 10000000n + BigInt(frac.padEnd(7, "0"));
}
export function decide(
  item: RequestItem,
  batch: RequestItem[],
  context: {
    cap: bigint;
    balance: bigint;
    active: boolean;
    alreadyPaid: boolean;
  },
): Decision {
  const reasons: string[] = [];
  const first = batch.find(
    (x) => x.vendor === item.vendor && x.invoice === item.invoice,
  );
  const amount = stroops(item.amount);
  if (first?.id !== item.id)
    reasons.push("A request with this supplier and invoice already exists.");
  if (context.alreadyPaid)
    reasons.push("This request has already been authorized on Testnet.");
  if (!item.verified) reasons.push("Delivery evidence needs human review.");
  if (!item.recipientApproved)
    reasons.push("The recipient is not on the approved supplier list.");
  if (!context.active)
    reasons.push("The agent has no active spending permission.");
  if (amount <= 0n) reasons.push("Payment amount must be positive.");
  if (context.cap !== 0n && amount > context.cap)
    reasons.push("The amount exceeds the permitted limit per payment.");
  if (amount > context.balance)
    reasons.push("The escrow budget is insufficient.");
  if (reasons.length)
    return {
      requestId: item.id,
      action: "hold",
      title: "Hold for review",
      reasons,
      amount: item.amount,
    };
  return {
    requestId: item.id,
    action: "pay",
    title: "Eligible for payment",
    reasons: [
      "Approved supplier and matching delivery record.",
      "No duplicate invoice in this request batch.",
      "Within the active spending policy and escrow budget.",
    ],
    amount: item.amount,
  };
}

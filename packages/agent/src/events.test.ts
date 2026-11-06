import { test } from "node:test";
import assert from "node:assert/strict";
import { Contract, nativeToScVal, type rpc } from "@stellar/stellar-sdk";
import { CONTRACTS } from "@demopay/shared";
import { decodeCurrentEvent } from "./events.ts";
const event = {
  type: "contract",
  contractId: new Contract(CONTRACTS.paymentEscrow),
  topic: [
    nativeToScVal("fund", { type: "symbol" }),
    nativeToScVal(Buffer.alloc(32, 1), { type: "bytes" }),
  ],
  value: nativeToScVal(30000000n, { type: "i128" }),
  id: "event",
  ledger: 1,
  ledgerClosedAt: "2026-11-07T00:00:00Z",
  txHash: "a".repeat(64),
  operationIndex: 0,
  transactionIndex: 0,
} as rpc.Api.EventResponse;
test("decodes RPC v30 contract events missing the removed success flag through Noir SDK", () => {
  const result = decodeCurrentEvent(event, CONTRACTS);
  assert.equal(result?.type, "escrow.funded");
  assert.equal(result && "amount" in result ? result.amount : 0n, 30000000n);
});
test("does not reinterpret an explicitly failed or diagnostic event as successful", () => {
  assert.equal(
    decodeCurrentEvent(
      { ...event, inSuccessfulContractCall: false },
      CONTRACTS,
    ),
    null,
  );
  assert.equal(
    decodeCurrentEvent(
      { ...event, type: "diagnostic" as rpc.Api.EventResponse["type"] },
      CONTRACTS,
    ),
    null,
  );
});

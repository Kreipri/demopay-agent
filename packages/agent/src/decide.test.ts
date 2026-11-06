import { test } from "node:test";
import assert from "node:assert/strict";
import { decide, stroops } from "./decide.ts";
import { REQUESTS } from "@demopay/shared";
const context = {
  cap: 50000000n,
  balance: 200000000n,
  active: true,
  alreadyPaid: false,
};
test("pays only the eligible invoice, holding over-cap and duplicate requests", () => {
  assert.deepEqual(
    REQUESTS.map((r) => decide(r, REQUESTS, context).action),
    ["pay", "hold", "hold"],
  );
});
test("already-paid, insufficient balance and revoked policy each stop payment", () => {
  for (const patch of [
    { alreadyPaid: true },
    { balance: 10000000n },
    { active: false },
  ])
    assert.equal(
      decide(REQUESTS[0], REQUESTS, { ...context, ...patch }).action,
      "hold",
    );
});
test("evidence and recipient approval are required independently", () => {
  for (const patch of [{ verified: false }, { recipientApproved: false }])
    assert.equal(
      decide(
        { ...REQUESTS[0], ...patch },
        [{ ...REQUESTS[0], ...patch }],
        context,
      ).action,
      "hold",
    );
});
test("amount parser preserves stroop precision and rejects ambiguous numeric inputs", () => {
  assert.equal(stroops("0.0000001"), 1n);
  assert.equal(stroops("3.1234567"), 31234567n);
  for (const bad of [
    "-1",
    "1e3",
    "1.00000001",
    "NaN",
    "Infinity",
    "03",
    " 3",
    "3.",
  ])
    assert.throws(() => stroops(bad));
});
test("zero means uncapped in Noir policy, not a zero allowance", () => {
  assert.equal(
    decide(REQUESTS[1], REQUESTS, { ...context, cap: 0n }).action,
    "pay",
  );
});

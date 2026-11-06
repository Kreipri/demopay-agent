import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyVeloWebhook } from "./velo.ts";
test("Velo SDK accepts a signed event and rejects tampered or stale deliveries", async () => {
  const before = process.env.VELO_WEBHOOK_SECRET;
  process.env.VELO_WEBHOOK_SECRET = "test-only-signing-secret";
  const payload = JSON.stringify({
    id: "evt_test",
    version: "1",
    type: "payment.succeeded",
    test: true,
    sentAt: new Date().toISOString(),
    project: {
      id: "demo",
      registryProjectId: "demo",
      name: "DemoPay",
      slug: "demopay",
    },
    paymentIntent: {
      id: "pi_demo",
      amount: "10",
      asset: "native",
      merchantName: "DemoPay",
      status: "paid",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });
  const signature = (t: number) =>
    `t=${t},v1=${createHmac("sha256", process.env.VELO_WEBHOOK_SECRET!).update(`${t}.${payload}`).digest("hex")}`;
  try {
    const now = Math.floor(Date.now() / 1000);
    assert.equal(
      (await verifyVeloWebhook(payload, signature(now))).id,
      "evt_test",
    );
    await assert.rejects(() =>
      verifyVeloWebhook(payload.replace('"10"', '"100"'), signature(now)),
    );
    await assert.rejects(() =>
      verifyVeloWebhook(payload, signature(now - 600)),
    );
  } finally {
    if (before === undefined) delete process.env.VELO_WEBHOOK_SECRET;
    else process.env.VELO_WEBHOOK_SECRET = before;
  }
});

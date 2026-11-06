import { Velo } from "@carts1024/velo-sdk";
export function veloClient() {
  if (!process.env.VELO_API_KEY)
    throw new Error("Velo API key is not configured.");
  return new Velo({
    apiKey: process.env.VELO_API_KEY,
    environment: "testnet",
    baseUrl: "https://www.velo-build.dev",
    timeoutMs: 10000,
    maxRetries: 0,
  });
}
// Contribution checkout is separate from Noir escrow. The operator must fund
// Noir explicitly. A checkout webhook never marks a Noir payout as collected.
export async function createContribution() {
  const origin = new URL(process.env.APP_URL ?? "http://localhost:5173").origin;
  return veloClient().checkout.sessions.create({
    amount: "10.00",
    asset: "native",
    description:
      "DemoPay — Testnet team budget contribution (separate from Noir escrow)",
    successUrl: `${origin}/?checkout=success`,
    cancelUrl: `${origin}/?checkout=cancelled`,
  });
}
export async function verifyVeloWebhook(rawBody: string, signature: string) {
  if (!process.env.VELO_WEBHOOK_SECRET)
    throw new Error("Webhook verification is not configured.");
  return Velo.webhooks.verify({
    payload: rawBody,
    signature,
    secret: process.env.VELO_WEBHOOK_SECRET,
  });
}

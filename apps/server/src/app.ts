import express from "express";
import { rateLimit } from "express-rate-limit";
import { snapshot, review, runAgent, claim } from "@demopay/agent";
import { REQUESTS, CONTRACTS } from "@demopay/shared";
import { authorized } from "./auth.ts";
import { createContribution, veloClient, verifyVeloWebhook } from "./velo.ts";
export const app = express();
app.disable("x-powered-by");
if (process.env.VERCEL) app.set("trust proxy", 1);
app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});
app.post(
  "/api/webhooks/velo",
  express.raw({ type: "application/json", limit: "64kb" }),
  async (req, res) => {
    try {
      const signature = req.get("x-velo-signature");
      if (!signature) {
        res.status(400).json({ error: "Missing signature" });
        return;
      }
      await verifyVeloWebhook(req.body.toString("utf8"), signature);
      // No money-moving side effect. Duplicate verified deliveries are harmless.
      res.status(200).json({ received: true });
    } catch {
      res
        .status(400)
        .json({ error: "Webhook signature could not be verified." });
    }
  },
);
app.use(express.json({ limit: "4kb" }));
const writes = rateLimit({
  windowMs: 60000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
function operator(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  if (!authorized(req.get("authorization"))) {
    res
      .status(401)
      .json({ error: "Enter the operator token to run Testnet payments." });
    return;
  }
  next();
}
app.get("/api/health", (_req, res) =>
  res.json({
    ok: true,
    network: "testnet",
    agent: "rule-based",
    velo: !!process.env.VELO_API_KEY,
  }),
);
app.get("/api/state", async (_req, res) => {
  try {
    res.json({ requests: REQUESTS, snapshot: await snapshot() });
  } catch {
    res
      .status(503)
      .json({
        requests: REQUESTS,
        snapshot: {
          configured: true,
          live: false,
          proofs: [],
          veloConfigured: !!process.env.VELO_API_KEY,
          contracts: CONTRACTS,
          error:
            "Cannot verify Testnet state right now. No payment has been inferred from this error.",
        },
      });
  }
});
app.post("/api/agent/review", async (_req, res) => {
  try {
    res.json(await review());
  } catch {
    res
      .status(503)
      .json({
        error:
          "Unable to read the live policy. Agent review stopped; no payment was sent.",
      });
  }
});
app.post("/api/agent/run", writes, operator, async (req, res) => {
  if (typeof req.body?.requestId !== "string") {
    res.status(400).json({ error: "Choose a payment request." });
    return;
  }
  try {
    res.json(await runAgent(req.body.requestId));
  } catch {
    res
      .status(409)
      .json({
        error:
          "Payment was refused, is already authorized, or has an uncertain result. Refresh the payment trail before retrying. Never create a replacement invoice to bypass a refusal.",
      });
  }
});
app.post("/api/merchant/claim", writes, operator, async (_req, res) => {
  try {
    res.json(await claim());
  } catch {
    res
      .status(409)
      .json({
        error:
          "Collection could not be confirmed. Refresh the ledger trail before trying again.",
      });
  }
});
app.post("/api/velo/checkout", writes, operator, async (_req, res) => {
  try {
    res.json(await createContribution());
  } catch {
    res
      .status(503)
      .json({
        error:
          "Velo checkout is unavailable. Check the Testnet API key and Velo Pay activation. No checkout completion has been assumed.",
      });
  }
});
app.get("/api/velo/intents/:id", operator, async (req, res) => {
  const id = String(req.params.id);
  if (!/^[a-zA-Z0-9_-]{1,150}$/.test(id)) {
    res.status(400).json({ error: "Invalid payment ID" });
    return;
  }
  try {
    res.json(await veloClient().paymentIntents.retrieve(id));
  } catch {
    res
      .status(503)
      .json({ error: "Could not verify the Velo payment status." });
  }
});
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    res.status(400).json({ error: "Request could not be processed." });
  },
);

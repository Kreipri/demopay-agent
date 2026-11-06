import {
  NoirAgentClient,
  keypairSigner,
  toStroops,
  fromStroops,
  type NoirEvent,
} from "@noirx402/agent-sdk";
import { Asset, Networks, Keypair } from "@stellar/stellar-sdk";
import {
  CONTRACTS,
  REQUESTS,
  type Proof,
  type Snapshot,
} from "@demopay/shared";
import { decide } from "./decide.ts";
import { decodeCurrentEvent } from "./events.ts";
export { decide, stroops } from "./decide.ts";
export const asset = Asset.native().contractId(Networks.TESTNET);
export const noir = new NoirAgentClient({
  network: {
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: Networks.TESTNET,
    contracts: CONTRACTS,
  },
});
export function configuration() {
  const {
    DEVICE_HASH,
    AGENT_SECRET,
    MERCHANT_SECRET,
    OWNER_SECRET,
    SETUP_LEDGER,
  } = process.env;
  if (
    !DEVICE_HASH ||
    !AGENT_SECRET ||
    !MERCHANT_SECRET ||
    !OWNER_SECRET ||
    !SETUP_LEDGER
  )
    return null;
  if (!/^[a-f0-9]{64}$/i.test(DEVICE_HASH))
    throw new Error("Invalid device configuration");
  return {
    deviceHash: DEVICE_HASH,
    agent: keypairSigner(AGENT_SECRET),
    merchant: keypairSigner(MERCHANT_SECRET),
    owner: Keypair.fromSecret(OWNER_SECRET).publicKey(),
    startLedger: Number(SETUP_LEDGER),
  };
}
// The public sandbox has exactly one payable invoice per unique device. Its
// immutable nonce is the durable replay gate, including after claims/restarts.
// This is intentionally not a general-purpose invoice ledger.
export async function paymentProofs(
  c: NonNullable<ReturnType<typeof configuration>>,
): Promise<Proof[]> {
  const events: NoirEvent[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 20; page++) {
    const filters = [
      { type: "contract" as const, contractIds: Object.values(noir.contracts) },
    ];
    const result = await noir.server.getEvents(
      cursor
        ? { filters, cursor, limit: 200 }
        : { filters, startLedger: c.startLedger, limit: 200 },
    );
    events.push(
      ...result.events
        .map((e) => decodeCurrentEvent(e, noir.contracts))
        .filter((e): e is NoirEvent => e !== null),
    );
    if (!result.events.length || !result.cursor || result.cursor === cursor)
      break;
    cursor = result.cursor;
    if (page === 19)
      throw new Error("Evidence window requires manual reconciliation");
  }
  const proofs = events
    .filter(
      (e) =>
        ("deviceHash" in e && e.deviceHash === c.deviceHash) ||
        ("merchant" in e && e.merchant === c.merchant.publicKey),
    )
    .map((e) => ({
      kind: e.type,
      hash: e.txHash,
      ...("amount" in e ? { amount: fromStroops(e.amount) } : {}),
    }))
    .filter(
      (e, i, list) =>
        list.findIndex((x) => x.kind === e.kind && x.hash === e.hash) === i,
    );
  await Promise.all(
    [...new Set(proofs.map((p) => p.hash))].map(async (hash) => {
      const receipt = await noir.server.getTransaction(hash);
      if (receipt.status !== "SUCCESS")
        throw new Error("Event receipt not confirmed");
    }),
  );
  return proofs;
}
export async function snapshot(): Promise<Snapshot> {
  const c = configuration();
  const base = {
    configured: !!c,
    live: false,
    proofs: [],
    veloConfigured: !!process.env.VELO_API_KEY,
    contracts: CONTRACTS,
  };
  if (!c) return base;
  const [policy, balance, pending, proofs] = await Promise.all([
    noir.getPolicy(c.deviceHash),
    noir.getEscrowBalance(c.deviceHash),
    noir.getPendingBalance(c.merchant.publicKey),
    paymentProofs(c),
  ]);
  return {
    ...base,
    live: true,
    deviceHash: c.deviceHash,
    owner: c.owner,
    agent: c.agent.publicKey,
    merchant: c.merchant.publicKey,
    balance: fromStroops(balance),
    pending: fromStroops(pending),
    cap: policy ? fromStroops(policy.maxAmount) : "0",
    expiresAt: policy?.expiresAt?.toISOString() ?? null,
    proofs,
  };
}
export async function review() {
  const c = configuration();
  if (!c)
    return {
      mode: "preview",
      decisions: REQUESTS.map((item) =>
        decide(item, REQUESTS, {
          cap: toStroops("5"),
          balance: toStroops("20"),
          active: true,
          alreadyPaid: false,
        }),
      ),
    };
  const [policy, balance, proofs] = await Promise.all([
    noir.getPolicy(c.deviceHash),
    noir.getEscrowBalance(c.deviceHash),
    paymentProofs(c),
  ]);
  const active =
    !!policy &&
    policy.agent === c.agent.publicKey &&
    policy.asset === asset &&
    (!policy.expiresAt || policy.expiresAt.getTime() > Date.now());
  return {
    mode: "testnet",
    decisions: REQUESTS.map((item) =>
      decide(item, REQUESTS, {
        cap: policy?.maxAmount ?? 0n,
        balance,
        active,
        alreadyPaid:
          item.id === "req-001" &&
          proofs.some((p) => p.kind === "payment.authorized"),
      }),
    ),
  };
}
let busy = false;
export async function runAgent(requestId: string) {
  if (busy)
    throw new Error(
      "An agent run is already in progress. Refresh its outcome before retrying.",
    );
  const c = configuration();
  if (!c) throw new Error("Testnet sandbox is not configured.");
  const item = REQUESTS.find((x) => x.id === requestId);
  if (!item) throw new Error("Unknown request");
  busy = true;
  try {
    const evaluation = await review();
    const decision = evaluation.decisions.find(
      (x) => x.requestId === requestId,
    )!;
    if (decision.action !== "pay") return { decision, hash: null };
    const check = await noir.checkPayment({
      deviceHash: c.deviceHash,
      agent: c.agent.publicKey,
      asset,
      amount: toStroops(item.amount),
    });
    if (!check.ok) throw new Error(`Noir refused payment: ${check.reason}`);
    const { hash } = await noir.authorizePayment({
      agent: c.agent,
      deviceHash: c.deviceHash,
      merchant: c.merchant.publicKey,
      asset,
      amount: toStroops(item.amount),
      nonce: BigInt(item.nonce),
    });
    return { decision, hash };
  } finally {
    busy = false;
  }
}
export async function claim() {
  const c = configuration();
  if (!c) throw new Error("Testnet sandbox is not configured.");
  if ((await noir.getPendingBalance(c.merchant.publicKey)) <= 0n)
    throw new Error("Nothing to collect.");
  return noir.claim({ merchant: c.merchant, token: asset });
}

import { randomBytes, createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { Keypair } from "@stellar/stellar-sdk";
import { keypairSigner, toStroops } from "@noirx402/agent-sdk";
import { noir, asset } from "@demopay/agent";
// Creates only dedicated demo wallets and moves valueless Testnet XLM.
if (!process.argv.includes("--execute")) {
  console.log(
    "Run npm run setup:testnet -- --execute to create/fund dedicated Testnet wallets and initialize Noir. Secrets are saved only in .env; never printed.",
  );
  process.exit(0);
}
let env = existsSync(".env") ? readFileSync(".env", "utf8") : "";
function existing(key: string) {
  return process.env[key] || env.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1];
}
function put(key: string, value: string) {
  process.env[key] = value;
  const regex = new RegExp(`^${key}=.*$`, "m");
  env = regex.test(env)
    ? env.replace(regex, `${key}=${value}`)
    : `${env.trimEnd()}\n${key}=${value}\n`;
  writeFileSync(".env", env.trimStart(), { mode: 0o600 });
}
for (const role of ["OWNER", "AGENT", "MERCHANT"])
  if (!existing(`${role}_SECRET`))
    put(`${role}_SECRET`, Keypair.random().secret());
if (!existing("DEVICE_HASH"))
  put(
    "DEVICE_HASH",
    createHash("sha256")
      .update(`demopay:${randomBytes(24).toString("hex")}`)
      .digest("hex"),
  );
if (!existing("ADMIN_TOKEN"))
  put("ADMIN_TOKEN", randomBytes(32).toString("base64url"));
if (!existing("APP_URL")) put("APP_URL", "http://localhost:5173");
const owner = keypairSigner(existing("OWNER_SECRET")!),
  agent = keypairSigner(existing("AGENT_SECRET")!),
  merchant = keypairSigner(existing("MERCHANT_SECRET")!);
const deviceHash = existing("DEVICE_HASH")!;
for (const signer of [owner, agent, merchant]) {
  const account = await fetch(
    `https://horizon-testnet.stellar.org/accounts/${signer.publicKey}`,
    { signal: AbortSignal.timeout(20000) },
  );
  if (account.status === 404) {
    const funded = await fetch(
      `https://friendbot.stellar.org/?addr=${signer.publicKey}`,
      { signal: AbortSignal.timeout(90000) },
    );
    if (!funded.ok)
      throw new Error(
        "Friendbot could not fund a demo account. Retry setup; saved keys will be reused.",
      );
  } else if (!account.ok)
    throw new Error("Could not verify account funding; setup stopped.");
}
if (!existing("SETUP_LEDGER"))
  put("SETUP_LEDGER", String((await noir.server.getLatestLedger()).sequence));
const hashes: { kind: string; hash: string }[] = [];
console.log(
  "Dedicated Testnet wallets funded. Checking the handbook contracts…",
);
if (!(await noir.getDeviceOwner(deviceHash)))
  hashes.push({
    kind: "device.registered",
    ...(await noir.execute(owner, {
      kind: "registerDevice",
      deviceHash,
      agent: agent.publicKey,
    })),
  });
if (!(await noir.getPolicy(deviceHash)))
  hashes.push({
    kind: "agent.registered",
    ...(await noir.execute(owner, {
      kind: "registerAgent",
      deviceHash,
      agent: agent.publicKey,
      asset,
      maxAmount: toStroops("5"),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })),
  });
if ((await noir.getEscrowBalance(deviceHash)) === 0n)
  hashes.push({
    kind: "escrow.funded",
    ...(await noir.execute(owner, {
      kind: "fundEscrow",
      deviceHash,
      token: asset,
      amount: toStroops("20"),
    })),
  });
mkdirSync("docs", { recursive: true });
writeFileSync(
  "docs/testnet-setup.json",
  JSON.stringify(
    {
      network: "testnet",
      deviceHash,
      owner: owner.publicKey,
      agent: agent.publicKey,
      merchant: merchant.publicKey,
      startLedger: Number(existing("SETUP_LEDGER")),
      transactions: hashes,
    },
    null,
    2,
  ),
);
console.log(
  "Noir sandbox ready. Public setup evidence saved to docs/testnet-setup.json. Read the operator token privately from .env.",
);

import { writeFileSync } from "node:fs";
import { runAgent, claim, snapshot } from "@demopay/agent";
if (!process.argv.includes("--execute")) {
  console.log(
    "Use --execute to run the agent on the one eligible sandbox invoice and collect its Testnet payment.",
  );
  process.exit(0);
}
const authorization = await runAgent("req-001");
if (!authorization.hash)
  throw new Error(
    "The invoice is held or was already paid. Inspect the existing evidence instead of resetting its nonce.",
  );
const collection = await claim();
writeFileSync(
  "docs/testnet-proof.json",
  JSON.stringify(
    {
      network: "testnet",
      authorization: authorization.hash,
      collection: collection.hash,
      snapshot: await snapshot(),
    },
    null,
    2,
  ),
);
console.log(
  "Confirmed agent authorization and merchant collection. Public evidence saved to docs/testnet-proof.json.",
);

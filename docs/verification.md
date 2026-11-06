# Verification

- TypeScript build and production frontend build passed during implementation.
- Rule tests cover eligible payments, duplicate invoices, over-limit requests, insufficient balance, expired/revoked permission, unverified evidence, unapproved recipients and exact stroop parsing.
- Dedicated Testnet wallet funding and SDK owner setup succeeded against the handbook's contract IDs.
- The agent authorized 3 XLM and the merchant collected it. See testnet-proof.json.
- Browser checks cover navigation, three contract explorer links, operator modal, desktop/mobile overflow and uncaught browser errors.
- Live Velo checkout creation and SDK status retrieval succeeded with the builder's private Testnet API key. Evidence: [velo-checkout-proof.json](velo-checkout-proof.json). The intent was `created` when checked; this is not a claim of completed payment. Hosted checkout completion and a delivered Velo webhook are still pending.
- Public repository: https://github.com/Kreipri/demopay-agent
- Initial GitHub CI passed: https://github.com/Kreipri/demopay-agent/actions/runs/42306371335
- Nine automated checks passed, including Velo signature tampering/staleness rejection and the RPC v30 event-decoding regression. Desktop/mobile browser checks passed after the evidence fix.
- Public Vercel deployment: https://demopay-agent.vercel.app
- Logged-out desktop/mobile browser checks passed against the production URL. Production Vercel login protection was disabled as required for public judging; operator actions remain token-protected.
- Production /api/health and /api/state passed. The live escrow balance was 17 XLM, pending collection was 0, and five confirmed transaction proofs were displayed.
- Production Velo checkout creation and payment-status retrieval passed. The checkout return URL points to the public app. The recorded contribution is created, not paid.
- Production access checks passed: unauthenticated payment requests return 401 and unsigned webhook deliveries return 400. Valid webhook signature verification is unit-tested; configuring a live Velo webhook signing secret is still pending.
- Retrying the already-paid invoice through the deployed agent returned a hold decision and no transaction hash. No second payment was made.
- The API is bundled from the monorepo TypeScript sources by scripts/build-api.mjs before deployment to avoid missing workspace modules in the serverless runtime.

## Event decoder compatibility

The live RPC omits `inSuccessfulContractCall`, which Noir SDK 0.3.0 still requires. The application normalizes contract events before passing them to the SDK's decoder and independently verifies each relevant transaction receipt. See packages/agent/src/events.ts. Upstream removal: https://github.com/stellar/stellar-rpc/releases/tag/v30.0.0

## Bounded demo behavior

This sandbox supports exactly one payable invoice per device identity. Its fixed nonce enforces replay protection on-chain even if the application loses local memory. The remaining invoices are hold examples. It is not a reusable enterprise invoice system.

RPC event evidence is limited to the provider's retention window. If evidence cannot be read, payment review stops. Contract enforcement remains authoritative. No transaction is labeled successful merely because a request was submitted.

Operator request limits are per process on a serverless host, not a globally durable abuse-prevention mechanism. The operator token and contract nonce provide the critical restrictions for this single-case Testnet demo.

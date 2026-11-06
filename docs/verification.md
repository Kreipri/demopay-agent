# Verification

- TypeScript build and production frontend build passed during implementation.
- Rule tests cover eligible payments, duplicate invoices, over-limit requests, insufficient balance, expired/revoked permission, unverified evidence, unapproved recipients and exact stroop parsing.
- Dedicated Testnet wallet funding and SDK owner setup succeeded against the handbook's contract IDs.
- The agent authorized 3 XLM and the merchant collected it. See testnet-proof.json.
- Browser checks cover navigation, three contract explorer links, operator modal, desktop/mobile overflow and uncaught browser errors.
- Live Velo checkout/status/webhook delivery awaits private project credentials. A missing key is not counted as a completed Velo integration.
- GitHub publication and Vercel deployment status will be updated after publication.

## Bounded demo behavior

This sandbox supports exactly one payable invoice per device identity. Its fixed nonce enforces replay protection on-chain even if the application loses local memory. The remaining invoices are hold examples. It is not a reusable enterprise invoice system.

RPC event evidence is limited to the provider's retention window. If evidence cannot be read, payment review stops. Contract enforcement remains authoritative. No transaction is labeled successful merely because a request was submitted.

Operator request limits are per process on a serverless host, not a globally durable abuse-prevention mechanism. The operator token and contract nonce provide the critical restrictions for this single-case Testnet demo.

import {
  decodeEvent,
  type NoirEvent,
  type NoirContracts,
} from "@noirx402/agent-sdk";
import type { rpc } from "@stellar/stellar-sdk";
// RPC v30 removed this legacy flag; Noir 0.3.0's decoder still requires it.
// Normalize only contract events, then use Noir's own decoder. Callers verify
// the transaction's SUCCESS receipt before exposing an event as proof.
// https://github.com/stellar/stellar-rpc/releases/tag/v30.0.0
export function decodeCurrentEvent(
  event: rpc.Api.EventResponse,
  contracts: NoirContracts,
): NoirEvent | null {
  if (event.type !== "contract") return null;
  return decodeEvent(
    {
      ...event,
      inSuccessfulContractCall: event.inSuccessfulContractCall ?? true,
    },
    contracts,
  );
}

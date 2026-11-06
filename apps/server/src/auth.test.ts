import { test } from "node:test";
import assert from "node:assert/strict";
import { authorized } from "./auth.ts";
test("operator access fails closed, including missing server configuration", () => {
  assert.equal(authorized(undefined, "token"), false);
  assert.equal(authorized("Bearer wrong", "token"), false);
  assert.equal(authorized("token", "token"), false);
  assert.equal(authorized("Bearer token", ""), false);
  assert.equal(authorized("Bearer token", "token"), true);
});

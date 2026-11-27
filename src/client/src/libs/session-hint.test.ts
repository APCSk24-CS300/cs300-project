import { afterEach, describe, expect, it } from "vitest";
import {
  SESSION_HINT_COOKIE,
  clearHint,
  encodeHint,
  parseHint,
  readHint,
  writeHint,
} from "@/libs/session-hint";

const now = () => Math.floor(Date.now() / 1000);

describe("session hint", () => {
  afterEach(() => clearHint());

  it("round-trips through the cookie without any token", () => {
    const hint = { role: "manager" as const, mustChangePassword: true, exp: now() + 600 };
    writeHint(hint);
    expect(document.cookie).toContain(`${SESSION_HINT_COOKIE}=`);
    expect(readHint()).toEqual(hint);
  });

  it("rejects invalid JSON, unknown roles and expired hints", () => {
    expect(parseHint("%%%")).toBeNull();
    expect(parseHint(encodeHint({ role: "admin" as never, mustChangePassword: false, exp: now() + 60 }))).toBeNull();
    expect(parseHint(encodeHint({ role: "student", mustChangePassword: false, exp: now() - 1 }))).toBeNull();
    expect(parseHint(undefined)).toBeNull();
  });

  it("clears the cookie", () => {
    writeHint({ role: "student", mustChangePassword: false, exp: now() + 600 });
    clearHint();
    expect(readHint()).toBeNull();
  });
});

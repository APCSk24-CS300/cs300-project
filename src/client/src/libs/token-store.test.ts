import { afterEach, describe, expect, it, vi } from "vitest";
import { UnsecuredJWT } from "jose";
import {
  TOKEN_STORAGE_KEY,
  clearToken,
  getToken,
  getTokenExp,
  setToken,
  subscribeToken,
} from "@/libs/token-store";

function makeToken(expOffsetSeconds: number): string {
  return new UnsecuredJWT({ sub: "u1" })
    .setExpirationTime(Math.floor(Date.now() / 1000) + expOffsetSeconds)
    .encode();
}

describe("token store", () => {
  afterEach(() => {
    clearToken();
  });

  it("keeps the token in localStorage, never in a cookie", () => {
    const token = makeToken(3600);
    setToken(token);
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBe(token);
    expect(document.cookie).not.toContain(token);
    expect(getToken()).toBe(token);
    expect(getTokenExp()).toBeGreaterThan(Date.now() / 1000);
  });

  it("drops an expired or unreadable token", () => {
    setToken(makeToken(-10));
    expect(getToken()).toBeNull();
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();

    setToken("not-a-jwt");
    expect(getToken()).toBeNull();
  });

  it("notifies when another tab removes the token", () => {
    const callback = vi.fn();
    const unsubscribe = subscribeToken(callback);
    window.dispatchEvent(new StorageEvent("storage", { key: TOKEN_STORAGE_KEY, newValue: null }));
    window.dispatchEvent(new StorageEvent("storage", { key: "other", newValue: "x" }));
    unsubscribe();
    window.dispatchEvent(new StorageEvent("storage", { key: TOKEN_STORAGE_KEY, newValue: null }));
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(null);
  });
});

"use client";

import { useCallback, useState } from "react";
import { isApiError } from "@/libs/api-client";

/**
 * Shared 403 handling (FR-021, constitution C-II). Wiring rule (analysis M7):
 * - read hooks use `isForbiddenError` and return `status: 'forbidden'`;
 * - components that run mutations own `useForbidden()` and call `handleError` in their catch.
 * Hooks never call `useForbidden()` internally.
 */
export function isForbiddenError(error: unknown): boolean {
  return isApiError(error) && error.code === "FORBIDDEN";
}

export function useForbidden() {
  const [isForbidden, setIsForbidden] = useState(false);
  const handleError = useCallback((error: unknown): boolean => {
    if (isForbiddenError(error)) {
      setIsForbidden(true);
      return true;
    }
    return false;
  }, []);
  return { isForbidden, handleError };
}

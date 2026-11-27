import { adminUserHandlers } from "@/mocks/handlers/admin-users";
import { authHandlers } from "@/mocks/handlers/auth";
import { profileHandlers } from "@/mocks/handlers/profile";
import { referenceHandlers } from "@/mocks/handlers/reference";

/** One handler set for the browser worker (mock mode) and Vitest (msw/node). */
export const handlers = [
  ...authHandlers,
  ...profileHandlers,
  ...adminUserHandlers,
  ...referenceHandlers,
];

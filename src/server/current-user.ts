import { ENV } from "./env";

/**
 * Temporary helper until auth is wired: always returns the demo user.
 * Later we can inspect session/cookies and fall back to this ID.
 */
export function getCurrentUserId() {
  return ENV.DEMO_USER_ID;
}

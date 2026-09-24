/**
 * Minimum password length. Must match MIN_PASSWORD_LENGTH in the backend
 * (aksindia-_backend-/src/config/constants.ts) — the two previously disagreed,
 * so the API accepted passwords the registration forms rejected.
 */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Store login ID (User ID). Must match USERNAME_RE in the backend
 * (aksindia-_backend-/src/config/constants.ts). No '@', so the login form can
 * tell a User ID from an email.
 */
export const USERNAME_RE = /^[a-z0-9._-]{3,32}$/i;

import { verifyPortalPasswordHash } from "@/lib/auth/password-hash";

/** Accepts staff portal password using stored hash, plaintext, or employee-ID default. */
export function staffPortalPasswordAccepted(params: {
  entered: string;
  profilePassword: string;
  profilePasswordHash: string;
  usernameOrEmployeeId?: string;
}): boolean {
  const password = String(params.entered ?? "").trim();
  if (!password) return false;

  // Prefer hash when present, but still fall through to plaintext / employee-id
  // default so a stale hash cannot permanently lock a valid portal password.
  if (params.profilePasswordHash) {
    if (
      verifyPortalPasswordHash(password, params.profilePasswordHash) ||
      verifyPortalPasswordHash(password.replace(/\s+/g, ""), params.profilePasswordHash)
    ) {
      return true;
    }
  }

  const candidates = new Set<string>();
  const add = (value: string) => {
    const text = String(value ?? "").trim();
    if (!text) return;
    candidates.add(text);
    candidates.add(text.toLowerCase());
    const compact = text.replace(/\s+/g, "");
    if (compact) {
      candidates.add(compact);
      candidates.add(compact.toLowerCase());
    }
  };

  if (params.profilePassword) {
    add(params.profilePassword);
  } else {
    add(String(params.usernameOrEmployeeId ?? ""));
  }

  return (
    candidates.has(password) ||
    candidates.has(password.toLowerCase()) ||
    candidates.has(password.replace(/\s+/g, "")) ||
    candidates.has(password.replace(/\s+/g, "").toLowerCase())
  );
}

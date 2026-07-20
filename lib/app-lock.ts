"use client";

// Device app lock (banking-app pattern): the member gates THIS device's UI
// behind the platform biometric (WebAuthn: fingerprint / Face ID) with a
// 6-digit PIN as the alternative path. Settings live on the device only —
// the lock protects the screen, the account itself stays protected by the
// real session and MFA.
const CONFIG_KEY = "b2bb2g:app-lock";
const UNLOCK_KEY = "b2bb2g:app-unlocked";
/** Re-lock when the app was backgrounded longer than this. */
export const RELOCK_AFTER_MS = 10 * 60 * 1000;

export type AppLockConfig = {
  enabled: boolean;
  credentialId: string | null;
  pinHash: string;
  pinSalt: string;
};

export function readAppLock(): AppLockConfig | null {
  try {
    const raw = window.localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppLockConfig;
    return parsed && parsed.enabled && parsed.pinHash ? parsed : null;
  } catch {
    return null;
  }
}

export function writeAppLock(config: AppLockConfig | null) {
  try {
    if (config) {
      window.localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } else {
      window.localStorage.removeItem(CONFIG_KEY);
    }
  } catch {
    // Device storage is best-effort only.
  }
}

export function isUnlockedThisSession(): boolean {
  try {
    return window.sessionStorage.getItem(UNLOCK_KEY) === "1";
  } catch {
    return true;
  }
}

export function markUnlocked() {
  try {
    window.sessionStorage.setItem(UNLOCK_KEY, "1");
  } catch {
    // Best-effort only.
  }
}

export function markLocked() {
  try {
    window.sessionStorage.removeItem(UNLOCK_KEY);
  } catch {
    // Best-effort only.
  }
}

export async function biometricAvailable(): Promise<boolean> {
  try {
    return (
      typeof window !== "undefined" &&
      !!window.PublicKeyCredential &&
      (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
    );
  } catch {
    return false;
  }
}

function toBase64(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const raw = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(length));
  window.crypto.getRandomValues(bytes);
  return bytes;
}

/** Registers a platform credential used purely as a local unlock check. */
export async function enrollBiometric(label: string): Promise<string | null> {
  try {
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: randomBytes(32),
        rp: { name: "B2BB2G", id: window.location.hostname },
        user: {
          id: randomBytes(16),
          name: label,
          displayName: label,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: {
          // Keep the credential bound to THIS device: a non-discoverable
          // ("discouraged") platform credential is verified with the device
          // biometric locally and is not saved/synced as a passkey to a Google
          // (or other cloud) account. There is no web API to read the sensor
          // directly, so the OS still shows the biometric prompt.
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "discouraged",
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;
    if (!credential) return null;
    return toBase64(credential.rawId);
  } catch {
    return null;
  }
}

/** Asks the platform to verify the user against the enrolled credential. */
export async function verifyBiometric(credentialId: string): Promise<boolean> {
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomBytes(32),
        allowCredentials: [
          {
            type: "public-key",
            id: fromBase64(credentialId),
            transports: ["internal"],
          },
        ],
        userVerification: "required",
        timeout: 60000,
      },
    });
    return !!assertion;
  } catch {
    return false;
  }
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${pin}:${salt}`);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return toBase64(digest);
}

export function newSalt(): string {
  return toBase64(randomBytes(16).buffer);
}

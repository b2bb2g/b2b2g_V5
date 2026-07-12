import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { TRUSTED_DEVICE_COOKIE } from "@/lib/constants";

const pepper =
  process.env.SECURITY_HASH_PEPPER ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "b2bb2g-local-security";

export function hashSecurityValue(value: string) {
  return createHash("sha256").update(`${pepper}:${value}`).digest("hex");
}

export function hashPublicValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function maskIp(ip: string) {
  if (!ip || ip === "unknown") return "Unknown";
  if (ip.includes(".")) {
    const parts = ip.split(".");
    return parts.length === 4 ? `${parts[0]}.${parts[1]}.${parts[2]}.x` : "Unknown";
  }
  if (ip.includes(":")) return `${ip.split(":").slice(0, 3).join(":")}:…`;
  return "Unknown";
}

function deviceLabel(userAgent: string) {
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /Chrome\//.test(userAgent)
      ? "Chrome"
      : /Firefox\//.test(userAgent)
        ? "Firefox"
        : /Safari\//.test(userAgent)
          ? "Safari"
          : "Browser";
  const os = /Android/.test(userAgent)
    ? "Android"
    : /iPhone|iPad/.test(userAgent)
      ? "iOS"
      : /Windows/.test(userAgent)
        ? "Windows"
        : /Mac OS X/.test(userAgent)
          ? "macOS"
          : /Linux/.test(userAgent)
            ? "Linux"
            : "device";
  return `${browser} on ${os}`;
}

export async function requestSecurityContext() {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || requestHeaders.get("x-real-ip") || "unknown";
  const userAgent = requestHeaders.get("user-agent")?.slice(0, 200) || "Unknown browser";
  const rawCity = requestHeaders.get("x-vercel-ip-city") || "";
  let city = rawCity;
  try {
    city = decodeURIComponent(rawCity);
  } catch {
    city = rawCity;
  }
  return {
    ipHash: hashSecurityValue(ip),
    ipMasked: maskIp(ip),
    userAgent,
    deviceLabel: deviceLabel(userAgent),
    country: requestHeaders.get("x-vercel-ip-country")?.slice(0, 8) || "",
    city: city.slice(0, 80),
  };
}

export async function ensureDeviceIdentity() {
  const store = await cookies();
  let raw = store.get(TRUSTED_DEVICE_COOKIE)?.value;
  if (!raw) {
    raw = randomBytes(32).toString("base64url");
    store.set(TRUSTED_DEVICE_COOKIE, raw, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return { raw, hash: hashSecurityValue(raw) };
}

export async function currentDeviceHash() {
  const raw = (await cookies()).get(TRUSTED_DEVICE_COOKIE)?.value;
  return raw ? hashSecurityValue(raw) : null;
}

export function sessionIdFromJwt(accessToken?: string | null) {
  if (!accessToken) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(accessToken.split(".")[1] ?? "", "base64url").toString("utf8"),
    ) as { session_id?: string };
    return payload.session_id ?? null;
  } catch {
    return null;
  }
}

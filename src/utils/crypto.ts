import crypto from "node:crypto";

export function generateClientId(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function generateClientSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashClientSecret(secret: string): string {
  return crypto.createHash("sha256").update(secret).digest("hex");
}

export function verifyClientSecret(secret: string, hash: string): boolean {
  return hashClientSecret(secret) === hash;
}

export function generateAuthCode(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

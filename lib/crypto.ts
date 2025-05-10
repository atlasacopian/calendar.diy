"use client"

// Lightweight helper functions for client-side AES-GCM encryption.
// These run only in the browser (Web Crypto API).

export async function deriveKey(uniqueId: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  // Turn ID into raw key material
  const material = await crypto.subtle.importKey(
    "raw",
    enc.encode(uniqueId),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  // Derive a 256-bit AES key; salt is public & constant per-app.
  const salt = enc.encode("calendar.diy-v1");
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100_000,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptJSON(obj: unknown, key: CryptoKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(obj));
  const cipherBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  const cipherArr = new Uint8Array(cipherBuf);
  const cipherStr = String.fromCharCode(...Array.from(cipherArr));
  return {
    iv: Array.from(iv),
    data: btoa(cipherStr),
  } as const;
}

export async function decryptJSON<T>(payload: { iv: number[]; data: string }, key: CryptoKey): Promise<T> {
  const iv = new Uint8Array(payload.iv);
  const cipherArr = Uint8Array.from(atob(payload.data), (c) => c.charCodeAt(0));
  const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipherArr);
  return JSON.parse(new TextDecoder().decode(plainBuf)) as T;
} 
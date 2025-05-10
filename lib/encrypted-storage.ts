"use server"

import { supabase } from "@/lib/supabase";
import { deriveKey, encryptJSON, decryptJSON } from "@/lib/crypto";
import type { User } from "@supabase/supabase-js";

export type EncryptedPayload = {
  iv: number[];
  data: string;
};

export type SavedState = {
  events: any[];
  groups: any[];
};

export async function saveEncryptedState(state: SavedState, user: User) {
  const key = await deriveKey(user.id);
  const payload = await encryptJSON(state, key);

  // upsert row
  await supabase
    .from("encrypted_calendars")
    .upsert({ user_id: user.id, payload });
}

export async function loadEncryptedState(user: User): Promise<SavedState | null> {
  const { data, error } = await supabase
    .from("encrypted_calendars")
    .select("payload")
    .eq("user_id", user.id)
    .single();
  if (error || !data) return null;

  try {
    const key = await deriveKey(user.id);
    return await decryptJSON<SavedState>(data.payload as any, key);
  } catch (e) {
    console.error("Failed to decrypt state", e);
    return null;
  }
} 
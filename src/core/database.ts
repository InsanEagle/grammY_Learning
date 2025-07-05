import { DenoKVAdapter } from "https://deno.land/x/grammy_storages/denokv/src/mod.ts";

export let kv: Deno.Kv;
export let storage: DenoKVAdapter<Deno.Kv>;

export async function initializeDb(path: string): Promise<void> {
  kv = await Deno.openKv(path);
  storage = new DenoKVAdapter(kv);
}

export function __setKv(newKv: Deno.Kv) {
  kv = newKv;
  storage = new DenoKVAdapter(kv);
}

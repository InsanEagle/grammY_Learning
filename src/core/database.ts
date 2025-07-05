import { DenoKVAdapter } from "https://deno.land/x/grammy_storages/denokv/src/mod.ts";
// import { freeStorage } from "https://deno.land/x/grammy_storages@v2.4.2/free/src/mod.ts";
// import { FileAdapter } from "https://deno.land/x/grammy_storages/file/src/mod.ts";

// Deno.kv storage
export let kv = await Deno.openKv("./sessions/kv.db");
export const storage = new DenoKVAdapter(kv);

// Export a setter for testing purposes
export function __setKv(newKv: Deno.Kv) {
  kv = newKv;
}

// File storage
// export const storage = new FileAdapter<SessionData>({
//   dirName: "sessions",
// });

// Free storage
// export const storage = new freeStorage<SessionData>(bot.token);

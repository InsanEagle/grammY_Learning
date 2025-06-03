const kv = await Deno.openKv();

export function get(key: Deno.KvKey) {
  return kv.get(key);
}

export function set(key: Deno.KvKey, value: unknown) {
  return kv.set(key, value);
}
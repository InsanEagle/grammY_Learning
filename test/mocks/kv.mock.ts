//! This is a mock implementation of the Deno.Kv interface for testing purposes.
//! It uses an in-memory Map to store data and simulates the behavior of
//! `get`, `set`, `delete`, `list`, and `atomic` operations.
//! It is not a complete implementation and only supports the features used by
//! the application's repositories.

function keyToString(key: Deno.KvKey): string {
  return key.map((part) => {
    if (part instanceof Uint8Array) {
      return `U8(${Array.from(part).join(",")})`;
    }
    return String(part);
  }).join("/");
}

class MockAtomic implements Deno.AtomicOperation {
  private operations: (() => void)[] = [];

  constructor(private store: Map<string, any>) {}

  set(key: Deno.KvKey, value: any): this {
    this.operations.push(() => {
      this.store.set(keyToString(key), value);
    });
    return this;
  }

  delete(key: Deno.KvKey): this {
    this.operations.push(() => {
      this.store.delete(keyToString(key));
    });
    return this;
  }

  // --- Add stubs for unused methods to satisfy the interface ---
  check(..._checks: Deno.AtomicCheck[]): this {
    // This mock doesn't support checks, so we assume they pass.
    return this;
  }

  mutate(..._mutations: Deno.KvMutation[]): this {
    throw new Error("MockAtomic.mutate() is not implemented.");
  }

  sum(key: Deno.KvKey, n: bigint): this {
    this.operations.push(() => {
      const current = (this.store.get(keyToString(key)) as Deno.KvU64)?.value ??
        0n;
      this.store.set(keyToString(key), new Deno.KvU64(current + n));
    });
    return this;
  }

  min(key: Deno.KvKey, n: bigint): this {
    this.operations.push(() => {
      const current = (this.store.get(keyToString(key)) as Deno.KvU64)?.value;
      if (current === undefined || n < current) {
        this.store.set(keyToString(key), new Deno.KvU64(n));
      }
    });
    return this;
  }

  max(key: Deno.KvKey, n: bigint): this {
    this.operations.push(() => {
      const current = (this.store.get(keyToString(key)) as Deno.KvU64)?.value;
      if (current === undefined || n > current) {
        this.store.set(keyToString(key), new Deno.KvU64(n));
      }
    });
    return this;
  }

  enqueue(): this {
    throw new Error("MockAtomic.enqueue() is not implemented.");
  }
  // --- End of stubs ---

  commit(): Promise<Deno.KvCommitResult | Deno.KvCommitError> {
    // This simple mock always succeeds.
    this.operations.forEach((op) => op());
    return Promise.resolve({
      ok: true,
      versionstamp: `mock-versionstamp-${Date.now()}`,
    });
  }
}

export class MockKv implements Partial<Deno.Kv> {
  public store = new Map<string, any>();

  get<T = unknown>(
    key: Deno.KvKey,
    _options?: { consistency?: Deno.KvConsistencyLevel },
  ): Promise<Deno.KvEntryMaybe<T>> {
    const value = this.store.get(keyToString(key));
    if (value === undefined) {
      return Promise.resolve({
        key,
        value: null,
        versionstamp: null,
      });
    }
    return Promise.resolve({
      key,
      value,
      versionstamp: "mock-versionstamp",
    });
  }

  set(
    key: Deno.KvKey,
    value: unknown,
    _options?: { expireIn?: number },
  ): Promise<Deno.KvCommitResult> {
    this.store.set(keyToString(key), value);
    return Promise.resolve({
      ok: true,
      versionstamp: `mock-versionstamp-${Date.now()}`,
    });
  }

  delete(key: Deno.KvKey): Promise<void> {
    this.store.delete(keyToString(key));
    return Promise.resolve();
  }

  list<T = unknown>(
    selector: Deno.KvListSelector,
    _options?: Deno.KvListOptions,
  ): Deno.KvListIterator<T> {
    const entries: Deno.KvEntry<T>[] = [];

    if ("prefix" in selector) {
      const prefix = keyToString(selector.prefix);
      for (const [keyStr, value] of this.store.entries()) {
        if (keyStr.startsWith(prefix)) {
          // This key reconstruction is imperfect but sufficient for most tests.
          entries.push({
            key: [keyStr],
            value,
            versionstamp: "mock-versionstamp",
          });
        }
      }
    } else {
      // Range selectors are not implemented in this simple mock.
      // Add implementation if needed.
    }

    let index = 0;
    const iterator: Deno.KvListIterator<T> = {
      [Symbol.asyncIterator]() {
        return this;
      },
      next: () => {
        if (index < entries.length) {
          return Promise.resolve({ done: false, value: entries[index++] });
        }
        return Promise.resolve({ done: true, value: undefined as any });
      },
      get cursor(): string {
        // Cursors are not implemented in this simple mock.
        return "";
      },
    };
    return iterator;
  }

  atomic(): Deno.AtomicOperation {
    return new MockAtomic(this.store);
  }

  // Add stubs for other Deno.Kv methods if needed by tests
  close(): void {
    this.store.clear();
  }
}

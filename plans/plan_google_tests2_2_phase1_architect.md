# Refactoring Plan: Isolate Test Database to Prevent Production Data Loss

## 1. Executive Summary & Goals

This plan addresses a critical issue where running the test suite clears the
production/development database. The root cause is that integration tests and
unit tests inadvertently share and operate on the same live database instance
initialized at module load time.

The proposed solution is to decouple the database initialization from the module
import, allowing the application to initialize the production database and the
test suite to initialize a separate, temporary database for its own use. This
will completely isolate the testing environment, preserving the integrity of the
main database.

- **Goal 1: Prevent Data Loss.** Ensure that running `deno task test` has zero
  impact on the contents of the `./sessions/kv.db` file.
- **Goal 2: Establish True Test Isolation.** Implement a robust pattern where
  integration tests run against a dedicated, temporary Deno KV database file,
  which is created and destroyed during the test run.
- **Goal 3: Maintain Test Correctness.** Ensure unit tests continue to use the
  fast in-memory `MockKv`, while integration tests use a real (but temporary) KV
  instance for maximum accuracy.

## 2. Current Situation Analysis

The current implementation suffers from a critical flaw related to how the Deno
KV database is initialized.

- **Problem:** The line `export let kv = await Deno.openKv("./sessions/kv.db");`
  in `src/core/database.ts` is executed the moment the module is first imported
  by the Deno runtime. This creates a single, persistent connection to the live
  database that is shared across the entire application and test suite.
- **Symptom:**
  - **Unit Tests (`*.service.test.ts`)** correctly swap this live `kv` instance
    with an in-memory `MockKv` and restore it afterward. They are not the source
    of the data loss.
  - **Integration Tests (`*.repository.test.ts`, `scheduler.test.ts`)** also
    import this live `kv` instance. However, they then call a `clearDb()` helper
    function which iterates through and deletes all keys from this shared, live
    database, causing the data wipe.
- **Conclusion:** The problem is not in the mocking logic of the service tests,
  but in the integration tests operating directly on a live database connection
  that they should not have access to.

## 3. Proposed Solution / Refactoring Strategy

### 3.1. High-Level Design / Architectural Overview

We will shift from an "eager" database initialization model to a "lazy" or
"explicit" one. The `database.ts` module will no longer automatically open a
connection. Instead, it will export an initialization function. The main
application will call this function to connect to the production database, and
the test suite will call it to connect to a temporary test database.

```mermaid
graph TD
    subgraph "Before (Current State)"
        A["`database.ts` is imported"] --> B{"`Deno.openKv('./sessions/kv.db')` runs automatically"};
        B --> C["`kv` instance (Live DB) is created"];
        C --> D["App uses `kv`"];
        C --> E["Tests use `kv` (and clear it)"];
    end

    subgraph "After (Proposed State)"
        F["`database.ts` is imported"] --> G["Exports `initializeDb(path)` and uninitialized `kv`"];
        H["`bot.ts` (App)"] --> I["Calls `initializeDb('./sessions/kv.db')`"];
        J["`*.test.ts` (Tests)"] --> K["Calls `initializeDb('./test.kv.db')`"];
        I --> L["`kv` instance (Live DB)"];
        K --> M["`kv` instance (Test DB)"];
    end

    style E fill:#ffcccc,stroke:#ff0000,stroke-width:2px
    style M fill:#ccffcc,stroke:#00aa00,stroke-width:2px
```

### 3.2. Key Components / Modules

- **`src/core/database.ts`**: Will be modified to export an uninitialized `kv`
  and an `initializeDb` function.
- **`bot.ts`**: Will be updated to call `initializeDb` on startup.
- **All Integration Tests (`*.repository.test.ts`, `scheduler.test.ts`)**: Will
  be refactored to manage the lifecycle of a temporary test database.
- **All Unit Tests (`*.service.test.ts`)**: Will be slightly adjusted to work
  with the new initialization pattern, ensuring they remain fully mocked.

### 3.3. Detailed Action Plan / Phases

#### Phase 1: Decouple Database Initialization

- **Objective(s):** Modify the core database module to prevent automatic
  connection to the production database.
- **Priority:** High

- **Task 1.1: Refactor `src/core/database.ts`**
  - **Rationale/Goal:** To stop the automatic database connection on module
    import and provide an explicit initialization function.
  - **Estimated Effort:** S
  - **Deliverable/Criteria for Completion:** The file is updated to the
    following structure. The `storage` export for `grammy_storages` must also be
    updated.
  ```typescript
  // src/core/database.ts

  import { DenoKVAdapter } from "https://deno.land/x/grammy_storages/denokv/src/mod.ts";

  // kv is now declared but not initialized.
  export let kv: Deno.Kv;
  // storage is also uninitialized.
  export let storage: DenoKVAdapter;

  // This function will be called explicitly by the app or tests.
  export async function initializeDb(path: string): Promise<void> {
    kv = await Deno.openKv(path);
    storage = new DenoKVAdapter(kv);
  }

  // The setter remains for testing purposes.
  export function __setKv(newKv: Deno.Kv) {
    kv = newKv;
    storage = new DenoKVAdapter(kv);
  }
  ```

- **Task 1.2: Update Application Entrypoint (`bot.ts`)**
  - **Rationale/Goal:** To ensure the main application correctly initializes the
    production database on startup.
  - **Estimated Effort:** S
  - **Deliverable/Criteria for Completion:** `bot.ts` is updated to call
    `initializeDb`.
  ```typescript
  // bot.ts

  import { createBot } from "./src/core/app.ts";
  import { initializeDb } from "./src/core/database.ts"; // Import the initializer

  // Initialize the production database before creating the bot
  await initializeDb("./sessions/kv.db");

  export const bot = await createBot();

  bot.start();
  ```

#### Phase 2: Refactor Integration Tests

- **Objective(s):** Update all tests that require a real database to use a
  temporary, isolated file.
- **Priority:** High

- **Task 2.1: Create a Test Helper for DB Management**
  - **Rationale/Goal:** To centralize the logic for setting up and tearing down
    the test database, avoiding code duplication.
  - **Estimated Effort:** M
  - **Deliverable/Criteria for Completion:** A new helper function is created in
    `test/helpers.ts`.
  ```typescript
  // test/helpers.ts

  import { initializeDb, kv } from "../src/core/database.ts";
  // ... other imports

  const TEST_DB_PATH = "./test.kv.db";

  /**
   * Sets up an isolated Deno KV database for integration tests.
   * It initializes the DB, provides a function to clear it between steps,
   * and returns a function to clean up (close and delete) the DB file afterward.
   */
  export async function setupTestDb() {
    await initializeDb(TEST_DB_PATH);

    const clear = async () => {
      const iter = kv.list({ prefix: [] });
      for await (const entry of iter) {
        await kv.delete(entry.key);
      }
    };

    const teardown = () => {
      kv.close();
      // Deno.remove is unstable, but necessary for cleanup.
      // Ensure --allow-write is enabled for tests.
      try {
        Deno.removeSync(TEST_DB_PATH);
        Deno.removeSync(`${TEST_DB_PATH}-shm`);
        Deno.removeSync(`${TEST_DB_PATH}-wal`);
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) {
          console.error("Error during test DB cleanup:", error);
        }
      }
    };

    return { clear, teardown };
  }

  // The old clearDb function should be REMOVED to avoid confusion.
  // export async function clearDb() { ... } // <- DELETE THIS
  ```

- **Task 2.2: Refactor `reminders.repository.test.ts`**
  - **Rationale/Goal:** To adopt the new `setupTestDb` helper for safe
    integration testing.
  - **Estimated Effort:** M
  - **Deliverable/Criteria for Completion:** The test file is refactored to
    manage the test DB lifecycle.
  ```typescript
  // src/modules/reminders/reminders.repository.test.ts

  // ... imports
  import { setupTestDb } from "../../../test/helpers.ts"; // Import new helper

  Deno.test(
    "ReminderRepository",
    { sanitizeResources: false, sanitizeOps: false },
    async (t) => {
      const { clear, teardown } = await setupTestDb();

      try {
        const repo = new ReminderRepository();
        const userId = 1;

        await t.step("create", async () => {
          await clear(); // Clear before each step
          // ... test logic
        });

        await t.step("findByUser", async () => {
          await clear();
          // ... test logic
        });

        // ... other steps, each starting with `await clear();`
      } finally {
        teardown(); // Ensure cleanup happens
      }
    },
  );
  ```

- **Task 2.3: Apply Refactoring to Other Integration Tests**
  - **Rationale/Goal:** To ensure all integration tests are updated.
  - **Estimated Effort:** M
  - **Deliverable/Criteria for Completion:**
    - `src/modules/tasks/tasks.repository.test.ts` is refactored using the same
      pattern as Task 2.2.
    - `src/core/scheduler.test.ts` is refactored using the same pattern.

#### Phase 3: Adjust Unit Tests

- **Objective(s):** Ensure service-level unit tests continue to function
  correctly with the new DB initialization logic.
- **Priority:** Medium

- **Task 3.1: Refactor `reminders.service.test.ts`**
  - **Rationale/Goal:** The test needs a valid `Deno.Kv` instance to be present
    to save as `originalKv` before swapping. We will use the test DB for this
    temporary purpose.
  - **Estimated Effort:** S
  - **Deliverable/Criteria for Completion:** The test file is updated to
    initialize a temporary DB before mocking it.
  ```typescript
  // src/modules/reminders/reminders.service.test.ts

  // ... imports
  import { __setKv, initializeDb, kv } from "../../core/database.ts";
  import { MockKv } from "../../../test/mocks/kv.mock.ts";

  Deno.test(
    "ReminderService",
    { sanitizeResources: false, sanitizeOps: false },
    async (t) => {
      // Initialize a temporary, real DB instance just to have a valid object to swap.
      await initializeDb("./test.service.db");
      const originalKv = kv;
      const mockKv = new MockKv();
      __setKv(mockKv as any);

      try {
        // ... existing test logic (which uses mockKv) ...
      } finally {
        __setKv(originalKv); // Restore the original (temporary) kv
        originalKv.close(); // Close the connection
        // Clean up the temporary file
        try {
          Deno.removeSync("./test.service.db");
          Deno.removeSync("./test.service.db-shm");
          Deno.removeSync("./test.service.db-wal");
        } catch { /* ignore */ }
      }
    },
  );
  ```

- **Task 3.2: Refactor `tasks.service.test.ts`**
  - **Rationale/Goal:** Apply the same robust unit test setup pattern.
  - **Estimated Effort:** S
  - **Deliverable/Criteria for Completion:** `tasks.service.test.ts` is
    refactored identically to Task 3.1.

## 4. Key Considerations & Risk Mitigation

- **Technical Risk:** Filesystem permissions. The test runner needs write access
  to create and delete the temporary database files.
  - **Mitigation:** The `deno task test` command already includes
    `--allow-write`, so this should not be an issue.
- **Cleanup:** If the test process is forcefully terminated, temporary DB files
  (`test.kv.db*`, `test.service.db*`) might be left behind.
  - **Mitigation:** This is a minor, acceptable risk for a local development
    environment. The `.gitignore` file already correctly ignores these files.
    The `try...finally` blocks ensure cleanup in almost all test failure
    scenarios.

## 5. Success Metrics / Validation Criteria

- **Primary Metric:** After running `deno task test`, the `mtime` (last modified
  time) of the `./sessions/kv.db` file and its contents are unchanged.
- **Secondary Metric:** All tests in the suite pass successfully.
- **Validation:** Manually add an entry to the production DB, run the tests, and
  verify the entry still exists.

## 6. Assumptions Made

- It is acceptable to modify the application's startup sequence in `bot.ts`.
- The distinction between integration tests (repositories, scheduler) and unit
  tests (services) is correct and should be maintained.
- Using temporary files on the filesystem for integration testing is an
  acceptable strategy.

## 7. Open Questions / Areas for Further Investigation

- None. The proposed solution is a standard and robust pattern for isolating
  test environments and will definitively solve the reported problem.

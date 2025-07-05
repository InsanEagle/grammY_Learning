# Bug Analysis Report: Missing 'clearDb' Export in Test Helpers

## 1. Executive Summary

- **Brief description of the analyzed bug:** The `deno task test` command fails
  during the type-checking phase with `TS2305` errors, indicating that the
  `clearDb` function cannot be found in the module `test/helpers.ts`.
- **Most likely root cause(s):** The root cause is an incomplete refactoring. As
  part of a larger effort to isolate the test database (detailed in
  `plan_google_tests2_2_phase1_architect.md`), the `clearDb` function was
  intentionally removed from `test/helpers.ts` and replaced with a more robust
  `setupTestDb` pattern. While several integration test files were updated to
  use this new pattern, two files,
  `src/modules/reminders/reminders.handlers.test.ts` and
  `src/modules/tasks/tasks.handlers.test.ts`, were missed and still attempt to
  import and use the now-non-existent `clearDb` function.
- **Key code areas/modules involved in the problem:**
  - `src/modules/reminders/reminders.handlers.test.ts` (Incorrect usage)
  - `src/modules/tasks/tasks.handlers.test.ts` (Incorrect usage)
  - `test/helpers.ts` (Source of the removed function)
  - `plans/plan_google_tests2_2_phase1_architect.md` (Documentation of the
    intended change)

## 2. Bug Description and Context (from `User Task`)

- **Observed Behavior:** When running `deno task test`, the process fails with
  TypeScript errors.
- **Expected Behavior:** The test suite should pass the type-checking phase and
  execute all tests successfully.
- **Steps to Reproduce (STR):**
  1. Run the command `deno task test`.
- **Environment (if provided):** Deno
- **Error Messages (if any):**
  ```
  TS2305 [ERROR]: Module '"file:///.../test/helpers.ts"' has no exported member 'clearDb'.
  import { clearDb, createMockContext } from "../../../test/helpers.ts";
           ~~~~~~~
      at file:///.../src/modules/reminders/reminders.handlers.test.ts:7:10

  TS2305 [ERROR]: Module '"file:///.../test/helpers.ts"' has no exported member 'clearDb'.
  import { clearDb, createMockContext } from "../../../test/helpers.ts";
           ~~~~~~~
      at file:///.../src/modules/tasks/tasks.handlers.test.ts:6:10
  ```

## 3. Code Execution Path Analysis

The reported errors are not runtime errors but type-checking errors that occur
before any test code is executed. The analysis path is that of the TypeScript
compiler.

### 3.1. Entry Point(s) and Initial State

The process begins when the user executes the `deno task test` command. This
invokes the Deno test runner, which initiates a type-checking pass on all
relevant project files.

### 3.2. Key Functions/Modules/Components in the Execution Path

- **Deno Test Runner:** The orchestrator that starts the type-checking process.
- **TypeScript Compiler:** The tool that statically analyzes the code.
- **`reminders.handlers.test.ts` / `tasks.handlers.test.ts`:** The test files
  containing the invalid import statements.
- **`test/helpers.ts`:** The module from which the import is attempted.

### 3.3. Execution Flow Tracing

The compiler's analysis flow is as follows for each of the failing files:

```mermaid
sequenceDiagram
    participant DenoCLI
    participant TypeScriptCompiler as TSC
    participant HandlerTestFile as `reminders.handlers.test.ts`
    participant HelpersModule as `test/helpers.ts`

    DenoCLI->>TSC: Start type-checking project
    TSC->>HandlerTestFile: Analyze `reminders.handlers.test.ts`
    HandlerTestFile-->>TSC: Reads `import { clearDb, ... } from '../../../test/helpers.ts';`
    TSC->>HelpersModule: Resolve module and look for exported member 'clearDb'
    HelpersModule-->>TSC: Module resolved, but no export named 'clearDb' found. Exports include 'setupTestDb'.
    TSC->>TSC: Import resolution failed.
    TSC-->>DenoCLI: Report TS2503 Error: "Module has no exported member 'clearDb'."
    DenoCLI-->>User: Print error and halt.
```

- **Step 1:** The TypeScript compiler parses
  `src/modules/reminders/reminders.handlers.test.ts`.
- **Step 2:** It encounters the import statement:
  `import { clearDb, createMockContext } from "../../../test/helpers.ts";`.
- **Step 3:** The compiler resolves the module path to `test/helpers.ts` and
  inspects its exported members.
- **Step 4:** It finds exports for `createMockContext`,
  `createMockConversation`, and `setupTestDb`, but it does not find an export
  for `clearDb`. This is because the function was removed as part of a planned
  refactoring.
- **Step 5:** The compiler flags this as a `TS2305` error because the import
  cannot be satisfied.
- **Step 6:** The same process repeats for
  `src/modules/tasks/tasks.handlers.test.ts`, resulting in the second error. The
  test run is aborted.

### 3.4. Data State and Flow Analysis

This is a static analysis error. There is no data flow or state change involved.
The issue is a structural mismatch between what the test files expect to import
and what the helper module actually exports.

## 4. Potential Root Causes and Hypotheses

### 4.1. Hypothesis 1: Incomplete Refactoring of Test Database Management

- **Rationale/Evidence:** This is the definitive root cause. The planning
  document `plan_google_tests2_2_phase1_architect.md` explicitly mandates the
  removal of `clearDb` and its replacement with a new `setupTestDb` helper to
  prevent tests from wiping the production database. The error messages are a
  direct symptom of this change. The code in `test/helpers.ts` confirms
  `clearDb` is gone, while the code in the failing test files confirms they were
  not updated to reflect this change. In contrast, other integration tests like
  `reminders.repository.test.ts` and `tasks.repository.test.ts` _were_ correctly
  refactored, demonstrating the intended pattern and highlighting the
  inconsistency.
- **How it leads to the bug:** The test files `reminders.handlers.test.ts` and
  `tasks.handlers.test.ts` have become desynchronized from their dependency,
  `test/helpers.ts`. They attempt to import a function that no longer exists,
  leading to a fatal type-checking error.

### 4.2. Most Likely Cause(s)

Hypothesis 1 is confirmed as the sole cause of the issue. It's a classic case of
an incomplete refactoring effort where some dependent files were overlooked.

## 5. Supporting Evidence from Code

- **The explicit instruction to remove the function** from
  `plans/plan_google_tests2_2_phase1_architect.md`:
  ```typescript
  // test/helpers.ts
  // ...
  // The old clearDb function should be REMOVED to avoid confusion.
  // export async function clearDb() { ... } // <- DELETE THIS
  ```

- **The invalid import** in `src/modules/reminders/reminders.handlers.test.ts`:
  ```typescript
  import { clearDb, createMockContext } from "../../../test/helpers.ts";
  // ...
  Deno.test("ReminderHandlers - remindersHandler", async (t) => {
    await clearDb(); // Calling the non-existent function
    // ...
  });
  ```

- **The correct, updated pattern** in
  `src/modules/reminders/reminders.repository.test.ts` (for comparison):
  ```typescript
  import { setupTestDb } from "../../../test/helpers.ts"; // Import new helper

  Deno.test(
    "ReminderRepository",
    { sanitizeResources: false, sanitizeOps: false },
    async (t) => {
      const { clear, teardown } = await setupTestDb(); // Correctly using the new helper
      try {
        // ... test steps using `await clear()`
      } finally {
        teardown(); // Correctly tearing down
      }
    },
  );
  ```

## 6. Recommended Steps for Debugging and Verification

The cause is definitively identified. The following steps are for fixing the
issue by completing the refactoring. The pattern from
`reminders.repository.test.ts` should be applied to the failing handler test
files.

**1. Refactor `src/modules/reminders/reminders.handlers.test.ts`:**

Update the file to use the `setupTestDb` helper for tests that require database
interaction.

```typescript
// src/modules/reminders/reminders.handlers.test.ts

import * as chrono from "npm:chrono-node/ru";
import {
  assertSpyCall,
  Spy,
} from "https://deno.land/std@0.224.0/testing/mock.ts";
// Change the import: remove 'clearDb', add 'setupTestDb'
import { createMockContext, setupTestDb } from "../../../test/helpers.ts";
import { createReminderHandlers } from "./reminders.handlers.ts";
import { ReminderService } from "./reminders.service.ts";
import { ReminderRepository } from "./reminders.repository.ts";

// ... (tests that don't need the DB are unchanged)

Deno.test("ReminderHandlers - remindersHandler", async (t) => {
  // Use the new setupTestDb pattern
  const { clear, teardown } = await setupTestDb();
  try {
    const reminderRepository = new ReminderRepository();
    const reminderService = new ReminderService(reminderRepository);
    const handlers = createReminderHandlers(reminderService);
    const ctx = createMockContext();

    await t.step(
      "should reply with 'No reminders in the list' if no reminders exist",
      async () => {
        await clear(); // Clear DB state for this step
        await handlers.remindersHandler(ctx);
        assertSpyCall(ctx.reply as Spy<any>, 0, {
          args: ["No reminders in the list"],
        });
      },
    );

    await t.step(
      "should reply with a list of reminders if reminders exist",
      async () => {
        await clear(); // Clear DB state for this step
        // ... (rest of the test logic is the same, but now correctly isolated)
        await reminderService.addReminder(
          ctx.from!.id,
          "Test Reminder 1 завтра",
        );
        // ...
        await handlers.remindersHandler(ctx);
        // ... (assertions)
      },
    );
  } finally {
    teardown(); // Ensure the test DB is cleaned up
  }
});
```

**2. Refactor `src/modules/tasks/tasks.handlers.test.ts`:**

Apply the exact same `setupTestDb` pattern to this file for its integration
tests.

## 7. Bug Impact Assessment

**High.** This is a build-time failure that completely blocks the entire test
suite from running. It prevents the CI pipeline from validating code changes,
which significantly increases the risk of introducing regressions. Developer
productivity is hampered as they cannot get feedback on their changes.

## 8. Assumptions Made During Analysis

- The refactoring described in `plan_google_tests2_2_phase1_architect.md` was
  intentional and should be applied consistently across all integration tests.
- The handler tests that interact with the `TaskService` and `ReminderService`
  are considered integration tests because they rely on a real (though
  temporary) database instance.

## 9. Open Questions / Areas for Further Investigation

There are no open questions. The cause is clear, and the path to resolution is a
straightforward completion of the previously planned refactoring.

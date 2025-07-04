# Refactoring/Design Plan: Tooling & Framework Adoption for Advanced Testing

## 1. Executive Summary & Goals

This plan identifies the specific frameworks, libraries, and techniques required
to implement the comprehensive testing strategy outlined previously. It is
tailored to your existing stack (Deno, `deno.test`, Deno KV, grammY) and focuses
on augmenting it for greater test reliability and coverage.

The key goals are:

1. **Identify a specialized framework for E2E grammY conversation testing.**
2. **Establish a robust, native Deno approach for creating isolated unit tests
   through advanced mocking.**
3. **Provide a clear, phased adoption plan for these tools to integrate them
   into your development and CI workflow.**

## 2. Current Situation Analysis

Your current stack is a powerful and modern foundation for bot development.
`deno.test` is a capable, built-in test runner, and `deno.land/std/assert`
provides all necessary assertion logic.

The primary gap is the lack of specialized tools for two key areas identified in
the previous plan:

1. **Dependency Mocking:** While `deno.land/std/testing/mock` is used for spies,
   there isn't a standardized way to mock complex dependencies like the
   `Deno.Kv` database for true unit test isolation.
2. **E2E Bot Simulation:** There is no tool in place to simulate a full user
   conversation with the bot, which is essential for testing the stateful logic
   in `*.conversations.ts` files.

This plan addresses these gaps by recommending specific, well-integrated tools.

## 3. Proposed Solution / Refactoring Strategy

### 3.1. High-Level Design / Architectural Overview

The strategy is to **augment, not replace**, your current stack. We will
continue to use `deno.test` as the runner and `deno.land/std` for basic mocking
and assertions. We will introduce one key library for E2E testing and formalize
a pattern for dependency mocking.

```mermaid
graph TD
    subgraph "Your Stack"
        A[Deno Runtime]
        B[deno.test Runner]
        C[grammY Framework]
        D[Deno KV]
    end

    subgraph "Proposed Tooling Augmentations"
        E("`grammy-test` Library")
        F("In-Memory KV Mock (Pattern)")
        G("`deno.land/std/testing/mock.stub` (Technique)")
    end

    C -- "Tested by" --> E
    D -- "Mocked by" --> F
    F -- "Injected via" --> G

    style E fill:#9f9,stroke:#333,stroke-width:2px
    style F fill:#9cf,stroke:#333,stroke-width:2px
    style G fill:#9cf,stroke:#333,stroke-width:2px
```

### 3.2. Key Components / Modules (Tool Recommendations)

1. **For E2E Conversation Testing: `grammy-test`**
   - **What it is:** A library specifically designed for testing grammY bots. It
     allows you to create an in-memory instance of your bot, send it mock
     updates (e.g., a user sending a message), and inspect the bot's replies and
     API calls without needing a live Telegram connection.
   - **Why use it:** It's the perfect tool for testing your `*.conversations.ts`
     files. It handles the complexity of the grammY middleware and conversation
     state, allowing you to write clear, high-level tests that mimic real user
     journeys.
   - **Import:** `import { Bot, Conversation } from "grammy-test";`

2. **For Unit Test Mocking: In-Memory KV Mock & `stub`**
   - **What it is:** This is a two-part solution.
     1. **In-Memory KV Mock:** A simple TypeScript class you will write that
        implements the `Deno.Kv` interface but uses a `Map` or `Object` to store
        data in memory.
     2. **`Deno.land/std/testing/mock.stub`:** A function from the Deno standard
        library that allows you to temporarily replace a function or an object's
        method with a fake implementation.
   - **Why use it:** This combination allows you to write lightning-fast unit
     tests. You can use `stub` to replace the real `Deno.openKv` with a function
     that returns an instance of your in-memory mock. Your services and
     repositories will then run against this fake, predictable in-memory
     database, completely isolating them from the file system and other tests.

3. **For CI/CD & Coverage: Deno Built-ins & GitHub Actions**
   - **What it is:** Using `deno test --coverage` to generate a coverage profile
     and a GitHub Action like `codecov/codecov-action` to process and upload it.
   - **Why use it:** This makes test coverage a visible, first-class metric in
     your development process, helping you track progress against the goal of
     >80% coverage.

### 3.3. Detailed Action Plan / Phases

#### Phase 1: Implement Advanced Mocking for Unit Tests

- **Objective(s):** Create the tools and patterns needed for fully isolated unit
  tests.
- **Priority:** High

- **Task 1.1: Create the In-Memory Deno KV Mock**
  - **Rationale/Goal:** To provide a fast, reliable, and isolated in-memory
    database for unit testing services and repositories.
  - **Estimated Effort:** M
  - **Deliverable/Criteria for Completion:**
    - A new file `test/mocks/kv.mock.ts` is created.
    - It exports a class `MockKv` that implements the methods used by your
      repositories (`get`, `set`, `delete`, `list`, `atomic`) using an internal
      `Map`.
    - _Illustrative Skeleton:_
      ```typescript
      // test/mocks/kv.mock.ts
      export class MockKv implements Partial<Deno.Kv> {
        private store = new Map<string, any>();
        // Implement get, set, delete, etc. here
        async get<T>(key: Deno.KvKey): Promise<Deno.KvEntry<T>> {/* ... */}
        // ... other methods
      }
      ```

- **Task 1.2: Refactor Service Tests to Use `stub`**
  - **Rationale/Goal:** To convert existing service tests into true, fast unit
    tests that do not touch the real database.
  - **Estimated Effort:** M
  - **Deliverable/Criteria for Completion:**
    - `reminders.service.test.ts` and `tasks.service.test.ts` are refactored.
    - They no longer use a `MockReminderRepository` but instead use the real
      `ReminderRepository`.
    - `Deno.land/std/testing/mock.stub` is used to inject the `MockKv` into the
      repository layer for the duration of the test.
    - _Illustrative Test Setup:_
      ```typescript
      import { stub } from "https://deno.land/std/testing/mock.ts";
      import * as db from "../../core/database.ts"; // Assuming kv is exported here
      import { MockKv } from "../../../test/mocks/kv.mock.ts";

      Deno.test("My Service Test", async () => {
        const mockKv = new MockKv();
        const dbStub = stub(db, "kv", () => mockKv); // Replace real kv with mock
        // ... run your service test logic ...
        dbStub.restore(); // Clean up the stub
      });
      ```

#### Phase 2: Adopt `grammy-test` for E2E Conversation Testing

- **Objective(s):** Implement robust, high-level tests for the most critical and
  complex user-facing features.
- **Priority:** High

- **Task 2.1: Integrate `grammy-test` into the Project**
  - **Rationale/Goal:** To add the necessary framework for E2E testing.
  - **Estimated Effort:** S
  - **Deliverable/Criteria for Completion:**
    - Add `grammy-test` to your `deno.json` `imports` map for version
      management.
    - `"grammy-test": "npm:grammy-test@^3.0.0"` (or latest version).

- **Task 2.2: Write First E2E Conversation Test**
  - **Rationale/Goal:** To validate the `grammy-test` setup and create a
    template for testing all other conversations.
  - **Estimated Effort:** L
  - **Deliverable/Criteria for Completion:**
    - A new `reminders.conversations.test.ts` file is created.
    - It contains a test for the `addReminderConversation` happy path.
    - _Illustrative Test:_
      ```typescript
      // src/modules/reminders/reminders.conversations.test.ts
      import { Conversation } from "grammy-test";
      // ... other imports

      Deno.test("should add a reminder successfully", async () => {
        const conv = new Conversation(addReminderConversation);
        await conv.run(); // Start the conversation

        // 1. Bot asks for input
        await conv.waitForReply();
        assertEquals(conv.last.text, "Please provide a reminder to add...");

        // 2. User provides valid input
        await conv.send("Test reminder tomorrow at 10am");

        // 3. Bot confirms success
        await conv.waitForReply();
        assert(conv.last.text.includes("successfully added"));
      });
      ```

#### Phase 3: Enhance CI with Coverage Reporting

- **Objective(s):** Make test coverage a visible and actionable metric.
- **Priority:** Medium

- **Task 3.1: Update CI Workflow for Coverage**
  - **Rationale/Goal:** To automate the generation and reporting of test
    coverage on every pull request.
  - **Estimated Effort:** S
  - **Deliverable/Criteria for Completion:**
    - The `.github/workflows/ci.yml` file is updated.
    - The `deno task test` command is changed to
      `deno task test --coverage=coverage`.
    - A new step is added after the test run to upload the report.
    - _Illustrative CI Step:_
      ```yaml
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info # Deno can output in lcov format
          # token: ${{ secrets.CODECOV_TOKEN }} # Add secret to repo
      ```

## 4. Key Considerations & Risk Mitigation

- **Learning Curve:** The `grammy-test` library introduces a new API.
  - **Mitigation:** The library's API is fluent and designed to be intuitive.
    The documentation is solid. Starting with a single "happy path" test (Task
    2.2) will serve as an excellent, reusable example for the rest of the team.
- **Mock Maintenance:** The `MockKv` class will need to be updated if you start
  using new `Deno.Kv` features.
  - **Mitigation:** This risk is low, as the KV API is relatively stable. The
    mock only needs to implement the subset of features you actually use,
    keeping it simple and maintainable.

## 5. Success Metrics / Validation Criteria

- The team can successfully write and run isolated unit tests that complete in
  milliseconds.
- E2E tests for all major conversations are implemented using `grammy-test` and
  catch logic errors before they reach production.
- A code coverage badge is present in the `README.md`, and pull requests show
  coverage changes, guiding developers to improve tests.

## 6. Assumptions Made

- You are willing to add one new major dependency (`grammy-test`) to your
  project.
- You are comfortable with the "roll your own" approach for the `Deno.Kv` mock,
  which provides maximum control and avoids another dependency.

## 7. Open Questions / Further Reading

This plan provides a clear path forward. For deeper implementation details, the
official documentation for these tools will be invaluable:

- **`grammy-test`:**
  [https://deno.land/x/grammy_test](https://deno.land/x/grammy_test) (or its npm
  page if using the npm specifier)
- **`deno.land/std/testing/mock`:**
  [https://deno.land/std/testing/mock.ts](https://deno.land/std/testing/mock.ts)
- **Deno Coverage:**
  [https://docs.deno.com/runtime/manual/tools/coverage](https://docs.deno.com/runtime/manual/tools/coverage)

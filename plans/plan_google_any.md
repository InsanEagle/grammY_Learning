# Refactoring Plan: Eliminate `any` Types for Strict Linting

## 1. Executive Summary & Goals

This plan outlines a systematic approach to eliminate explicit `any` types
throughout the Deno project. The primary driver is to enable strict static
analysis by integrating `deno lint` into the CI/CD pipeline, thereby improving
code quality, maintainability, and long-term stability.

- **Goal 1: Achieve Full Type Safety.** Replace all instances of `any` with
  specific, well-defined types or interfaces.
- **Goal 2: Enable Automated Linting.** Successfully uncomment and integrate the
  `deno lint` step into the `.github/workflows/ci.yml` workflow.
- **Goal 3: Enhance Developer Confidence.** Reduce the risk of runtime type
  errors and make the codebase easier to understand and refactor in the future.

## 2. Current Situation Analysis

The project is a well-structured grammY-based Telegram bot. The `deno.json`
configuration already specifies strict compiler options like
`"noImplicitAny": true"`. However, the codebase contains several instances of
explicit `any`, which bypass these checks and would cause `deno lint` to fail.

Key pain points identified:

- **Test Infrastructure:** The most significant use of `any` is within the test
  helpers and mocks (`test/mocks/kv.mock.ts`, `test/helpers.ts`). This
  compromises type safety during testing and leads to cascading `any` types in
  test files.
- **Type Casting in Tests:** Test files frequently use `as Spy<any>`,
  `as unknown as ...`, and `as any` to force types, hiding potential type
  mismatches. For example, `src/core/scheduler.test.ts` and service tests like
  `reminders.service.test.ts`.
- **Inconsistent Context Typing:** Some conversation functions
  (`reminders.conversations.ts`, `tasks.conversations.ts`) accept the generic
  `Context` type from grammY instead of the project-specific, augmented
  `MyContext`, losing type information.
- **Disabled Linter:** The `deno lint` step in the CI workflow is currently
  commented out, indicating that the codebase is not compliant with the desired
  linting rules.

## 3. Proposed Solution / Refactoring Strategy

### 3.1. High-Level Design / Architectural Overview

The strategy is a phased, bottom-up approach. We will first solidify the type
safety of the testing foundation. With a reliable and well-typed testing
environment, we will then proceed module by module to eliminate `any` types from
the application code. Finally, we will enable the linter in the CI pipeline to
enforce these standards going forward. No major architectural changes are
required; this is a pure refactoring effort focused on type hygiene.

### 3.2. Key Components / Modules

The refactoring will touch the following key areas:

- `test/`: The entire testing infrastructure, including mocks and helpers.
- `src/core/`: Core components like the `SchedulerService` and its tests.
- `src/modules/reminders/`: The complete reminders module, with a focus on
  conversations and tests.
- `src/modules/tasks/`: The complete tasks module, with a focus on conversations
  and tests.
- `.github/workflows/`: The CI configuration file.

### 3.3. Detailed Action Plan / Phases

---

#### **Phase 1: Fortify Test Infrastructure & Core Services**

- **Objective(s):** Eliminate `any` types from the testing foundation to ensure
  that subsequent refactoring can be validated with type-safe tests.
- **Priority:** High

- **Task 1.1: Refactor `MockKv` to be Type-Safe**
  - **Rationale/Goal:** The current `MockKv` uses `any` for its internal store,
    making it a primary source of type-unsafety in tests.
  - **Estimated Effort:** M
  - **Deliverable/Criteria for Completion:**
    - Modify `test/mocks/kv.mock.ts`.
    - The `store` property is changed from `Map<string, any>` to
      `Map<string, unknown>`.
    - Methods like `set` should accept `value: unknown`.
    - The `MockAtomic` class is updated accordingly.
    - All tests that use `MockKv` are updated to handle the `unknown` type,
      likely with type assertions or guards within the test scope, and still
      pass.

- **Task 1.2: Refactor Test Helpers**
  - **Rationale/Goal:** The `createMockContext` function in `test/helpers.ts`
    uses `as any` and `unknown` casts to build mock objects. This should be
    replaced with more robust typing.
  - **Estimated Effort:** M
  - **Deliverable/Criteria for Completion:**
    - Modify `test/helpers.ts`.
    - The `ctx.reply` spy is typed correctly without `as any`. Example:
      `spy<Context, 'reply'>(() => Promise.resolve({} as Message.TextMessage));`.
    - The `ctx.conversation` mock is built using `Partial<ConversationControls>`
      or a more specific mock interface to avoid
      `as unknown as ConversationControls`.
    - All tests using `createMockContext` are updated and pass.

- **Task 1.3: Refactor Core Service Tests**
  - **Rationale/Goal:** Tests like `scheduler.test.ts` use `Spy<any>` and
    `as unknown as Bot<MyContext>`, which should be eliminated.
  - **Estimated Effort:** S
  - **Deliverable/Criteria for Completion:**
    - Modify `src/core/scheduler.test.ts`.
    - Replace `Spy<any>` with a specific spy type, e.g.,
      `Spy<Api<RawApi>, "sendMessage">`.
    - The `mockBot` is created with a more robust mock object using
      `Partial<Bot<MyContext>>` to avoid the `as unknown` cast.
    - The test passes.

- **Task 1.4: Address `__setKv(mockKv as any)` Injection**
  - **Rationale/Goal:** The `as any` cast for injecting the mock KV store in
    service tests is a clear type violation. The `MockKv` does not fully
    implement the `Deno.Kv` interface.
  - **Estimated Effort:** L
  - **Deliverable/Criteria for Completion:**
    - Modify `test/mocks/kv.mock.ts` to fully implement the `Deno.Kv` interface.
      This involves adding stub implementations for all methods (`enqueue`,
      `watch`, etc.) even if they are not used.
    - The `__setKv` function in `src/core/database.ts` can now accept `MockKv`
      without casting.
    - Remove the `as any` cast in all service tests (e.g.,
      `reminders.service.test.ts`, `tasks.service.test.ts`).
    - All service tests pass.

---

#### **Phase 2: Module-by-Module Type Refinement**

- **Objective(s):** Systematically apply strict typing to each feature module,
  focusing on handlers, services, and conversations.
- **Priority:** High

- **Task 2.1: Refactor `reminders` Module**
  - **Rationale/Goal:** Ensure the entire reminders feature is fully type-safe.
  - **Estimated Effort:** M
  - **Deliverable/Criteria for Completion:**
    - In `reminders.conversations.ts`, change all conversation function
      signatures from `(conversation: MyConversation, ctx: Context)` to
      `(conversation: MyConversation, ctx: MyContext)`.
    - Review `conversation.waitUntil` and `external` calls for type correctness.
    - In `reminders.handlers.test.ts`, remove any remaining `Spy<any>` or other
      casts.
    - All tests for the `reminders` module pass.

- **Task 2.2: Refactor `tasks` Module**
  - **Rationale/Goal:** Ensure the entire tasks feature is fully type-safe.
  - **Estimated Effort:** M
  - **Deliverable/Criteria for Completion:**
    - In `tasks.conversations.ts`, change all conversation function signatures
      from `(conversation: MyConversation, ctx: Context)` to
      `(conversation: MyConversation, ctx: MyContext)`.
    - Review `conversation.waitUntil` and `external` calls for type correctness.
    - In `tasks.handlers.test.ts`, remove any remaining `Spy<any>` or other
      casts.
    - All tests for the `tasks` module pass.

- **Task 2.3: Review Remaining Modules**
  - **Rationale/Goal:** Perform a quick review of simpler modules (`currencies`,
    `quote`, `settings`, etc.) to catch any missed `any` types.
  - **Estimated Effort:** S
  - **Deliverable/Criteria for Completion:**
    - A manual code review of the remaining modules confirms no explicit `any`
      types are present.

---

#### **Phase 3: Finalization and CI Integration**

- **Objective(s):** Validate the complete refactoring with the linter and
  permanently integrate the linting step into the CI pipeline.
- **Priority:** Medium

- **Task 3.1: Global Linting and Final Fixes**
  - **Rationale/Goal:** Run the linter across the entire project to catch any
    remaining issues before enabling it in CI.
  - **Estimated Effort:** S
  - **Deliverable/Criteria for Completion:**
    - Running `deno lint` in the project root completes with zero errors.
    - Any issues reported by the linter are fixed.

- **Task 3.2: Enable Linting in CI Workflow**
  - **Rationale/Goal:** To enforce type safety standards automatically on all
    future code changes.
  - **Estimated Effort:** S
  - **Deliverable/Criteria for Completion:**
    - Modify `.github/workflows/ci.yml`.
    - The `Lint code` step is uncommented.
    - A pull request with this change passes all CI checks, including the new
      lint step.

- **Task 3.3 (Optional): Create a Unified Check Task**
  - **Rationale/Goal:** Improve local development experience by providing a
    single command to run all quality checks.
  - **Estimated Effort:** S
  - **Deliverable/Criteria for Completion:**
    - Modify `deno.json`.
    - A new task, e.g.,
      `"check": "deno fmt --check && deno lint && deno task test"`, is added.

## 4. Key Considerations & Risk Mitigation

### 4.1. Technical Risks & Challenges

- **Risk:** Introducing regressions. Changing types, especially in complex areas
  like the test mocks, could inadvertently alter behavior.
  - **Mitigation:** The project has a good test suite. Run all tests after each
    task in the plan is completed. The phased approach isolates changes, making
    it easier to pinpoint the source of any new issue.
- **Risk:** `MockKv` implementation. Fully implementing the `Deno.Kv` interface
  (Task 1.4) can be tedious.
  - **Mitigation:** Focus on implementing only the method signatures correctly.
    The bodies of unused methods can simply throw an error like
    `throw new Error("Not implemented in mock");`.

### 4.2. Dependencies

- **Internal:** The phases are sequential. Phase 1 is a prerequisite for Phase
  2, as a type-safe testing environment is needed to validate application code
  changes confidently. Phase 3 is the final step.
- **External:** This plan has no external dependencies on other teams or
  services.

### 4.3. Non-Functional Requirements (NFRs) Addressed

- **Maintainability:** A strictly-typed codebase is significantly easier to
  read, understand, and refactor. This directly improves long-term
  maintainability.
- **Reliability:** Eliminating `any` reduces the likelihood of runtime type
  errors, making the application more robust and reliable.
- **Developer Experience:** Clear types serve as documentation and enable better
  autocompletion and error-checking in IDEs, improving developer productivity.

## 5. Success Metrics / Validation Criteria

- **Primary Metric:** The `deno lint` command runs successfully as part of the
  CI pipeline on every pull request to the `main` branch.
- **Secondary Metric:** A search for the string `any` in `.ts` files yields zero
  results for explicit type annotations (excluding `any` within comments or
  string literals).
- **Qualitative Metric:** The development team reports increased confidence and
  speed when working with the codebase due to improved type safety and IDE
  support.

## 6. Assumptions Made

- The existing test suite provides sufficient coverage to detect any potential
  regressions introduced during the refactoring.
- The types provided by third-party libraries (`grammY`, `grammy_conversations`,
  etc.) are accurate and complete.
- The development team has the necessary TypeScript skills to implement the
  proposed changes.

## 7. Open Questions / Areas for Further Investigation

- For Task 1.4, is a full implementation of the `Deno.Kv` interface in `MockKv`
  the desired approach, or would a less complete mock with continued casting in
  a few specific test setup locations be acceptable to save time? (This plan
  recommends the full implementation for maximum benefit).

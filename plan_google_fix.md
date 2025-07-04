# Bug Analysis Report: Test Failures in Scheduler and Reminder Handlers

## 1. Executive Summary

This report analyzes two distinct test failures observed in the `deno test`
output. The root causes for both failures have been identified as flaws within
the test implementations themselves, rather than bugs in the application's core
logic.

- **Failure 1 (`SchedulerService` Test):** The test fails because it attempts to
  create a reminder using a string (`"Test Reminder 1"`) that contains no date
  information. The `ReminderRepository.create` method correctly rejects this
  invalid input by design, causing the test to crash. The test case is providing
  invalid data.
- **Failure 2 (`ReminderHandlers` Test):** This test fails due to an
  `AssertionError`. The test logic incorrectly constructs the expected output
  string. It uses the current date (`new Date()`) to verify reminders that were
  set for future dates ("tomorrow" and "in 2 days"), leading to a guaranteed
  mismatch.

The key modules involved are the test files `src/core/scheduler.test.ts` and
`src/modules/reminders/reminders.handlers.test.ts`, and the application module
`src/modules/reminders/reminders.repository.ts`.

## 2. Bug Description and Context (from `User Task`)

- **Observed Behavior:** Running `deno test` results in two failed tests with
  specific error messages.
- **Expected Behavior:** All tests should pass successfully.
- **Steps to Reproduce (STR):** Execute the command
  `deno test --allow-read --allow-write --allow-net --allow-env --unstable-kv --allow-import`.
- **Environment:** Deno v2.3.5
- **Error Messages:**
  1. `error: Error: Could not parse date from: "Test Reminder 1"` in
     `SchedulerService - checkAndSendReminders ... sends reminder and deletes it`.
  2. `error: AssertionError: spy not called with expected args` in
     `ReminderHandlers - remindersHandler ... should reply with a list of reminders if reminders exist`,
     with a date mismatch in the diff.

## 3. Code Execution Path Analysis

Two independent execution paths lead to the failures.

### 3.1. Failure 1: `SchedulerService` Test Path

- **Entry Point:** The test step `"sends reminder and deletes it"` within
  `src/core/scheduler.test.ts`.
- **Execution Flow:**
  ```mermaid
  sequenceDiagram
      participant Test as scheduler.test.ts
      participant Repo as ReminderRepository
      participant Chrono as chrono-node
      Test->>Repo: create(123, "Test Reminder 1")
      Repo->>Chrono: parseDate("Test Reminder 1", ...)
      Chrono-->>Repo: returns null (no date found)
      Repo-->>Repo: Checks if date is null (it is)
      Repo-->>Test: throws Error("Could not parse date...")
      Test-->>Test Runner: FAILED
  ```
- **Detailed Trace:**
  1. **`scheduler.test.ts:35`:** The test calls
     `await reminderRepo.create(userId, reminderString);` where `reminderString`
     is `"Test Reminder 1"`.
  2. **`reminders.repository.ts:14`:** Inside the `create` method,
     `chrono.parseDate` is called with the string `"Test Reminder 1"`.
  3. **`chrono-node` library:** The library cannot find any parsable date or
     time information in the input string and returns `null`.
  4. **`reminders.repository.ts:20`:** The code executes the condition
     `if (!reminderDate)`. Since `reminderDate` is `null`, the condition is
     true.
  5. **`reminders.repository.ts:21`:** An `Error` is thrown, which propagates up
     and causes the test to fail. This is the correct behavior for the
     repository but reveals a flaw in the test's input.

### 3.2. Failure 2: `ReminderHandlers` Test Path

- **Entry Point:** The test step
  `"should reply with a list of reminders if reminders exist"` within
  `src/modules/reminders/reminders.handlers.test.ts`.
- **Execution Flow:**
  1. **`reminders.handlers.test.ts:62-66`:** The test successfully creates two
     reminders using `reminderService.addReminder` with inputs
     `"Test Reminder 1 завтра"` and `"Test Reminder 2 через 2 дня"`. The service
     correctly parses these relative dates and stores them.
  2. **`reminders.handlers.test.ts:67`:** The test calls
     `handlers.remindersHandler(ctx)`. This eventually calls
     `reminderService.getRemindersList`, which formats a reply string using the
     stored future dates. This becomes the **Actual Result**.
  3. **`reminders.handlers.test.ts:68-76`:** The test constructs an
     `expectedReply` string to compare against. It uses
     `new Date().toLocaleString(...)` for _both_ reminders. This generates a
     string with today's date for both lines. This is the **Expected Result**.
  4. **`reminders.handlers.test.ts:77`:** `assertSpyCall` compares the **Actual
     Result** (containing future dates) with the **Expected Result** (containing
     today's date). The strings do not match.
  5. **Bug Manifestation:** An `AssertionError` is thrown due to the mismatch
     between the correctly generated list and the incorrectly constructed
     expected string.

## 4. Potential Root Causes and Hypotheses

### 4.1. Hypothesis 1: Flawed Test Input in `scheduler.test.ts` (High Confidence)

- **Rationale/Evidence:** The stack trace clearly shows the error
  `Could not parse date from: "Test Reminder 1"` originates from the
  `ReminderRepository`. The repository's `create` method is designed to parse a
  date from the input string. The test provides a string with no date, which is
  invalid input for this method.
- **Code (Relevant Snippets):**
  - Test call in `src/core/scheduler.test.ts`:
    ```typescript
    // line 34
    const reminderString = "Test Reminder 1";
    const reminder = await reminderRepo.create(userId, reminderString);
    ```
  - Validation logic in `src/modules/reminders/reminders.repository.ts`:
    ```typescript
    // line 14
    const reminderDate = chrono.parseDate(
      reminderString,
      // ...
    );

    if (!reminderDate) { // This condition becomes true
      throw new Error(`Could not parse date from: "${reminderString}"`);
    }
    ```
- **How it leads to the bug:** The test is not testing the scheduler's logic
  correctly. It fails at the setup stage because it violates the contract of the
  `ReminderRepository.create` method.

### 4.2. Hypothesis 2: Incorrect Test Assertion Logic in `reminders.handlers.test.ts` (High Confidence)

- **Rationale/Evidence:** The test creates reminders for "tomorrow" and "in 2
  days". The application logic correctly calculates and stores these future
  dates. However, the test's assertion logic builds an expected string using
  `new Date()` (i.e., "today") for both reminders, making the comparison
  impossible to pass. The diff in the error log confirms a date mismatch.
- **Code (Relevant Snippets):**
  - Test setup in `src/modules/reminders/reminders.handlers.test.ts`:
    ```typescript
    // lines 62-66
    await reminderService.addReminder(ctx.from!.id, "Test Reminder 1 завтра");
    await reminderService.addReminder(
      ctx.from!.id,
      "Test Reminder 2 через 2 дня",
    );
    ```
  - Flawed assertion logic in
    `src/modules/reminders/reminders.handlers.test.ts`:
    ```typescript
    // lines 68-76
    const expectedReply = `1. Test Reminder 1 завтра (${
      new Date().toLocaleString("ru-RU", { // <-- Incorrect: uses today's date
        //...
      })
    })\n2. Test Reminder 2 через 2 дня (${
      new Date().toLocaleString("ru-RU", { // <-- Incorrect: uses today's date
        //...
      })
    })`;
    ```
- **How it leads to the bug:** The assertion compares a correctly formatted
  string from the application with an incorrectly constructed string from the
  test, leading to a predictable `AssertionError`.

### 4.3. Most Likely Cause(s)

Both hypotheses are confirmed by the provided code and error logs. They are two
separate issues in two different test files.

## 5. Supporting Evidence from Code

- **Failure 1:** `src/core/scheduler.test.ts:35` calls `reminderRepo.create`
  with the dateless string `"Test Reminder 1"`.
- **Failure 2:** `src/modules/reminders/reminders.handlers.test.ts:68-76`
  contains the flawed logic for constructing `expectedReply` using `new Date()`
  instead of calculating the correct future dates for the assertion.

## 6. Recommended Steps for Debugging and Verification

### For Failure 1 (`SchedulerService` Test):

- **Code Fix:** Modify the test in `src/core/scheduler.test.ts` to provide a
  valid input string that `chrono-node` can parse. This will allow the test to
  proceed past the setup phase and actually test the scheduler's functionality.
  - **Change this:**
    ```typescript
    const reminderString = "Test Reminder 1";
    ```
  - **To this:**
    ```typescript
    const reminderString = "Test Reminder 1 tomorrow at 10am"; // Or any other valid relative date
    ```

### For Failure 2 (`ReminderHandlers` Test):

- **Code Fix:** Refactor the test logic in
  `src/modules/reminders/reminders.handlers.test.ts` to build the
  `expectedReply` string correctly. This involves creating `Date` objects for
  the expected future dates.
  - **Suggestion:**
    ```typescript
    // In the test step, before the handler call:
    const now = new Date(); // Or a mocked, fixed date
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const inTwoDays = new Date(now);
    inTwoDays.setDate(now.getDate() + 2);

    // A more robust approach would be to mock the date/time to make the test deterministic.
    // For now, a simple fix is to construct the expected string correctly.
    // Note: This is still brittle due to time-of-day differences. A better fix might be to use string matching.

    // A less brittle assertion:
    const replySpy = ctx.reply as Spy<any>;
    await handlers.remindersHandler(ctx);
    const actualReply = replySpy.calls[1].args[0];

    assert(actualReply.includes("1. Test Reminder 1 завтра"));
    assert(actualReply.includes("2. Test Reminder 2 через 2 дня"));
    ```
- **Logging:** Before the assertion, add `console.log` statements to inspect the
  values.
  ```typescript
  console.log("ACTUAL:", replySpy.calls[1].args[0]);
  console.log("EXPECTED:", expectedReply);
  assertSpyCall(replySpy, 1, { args: [expectedReply] });
  ```

## 7. Bug Impact Assessment

The primary impact is a broken test suite, which blocks the Continuous
Integration (CI) process and prevents merging new code with confidence. The
failures do not indicate bugs in the production logic but rather highlight flaws
in the tests designed to protect that logic. If left unfixed, the team loses the
safety net that automated testing provides.

## 8. Assumptions Made During Analysis

- The `chrono-node` library is functioning as expected.
- The `clearDb` helper function is working correctly, ensuring test isolation.
- The goal of the `SchedulerService` test was to check the sending/deleting
  logic, not to test the creation of reminders with invalid data.

## 9. Open Questions / Areas for Further Investigation

- No open questions remain. The causes are clearly identified in the test files.
  The team should consider adopting a more robust testing strategy for
  date/time-sensitive features, such as using a date-mocking library to make
  tests deterministic and less brittle.

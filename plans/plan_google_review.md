# Refactoring Plan: Enhancing Modularity and Robustness

## 1. Executive Summary & Goals

This document outlines a targeted refactoring plan based on a code review of the
current bot architecture. While the existing structure is well-modularized
following the `plan_google.md` guide, this review identifies two key areas for
improvement that will significantly enhance long-term maintainability and
operational correctness.

The primary objective is to make feature modules truly self-contained and to
eliminate a potential race condition in data manipulation logic.

- **Goal 1: Achieve True Command Modularity.** Refactor the system so that each
  feature module declares its own public commands, removing the centralized,
  hardcoded command list from the core application file.
- **Goal 2: Increase Service Layer Robustness.** Modify services that perform
  mutations (delete, update) to operate on stable, unique identifiers (UUIDs)
  instead of fragile, UI-dependent list indexes.

## 2. Current Situation Analysis

The current codebase successfully implements the modular architecture proposed
in `plan_google.md`, with a clean separation of concerns into `core` and
`modules`. However, a detailed review reveals the following pain points:

1. **Centralized Command Registration:** In `src/core/app.ts`, the
   `bot.api.setMyCommands([...])` call contains a hardcoded array of all
   commands from all modules. This breaks the principle of modularity. When a
   developer adds a new command in a module (e.g., `cleartasks` in
   `tasks.module.ts`), they must also remember to update the central list in
   `app.ts`. This is error-prone and hinders the "plug-and-play" nature of
   modules.

2. **Fragile Index-Based Operations:** The `TaskService` and `ReminderService`
   use user-provided list indexes to identify which item to delete or modify.
   For example, `TaskService.deleteTask(userId, index)` receives a number,
   fetches all tasks for the user, and then deletes the task at
   `tasks[index - 1]`. This is inefficient and, more importantly, creates a race
   condition. If the list of tasks changes between the time the user views the
   list and the time they issue the delete command, they could inadvertently
   delete the wrong task. The service layer should operate on stable data
   identifiers, not transient UI indexes.

## 3. Proposed Solution / Refactoring Strategy

### 3.1. High-Level Design / Architectural Overview

We will refine the module interface to make modules self-describing and harden
the service layer contract.

1. **Module Command Declaration:** Each module's entry point (`*.module.ts`)
   will be responsible for exporting a list of its public commands. The core
   application (`app.ts`) will then aggregate these commands from all loaded
   modules and register them with Telegram dynamically.

2. **ID-Based Service Logic:** Service methods will be updated to accept unique
   entity IDs (e.g., `taskId`) instead of list indexes. The conversation layer
   will be responsible for mapping a user's numerical input to the correct
   entity ID before calling the service.

The new command registration flow will look like this:

```mermaid
graph TD
    subgraph Core
        App[app.ts]
    end

    subgraph Modules
        TasksModule[tasks.module.ts]
        RemindersModule[reminders.module.ts]
        OtherModule[...]
    end

    TasksModule -- "returns { commands: [...] }" --> App
    RemindersModule -- "returns { commands: [...] }" --> App
    OtherModule -- "returns { commands: [...] }" --> App

    App -- "1. Collects all commands" --> Aggregator((Aggregate))
    Aggregator -- "2. Builds final list" --> FinalList([BotCommand[]])
    App -- "3. Registers with Telegram" --> TelegramAPI[bot.api.setMyCommands]
    FinalList --> TelegramAPI

    style App fill:#bbf,stroke:#333,stroke-width:2px
```

### 3.2. Key Components / Modules

- **`src/core/types.ts`**: Will be updated with a new `Module` interface to
  formalize the contract between the core app and the feature modules.
- **`src/core/app.ts`**: Will be modified to dynamically load modules, collect
  their command definitions, and register the aggregated list. The hardcoded
  command list will be removed.
- **`src/modules/*/(*.service.ts)`**: Method signatures for `delete` and
  `toggle`/`update` operations will be changed from `(userId, index)` to
  `(userId, entityId)`.
- **`src/modules/*/(*.conversations.ts)`**: The logic within conversations that
  handle deletion/updates will be enhanced. It will now temporarily store the
  fetched list of items in the conversation's session, map the user's numerical
  input to a stable ID from that list, and then call the service with the ID.

### 3.3. Detailed Action Plan / Phases

#### Phase 1: Implement Modular Command Registration

- **Objective(s):** Decouple command registration from the core application.
- **Priority:** High

- **Task 1.1: Define the Module Interface**
  - **Rationale/Goal:** Create a clear, typed contract for what a module must
    provide to the core application.
  - **Estimated Effort:** S
  - **Deliverable/Criteria for Completion:** In `src/core/types.ts`, add a new
    interface:
    ```typescript
    import { BotCommand } from "https://deno.land/x/grammy@v1.36.3/types.ts";

    export interface Module {
      commands: BotCommand[];
      // Can be expanded in the future with other module metadata
    }
    ```

- **Task 1.2: Refactor Feature Modules to Export Commands**
  - **Rationale/Goal:** Make each module self-contained by having it declare its
    own commands.
  - **Estimated Effort:** M
  - **Deliverable/Criteria for Completion:**
    - Modify `tasks.module.ts` so `tasksModule` returns a `Module` object (e.g.,
      `export const tasksModule = (bot: Bot<MyContext>): Module => { ...; return { commands: [...] }; }`).
    - The `commands` array should contain
      `{ command: 'addtask', description: '...' }`,
      `{ command: 'deletetask', ... }`, etc.
    - Repeat this process for `reminders.module.ts` and all other active
      modules.

- **Task 1.3: Update Core App to Aggregate Commands**
  - **Rationale/Goal:** Make the main application dynamically build the command
    list from the loaded modules.
  - **Estimated Effort:** S
  - **Deliverable/Criteria for Completion:**
    - In `src/core/app.ts`, modify the module initialization section.
    - Create an array to hold all module definitions:
      `const modules: Module[] = [];`
    - Call each module and push its result: `modules.push(tasksModule(bot));`,
      `modules.push(remindersModule(bot));`, etc.
    - Use `flatMap` to create a single list of commands:
      `const allCommands = modules.flatMap(m => m.commands);`
    - Call `await bot.api.setMyCommands(allCommands);`.
    - The old, large, hardcoded `setMyCommands` block is deleted.

---

#### Phase 2: Refactor `Tasks` Module for ID-Based Operations

- **Objective(s):** Eliminate the race condition in the task service by using
  stable IDs.
- **Priority:** High

- **Task 2.1: Update `TaskService` Method Signatures**
  - **Rationale/Goal:** Harden the service layer to prevent incorrect data
    manipulation.
  - **Estimated Effort:** S
  - **Deliverable/Criteria for Completion:**
    - In `src/modules/tasks/tasks.service.ts`, change
      `deleteTask(userId: number, index: number)` to
      `deleteTask(userId: number, taskId: string)`. The implementation will no
      longer fetch all tasks but will directly call
      `taskRepository.delete(userId, taskId)`.
    - Change `toggleTask(userId: number, index: number)` to
      `toggleTask(userId: number, taskId: string)`. The implementation will
      similarly be simplified to use the ID directly.

- **Task 2.2: Refactor `deleteTaskConversation` and `doneTaskConversation`**
  - **Rationale/Goal:** Adapt the UI/conversation layer to work with the
    updated, more robust service layer.
  - **Estimated Effort:** M
  - **Deliverable/Criteria for Completion:**
    1. In `src/modules/tasks/tasks.conversations.ts`, inside
       `deleteTaskConversation`, after fetching the list of tasks, store it in
       the conversation session: `conversation.session.tasksForAction = tasks;`.
    2. When the user provides a numerical input, validate the index against the
       length of the stored list.
    3. Retrieve the specific task:
       `const taskToDelete = conversation.session.tasksForAction[index - 1];`.
    4. Call the service with the stable ID:
       `await taskService.deleteTask(fromId, taskToDelete.id);`.
    5. Repeat this pattern for `doneTaskConversation`.

---

#### Phase 3: Refactor `Reminders` Module for ID-Based Operations

- **Objective(s):** Apply the same robustness fix to the reminders module.
- **Priority:** Medium

- **Task 3.1: Update `ReminderService` Method Signature**
  - **Rationale/Goal:** Align the reminder service with the new ID-based
    pattern.
  - **Estimated Effort:** S
  - **Deliverable/Criteria for Completion:** In
    `src/modules/reminders/reminders.service.ts`, change
    `deleteReminder(userId: number, reminderId: string)`'s implementation to be
    more direct if it currently relies on an index-based lookup (the current
    implementation already correctly uses an ID, but this task serves as a
    verification step).

- **Task 3.2: Refactor `deleteReminderConversation`**
  - **Rationale/Goal:** Adapt the reminder deletion conversation to the robust
    ID-based flow.
  - **Estimated Effort:** M
  - **Deliverable/Criteria for Completion:** In
    `src/modules/reminders/reminders.conversations.ts`, implement the same
    pattern as in Task 2.2: fetch reminders, store in session, get user's
    numerical choice, map to ID, and call the service with the ID.

### 3.4. Data Model Changes

No changes to the underlying Deno KV data models are required. The existing
`Task` and `Reminder` types already include unique ID fields (`id` and
`reminderId` respectively), which this refactoring will leverage.

### 3.5. API Design / Interface Changes

- **New Interface:** `Module` in `src/core/types.ts`.
- **Modified Function Signatures:**
  - `tasksModule(bot): void` -> `tasksModule(bot): Module`
  - `remindersModule(bot): void` -> `remindersModule(bot): Module`
  - `TaskService.deleteTask(userId, index)` ->
    `TaskService.deleteTask(userId, taskId)`
  - `TaskService.toggleTask(userId, index)` ->
    `TaskService.toggleTask(userId, taskId)`

## 4. Key Considerations & Risk Mitigation

### 4.1. Technical Risks & Challenges

- **Risk:** Storing lists of items in the conversation session
  (`conversation.session.tasksForAction`) could consume memory if the lists are
  very large.
- **Mitigation:** This is a low risk for a typical user-based bot. The data is
  scoped to a single user's interactive session and is cleaned up automatically.
  For extreme cases, pagination could be introduced in the conversation, but
  this is out of scope for the current plan.
- **Risk:** Forgetting to update a module to return the new `Module` interface
  will cause a TypeScript error, but could be missed if not checked.
- **Mitigation:** The change in `app.ts` to expect a `Module[]` array will
  enforce the new pattern at compile time, making it a self-correcting change.

### 4.2. Dependencies

- Phase 2 and 3 (Service/Conversation refactoring) are logically dependent on
  the conceptual shift to ID-based operations but can be worked on in parallel
  with Phase 1 (Modular Commands).

### 4.3. Non-Functional Requirements (NFRs) Addressed

- **Maintainability:** Significantly improved. Developers can add/remove/modify
  commands by only touching files within a single module's directory. The
  service layer logic becomes simpler and more predictable.
- **Reliability & Correctness:** Significantly improved. The removal of
  index-based mutations eliminates a class of race-condition bugs, ensuring
  users always act on the exact item they intended.
- **Scalability:** The modular command system makes it easier to manage a
  growing number of features without cluttering the core application logic.

## 5. Success Metrics / Validation Criteria

- **Metric 1:** The hardcoded `bot.api.setMyCommands` block in `src/core/app.ts`
  is completely removed.
- **Metric 2:** Adding a new command to `tasks.module.ts` and restarting the bot
  results in that command appearing in Telegram's command list without any
  changes to `app.ts`.
- **Validation 1:** A manual test confirms that deleting task #2 from a list of
  3 correctly removes the intended task, and the service method was called with
  the task's UUID, not the number `2`.
- **Validation 2:** Code review confirms that `TaskService` and
  `ReminderService` methods no longer accept numerical indexes for mutation
  operations.

## 6. Assumptions Made

- The current `grammy_conversations` session storage (Deno KV) is performant
  enough to handle temporarily storing a user's list of tasks or reminders
  during an interactive session. This is a safe assumption for typical usage
  patterns.
- The `plan_google.md` is a guiding document, and improving upon its
  implementation (as this plan does) is desired.

## 7. Open Questions / Areas for Further Investigation

- **Shared Conversation Logic:** The "list-select-act" pattern will be
  duplicated in `tasks.conversations.ts` and `reminders.conversations.ts`.
  Should we create a generic, reusable conversation factory in `src/lib` to
  handle this pattern to keep the code DRY?
- **Core Command Handling:** Where should generic commands like `/start`,
  `/help`, and `/menu` be defined? Should they be moved from `app.ts` into a
  new, dedicated `src/modules/core` or `src/modules/general` module to follow
  the new pattern consistently?

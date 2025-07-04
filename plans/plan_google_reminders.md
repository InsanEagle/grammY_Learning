# Refactoring Plan: Completing the Modular & Stateless Bot Architecture

## 1. Executive Summary & Goals

This plan addresses your specific questions regarding the current state of your
bot's refactoring. It provides a detailed analysis and an actionable roadmap to
complete the transition to the robust, modular, and stateless architecture
envisioned in `plan_google.md`.

The primary objective is to resolve architectural ambiguities, correct the
scheduler implementation, and fully eliminate legacy code, resulting in a truly
maintainable and reliable system.

### Key Goals:

1. **Achieve True Statelessness:** Correct the `scheduler.ts` implementation to
   be a purely database-driven, stateless polling service, removing the
   dependency on `node-schedule` and in-memory job stores.
2. **Finalize Modularity:** Completely remove the `_legacy` directory by
   migrating the `mainMenu` into a new, central module that other feature
   modules can plug into.
3. **Clarify Core Structure:** Establish a clean "Composition Root" pattern by
   simplifying the root `bot.ts` and defining the precise responsibilities of
   the core application setup.

## 2. Current Situation Analysis

You have made excellent progress in modularizing the `tasks` and `reminders`
features. The use of Repository and Service patterns is well-executed. However,
there are several key areas where the current implementation deviates from the
target architecture or requires clarification.

- **Pain Point 1: `scheduler.ts` Implementation (Your Question 1)**
  - **Analysis:** Your current `scheduler.ts` is a hybrid model. It correctly
    polls the database but then uses the in-memory `node-schedule` library to
    create jobs. This re-introduces the exact problem the `plan_google.md` aimed
    to solve: lack of persistence and reliability. If the bot restarts, all
    in-memory jobs created by `node-schedule` are lost.
  - **Evaluation:** This implementation does not meet the goal of a reliable,
    stateless scheduler. It's an improvement over no persistence but falls short
    of the target architecture.

- **Pain Point 2: Legacy Code & `mainMenu` (Your Question 2)**
  - **Analysis:** The `mainMenu.ts` remains in `src/_legacy`, acting as a
    central point of dependency. Both the root `bot.ts` and the new feature
    modules (`tasks.module.ts`, `reminders.module.ts`) import it. This creates
    an undesirable link from new, clean code back to legacy code, preventing the
    `_legacy` folder from ever being removed.
  - **Evaluation:** This is a classic refactoring bottleneck. The menu needs to
    be modernized and integrated into the new modular structure.

- **Pain Point 3: `core/bot.ts` vs. root `bot.ts` (Your Question 3)**
  - **Analysis:** The presence of an empty `src/core/bot.ts` and a large,
    functional root `bot.ts` is a source of confusion, as you correctly
    identified. The root `bot.ts` is currently doing too much: initializing the
    bot, registering all middleware, setting commands, and defining handlers.
    This violates the "Clean Core" principle from the plan.
  - **Evaluation:** The structure needs clarification. The root `bot.ts` should
    be a minimal "executable," while the main application setup and wiring
    should happen within the `src` directory.

## 3. Proposed Solution / Refactoring Strategy

### 3.1. High-Level Design / Architectural Overview

We will strictly adhere to the stateless, modular architecture. The key change
is that the scheduler will not schedule anything in memory; it will simply _act_
on data it finds in the database during its polling cycle.

```mermaid
graph TD
    subgraph BotApplication
        direction TB
        RootBot[bot.ts (Executable)] -- runs --> App
        App{app.ts (Composition Root)} -- creates --> BotInstance
        App -- initializes --> Scheduler[Stateless Scheduler Service]
        App -- loads --> Modules

        subgraph Core
            BotInstance -- uses --> Config[config.ts]
            BotInstance -- uses --> DB[(Deno KV)]
            BotInstance -- uses --> MainMenu[menu.module.ts]
        end

        subgraph Modules
            direction LR
            Tasks[Tasks Module] -- registers with --> MainMenu
            Reminders[Reminders Module] -- registers with --> MainMenu
        end

        subgraph LogicFlow
            RemindersService[Reminders Service] -- writes reminder to --> DB
            Scheduler -- polls --> DB
            Scheduler -- finds due reminder & sends via --> BotInstance
        end
    end

    User -- sends /addreminder --> BotInstance
    BotInstance -- routes to --> Reminders[Reminders Module]
    Scheduler -- sends notification --> User

    style DB fill:#f9f,stroke:#333,stroke-width:2px
    style Scheduler fill:#bbf,stroke:#333,stroke-width:2px
```

### 3.2. Key Components / Modules

- **`bot.ts` (Root):** Becomes a minimal executable (~5 lines). Its only job is
  to import the application factory from `src`, create the bot, and start it.
- **`src/app.ts` (New):** The "Composition Root". This file will contain the
  logic currently in `bot.ts`. It will initialize the bot instance, middleware,
  modules, and services.
- **`src/modules/menu/menu.module.ts` (New):** A new module to house the main
  menu. It will export the `mainMenu` instance and a function to initialize it.
  Feature modules will call this function to register their sub-menus.
- **`src/core/scheduler.ts` (Refactored):** Will be rewritten to be completely
  stateless.

### 3.3. Detailed Action Plan / Phases

#### Phase 1: Core Architecture Refinement

- **Objective(s):** Establish a clean composition root and modularize the main
  menu.
- **Priority:** High

- **Task 1.1: Create the Composition Root (`app.ts`)**
  - **Rationale/Goal:** To answer your question about `core/bot.ts` and clean up
    the entry point. We will centralize application setup logic in one place
    inside `src`.
  - **Estimated Effort:** S
  - **Deliverable/Criteria for Completion:**
    1. Create a new file: `src/app.ts`.
    2. Move almost all code from the root `bot.ts` into a `createBot` function
       inside `src/app.ts`.
    3. The root `bot.ts` should be simplified to:
       ```typescript
       // bot.ts (root)
       import { createBot } from "./src/app.ts";

       const bot = await createBot();

       // Start the bot.
       bot.start();
       ```
    4. Delete the empty and confusing `src/core/bot.ts` file.

- **Task 1.2: Create the `Menu` Module**
  - **Rationale/Goal:** To answer your question about `mainMenu` and break the
    dependency on `_legacy`.
  - **Estimated Effort:** M
  - **Deliverable/Criteria for Completion:**
    1. Create a new directory `src/modules/menu`.
    2. Create `src/modules/menu/menu.module.ts`. This file will create and
       export the main menu instance.
       ```typescript
       // src/modules/menu/menu.module.ts
       import { Menu } from "https://deno.land/x/grammy_menu@v1.3.0/mod.ts";
       import { MyContext } from "../../core/types.ts";

       // Create the main menu instance that will be built by other modules
       export const mainMenu = new Menu<MyContext>("root-menu");

       // A function for other modules to register their sub-menus
       export const registerMenu = (menu: Menu<MyContext>) => {
         mainMenu.register(menu);
       };
       ```
    3. In `src/app.ts`, import and use this new `mainMenu`:
       `bot.use(mainMenu);`.
    4. Update `tasks.module.ts` and `reminders.module.ts` to import
       `registerMenu` from the new menu module and use it to add their
       sub-menus, instead of importing from `_legacy`.

#### Phase 2: Implement the Stateless Scheduler

- **Objective(s):** Correct the scheduler implementation to be reliable and
  persistent, fully removing `node-schedule`.
- **Priority:** High

- **Task 2.1: Refactor `scheduler.ts`**
  - **Rationale/Goal:** To answer your question about the quality of your
    scheduler. This change implements the robust, stateless pattern from the
    plan.
  - **Estimated Effort:** M
  - **Deliverable/Criteria for Completion:**
    1. Remove the `npm:node-schedule` import and the `jobStore` map.
    2. Rewrite the `SchedulerService` to poll the database, send notifications
       directly, and update the record.
       ```typescript
       // src/core/scheduler.ts (Target Implementation)
       import { Bot } from "https://deno.land/x/grammy@v1.36.3/mod.ts";
       import { kv } from "./database.ts";
       import { Reminder } from "../modules/reminders/reminders.types.ts";
       import { MyContext } from "./types.ts";

       export class SchedulerService {
         constructor(private readonly bot: Bot<MyContext>) {}

         // Run the scheduler at a given interval (e.g., every 30 seconds)
         run(intervalMs: number) {
           setInterval(() => this.checkAndSendReminders(), intervalMs);
           console.log(
             `Scheduler started. Polling every ${intervalMs / 1000} seconds.`,
           );
         }

         private async checkAndSendReminders() {
           const iter = kv.list<Reminder>({ prefix: ["reminders_by_user"] });
           const now = new Date();

           for await (const entry of iter) {
             const reminder = entry.value;

             // Check if the reminder is due and has not been sent yet
             if (reminder.reminderDate <= now && reminder.reminderIsActive) {
               try {
                 await this.bot.api.sendMessage(
                   reminder.reminderUserId,
                   `🔔 Reminder: ${reminder.reminderString}`,
                 );

                 // Mark the reminder as inactive/sent to prevent re-sending
                 const updatedReminder: Reminder = {
                   ...reminder,
                   reminderIsActive: false,
                 };
                 await kv.set(entry.key, updatedReminder);

                 console.log(
                   `Sent and marked reminder ${reminder.reminderId} for user ${reminder.reminderUserId}`,
                 );
               } catch (error) {
                 console.error(
                   `Failed to send reminder ${reminder.reminderId}:`,
                   error,
                 );
                 // Optionally, handle errors (e.g., user blocked the bot) by deleting the reminder
               }
             }
           }
         }
       }
       ```

- **Task 2.2: Update `ReminderService` and `app.ts`**
  - **Rationale/Goal:** Ensure new reminders are simply saved to the database,
    and the scheduler is started correctly.
  - **Estimated Effort:** S
  - **Deliverable/Criteria for Completion:**
    1. Verify that `reminders.service.ts` and `reminders.repository.ts` do not
       contain any logic related to `node-schedule`. Their only job is to
       perform CRUD operations on the database. The `reminderIsActive` flag is
       crucial here.
    2. In `src/app.ts`, instantiate and start the new scheduler:
       ```typescript
       // In src/app.ts, inside createBot()
       // ... after bot is created
       const schedulerService = new SchedulerService(bot);
       schedulerService.run(30000); // Run every 30 seconds
       ```

#### Phase 3: Finalize Migration & Cleanup

- **Objective(s):** Migrate all remaining functionality out of `_legacy` and
  delete it.
- **Priority:** Medium

- **Task 3.1: Migrate Remaining Legacy Menus**
  - **Rationale/Goal:** To fully embrace the modular pattern for all features.
  - **Estimated Effort:** L
  - **Deliverable/Criteria for Completion:**
    1. For each menu in `src/_legacy/menus` (`currencies`, `weather`, etc.),
       create a corresponding new module in `src/modules/`.
    2. Each new module should follow the established pattern: `*.module.ts`,
       `*.menu.ts`, `*.handlers.ts`, etc.
    3. The `*.module.ts` file for each new feature will register its menu using
       the `registerMenu` function from Phase 1.
    4. The `src/app.ts` file will be updated to initialize these new modules.

- **Task 3.2: Delete Legacy Code**
  - **Rationale/Goal:** The final step to a clean, maintainable codebase.
  - **Estimated Effort:** S
  - **Deliverable/Criteria for Completion:**
    1. Once all features are migrated, delete the entire `src/_legacy`
       directory.
    2. Remove any remaining imports that point to the old directory.

## 4. Key Considerations & Risk Mitigation

- **Technical Risks & Challenges:**
  - **Risk:** The new scheduler logic might miss reminders or send duplicates if
    not implemented carefully.
  - **Mitigation:** The `reminderIsActive` flag is critical. By fetching a
    reminder, sending it, and _then immediately_ updating its flag to `false` in
    the database, we make the operation idempotent. Even if the bot checks again
    before the next poll, the flag will prevent a duplicate message. Thoroughly
    test this by setting reminders for a few seconds in the future and
    restarting the bot.
- **Dependencies:**
  - Phase 2 (Scheduler) depends on the `reminderIsActive` flag being present in
    the `Reminder` type and correctly managed by the `ReminderService`.
  - Phase 3 (Cleanup) depends on the successful completion of Phases 1 and 2.

- **Non-Functional Requirements (NFRs) Addressed:**
  - **Reliability:** The stateless, polling scheduler ensures that no reminders
    are lost on restart. The bot's state is entirely in the Deno KV database.
  - **Maintainability:** With the `_legacy` folder gone and all features
    (including menus) fully modularized, adding or changing features becomes
    simple and isolated. The clean composition root in `src/app.ts` makes the
    application's startup sequence easy to understand.

## 5. Success Metrics / Validation Criteria

1. **Scheduler Correctness:** A reminder set for 1 minute in the future is
   successfully delivered even if the bot is restarted 30 seconds after
   creation.
2. **Code Structure:** The `src/_legacy` directory is completely deleted. The
   root `bot.ts` file is less than 15 lines of code.
3. **Modularity:** A new feature can be disabled entirely by commenting out one
   line in `src/app.ts` (the module initialization call).
4. **No In-Memory State:** The project has zero dependencies on `node-schedule`,
   and no in-memory `jobStore` or similar constructs exist for scheduling.

## 6. Assumptions Made

- The `Reminder` type (`reminders.types.ts`) includes the
  `reminderIsActive: boolean` flag, or you are willing to add it. This is
  essential for the stateless scheduler.
- A polling interval of 30 seconds is acceptable for reminder precision. This
  can be adjusted.

## 7. Open Questions / Areas for Further Investigation

- **Error Handling:** How should the scheduler handle cases where
  `bot.api.sendMessage` fails (e.g., the user has blocked the bot)? Should the
  reminder be deleted, or marked as failed after several retries?
- **Scaling:** For a very large number of users, polling the entire
  `reminders_by_user` prefix could become slow. The secondary index
  `["reminders_by_time", ...]` mentioned in `plan_google.md` should be
  considered for future optimization if performance becomes an issue.

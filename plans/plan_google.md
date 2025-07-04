Refactoring Plan: Modular & Persistent Bot Architecture
1. Executive Summary & Goals

This document outlines a comprehensive refactoring plan to evolve the current Telegram bot into a robust, scalable, and maintainable application. The current architecture, while functional, has key limitations in state management and modularity that will hinder future growth.

The primary objective is to transition to a modular, database-driven architecture.

Key Goals:

Enhance Reliability: Replace the fragile in-memory scheduler and file-based session storage with a persistent database (Deno KV), ensuring no data or scheduled jobs are lost on restart.

Improve Maintainability & Scalability: Decompose the application into self-contained feature modules. This simplifies development, testing, and the process of adding new features.

Establish a "Clean Core": Refactor the main bot.ts file to be a lean "composition root" that only wires together modules and services, drastically reducing its complexity.

2. Current Situation Analysis

The existing codebase demonstrates a good initial separation of features (tasks, reminders). However, several architectural pain points are evident:

Monolithic Entry Point: bot.ts is overly complex. It handles bot initialization, session setup, command registration, conversation creation, and direct business logic, making it difficult to manage.

Fragile State Management:

Session data is stored using FileAdapter, which does not scale well and can be inefficient.

Scheduled reminders rely on the node-schedule library, which keeps jobs in memory. This is a single point of failure.

Unreliable Job Recovery: The restoreJobs.ts script is a workaround for the in-memory scheduler's lack of persistence. It's inefficient (reading all session files on startup) and brittle.

Misplaced Logic: Critical application logic (like restoreJobs) is located in a src/test directory, which is misleading and poor practice.

Tight Coupling: Many components have direct or indirect dependencies on bot.ts for type definitions (MyContext) and instances, creating circular dependencies and making modules less portable.

3. Proposed Solution / Refactoring Strategy

We will adopt a Modular Architecture with a clear separation of concerns, backed by Deno KV for all persistence needs.

3.1. High-Level Design / Architectural Overview

The new architecture will consist of a lean Core that loads independent Feature Modules. Each module will interact with the database through a dedicated Data Access Layer (Repositories) and contain its own business logic in a Service Layer.

Generated mermaid
graph TD
    subgraph User
        direction LR
        U[Telegram User]
    end

    subgraph Bot Application
        direction TB
        B[bot.ts - Composition Root] -- registers --> M
        B -- uses --> C[Core Services: e.g., Config, Logger]
        B -- starts --> S[Scheduler Service]

        subgraph Modules
            direction LR
            M(Module Loader) --> F1[Tasks Module]
            M --> F2[Reminders Module]
            M --> F_New[New Feature Module]
        end

        subgraph Feature_Example [Reminders Module]
            direction TB
            H[Handlers & Conversations] --> SV[ReminderService]
            SV --> R[ReminderRepository]
        end

        subgraph Shared Services
            direction TB
            S --> R2[ReminderRepository]
            SV --> DB
            R --> DB
            R2 --> DB
        end

        subgraph Persistence
            direction LR
            DB[(Deno KV Database)]
        end
    end

    U -- sends command --> B
    B -- routes to --> H
    S -- sends notification --> U

    style DB fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:2px

3.2. Key Components / Modules

src/core/:

bot.ts: The main entry point. Initializes the bot, Deno KV, the scheduler, and loads all feature modules.

config.ts: Manages environment variables and application configuration.

database.ts: Exports the initialized Deno KV client.

types.ts: Defines core, shared types like MyContext to avoid circular dependencies.

scheduler.ts: A new background service that polls the database for due jobs (reminders).

src/modules/: The new home for all features. Each feature will be a subdirectory.

src/modules/tasks/:

tasks.module.ts: The entry point for the module. It registers all commands, conversations, and menu handlers for this feature with the bot instance.

tasks.service.ts: Contains all business logic for tasks (add, delete, mark as done).

tasks.repository.ts: Handles all database operations for tasks (CRUD operations on Deno KV).

tasks.handlers.ts: Contains the grammY command/menu handlers, which call the TasksService.

tasks.conversations.ts: Contains the grammY conversations, which also use the TasksService.

tasks.types.ts: Defines data structures specific to tasks.

src/modules/reminders/: Structured similarly to the tasks module, but with a ReminderService that knows how to schedule a reminder by writing it to the database.

src/lib/ (formerly src/test/): A directory for genuine shared utilities, if any. The files currently in src/test will be deleted or moved into the new service/repository structure.

3.3. Detailed Action Plan / Phases
Phase 1: Foundation & Core Setup

Objective(s): Establish the new project structure and persistence layer.

Priority: High

Task 1.1: Reorganize Directory Structure

Rationale/Goal: Create a clean, logical layout for the new architecture.

Estimated Effort: S

Deliverable/Criteria for Completion: New directories (src/core, src/modules, src/lib) are created. Existing files are moved into a temporary _legacy folder to be migrated incrementally.

Task 1.2: Implement Core Services

Rationale/Goal: Centralize bot initialization, configuration, and type definitions.

Estimated Effort: M

Deliverable/Criteria for Completion:

src/core/config.ts is created and reads BOT_API_KEY.

src/core/types.ts defines MyContext, MyConversation, etc.

src/core/database.ts initializes and exports a Deno KV instance.

bot.ts is stripped down to its essentials: it imports from core, initializes the bot, and sets up basic middleware (session, conversations).

Task 1.3: Setup Deno KV for Session Management

Rationale/Goal: Replace the FileAdapter with a more robust and scalable session store.

Estimated Effort: S

Deliverable/Criteria for Completion: The bot uses kvStorage from @grammyjs/storage-deno-kv for session management. The old sessions directory can be removed.

Phase 2: Migrate the "Tasks" Feature

Objective(s): Refactor the first feature into the new modular architecture.

Priority: High

Task 2.1: Create Task Repository

Rationale/Goal: Abstract all data access for tasks into a single, testable class.

Estimated Effort: M

Deliverable/Criteria for Completion: A TaskRepository class in src/modules/tasks/tasks.repository.ts is created with methods like findByUser(userId), create(userId, task), delete(userId, taskId), update(userId, taskId, data). It uses the Deno KV instance from core.

Task 2.2: Create Task Service

Rationale/Goal: Encapsulate the business logic for managing tasks.

Estimated Effort: M

Deliverable/Criteria for Completion: A TaskService class in src/modules/tasks/tasks.service.ts is created. It uses the TaskRepository. Its methods contain the logic currently found in the conversation and handler files.

Task 2.3: Refactor Handlers and Conversations

Rationale/Goal: Connect the grammY layer to the new service layer, making handlers thin controllers.

Estimated Effort: M

Deliverable/Criteria for Completion: All task-related handlers and conversations are moved to src/modules/tasks/ and updated to call methods on an instance of TaskService instead of manipulating ctx.session directly.

Task 2.4: Create and Register the Task Module

Rationale/Goal: Make the feature pluggable into the main bot.

Estimated Effort: S

Deliverable/Criteria for Completion: A tasks.module.ts file is created that registers all task commands and conversations with the bot. bot.ts calls a function from this module to activate the feature.

Phase 3: Implement Reliable Scheduling & Migrate "Reminders"

Objective(s): Replace the in-memory scheduler with a persistent, database-driven system.

Priority: High

Task 3.1: Design and Implement the Scheduler Service

Rationale/Goal: Create a stateless, reliable background process for sending notifications.

Estimated Effort: L

Deliverable/Criteria for Completion:

A SchedulerService is created in src/core/scheduler.ts.

It contains a run() method that uses setInterval to periodically poll the database.

The poll queries for reminders where scheduledAt <= NOW() and isSent === false.

For each due reminder, it uses bot.api.sendMessage and then updates the reminder's isSent flag to true in the database.

bot.ts starts this service after initialization.

Task 3.2: Migrate the Reminder Feature

Rationale/Goal: Refactor the reminders feature to use the new architecture and reliable scheduler.

Estimated Effort: L

Deliverable/Criteria for Completion:

The reminders feature is moved to src/modules/reminders/ and structured like the tasks module (Repository, Service, Handlers, etc.).

The ReminderService's addReminder method no longer calls node-schedule. Instead, it writes the reminder details and its due time to the database.

The deleteReminder logic now just deletes the record from the database.

The old reminderScheduler.ts, jobStore, and restoreJobs.ts files are deleted.

Phase 4: Cleanup and Finalization

Objective(s): Integrate remaining pieces and remove all legacy code.

Priority: Medium

Task 4.1: Refactor Menus

Rationale/Goal: Decouple menus from specific handlers and integrate them into the module system.

Estimated Effort: M

Deliverable/Criteria for Completion: Each feature module's *.module.ts file is responsible for registering its own sub-menu with the main menu. The mainMenu.ts becomes a shell that is populated by the modules.

Task 4.2: Final Code Cleanup

Rationale/Goal: Ensure the project is left in a clean state.

Estimated Effort: S

Deliverable/Criteria for Completion: The _legacy folder is deleted. All console.log statements used for debugging are removed or replaced with a proper logger. The README.md is updated to reflect the new architecture and setup instructions.

3.4. Data Model Changes

We will move all persistent data into Deno KV. The data will be organized by user.

Example Deno KV Key Structure:

["users", <user_id>, "profile"]: Stores user-specific settings.

["tasks_by_user", <user_id>, <task_uuid>]: Stores a task object.

["reminders_by_user", <user_id>, <reminder_uuid>]: Stores a reminder object.

["reminders_by_time", <timestamp_iso_string>, <reminder_uuid>]: An index to allow efficient polling by the scheduler.

New Reminder Interface:

Generated typescript
interface Reminder {
  id: string; // UUID
  userId: number;
  chatId: number;
  text: string;
  scheduledAt: Date; // The time for the reminder
  isSent: boolean;   // Flag for the scheduler
  createdAt: Date;
}
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution. 
TypeScript
IGNORE_WHEN_COPYING_END
4. Key Considerations & Risk Mitigation
4.1. Technical Risks & Challenges

Risk: The refactoring is extensive and may introduce bugs.

Mitigation: The phased approach allows for migrating one feature at a time. Each feature should be thoroughly tested manually after its migration before proceeding to the next.

Risk: Data migration from old file-based sessions.

Mitigation: For the existing user base, a one-time migration script could be written to read the .json session files and populate the new Deno KV database. Alternatively, given the nature of the data (tasks/reminders), it may be acceptable to inform users that they will need to re-add their data after the update. This plan assumes a fresh start is acceptable.

4.2. Dependencies

The migration of the reminders feature (Phase 3) is dependent on the completion of the foundational Deno KV setup (Phase 1).

All feature migrations (Phase 2, 3) depend on the new core services and project structure being in place (Phase 1).

4.3. Non-Functional Requirements (NFRs) Addressed

Reliability: Greatly improved. The database-driven scheduler is stateless and will always process reminders correctly after a restart, eliminating the need for the restoreJobs script. Deno KV is a transactional, persistent database.

Scalability: The architecture is now horizontally scalable. Multiple instances of the bot can run (e.g., on Deno Deploy), all connecting to the same Deno KV database. The database polling scheduler can also be run as a separate process.

Maintainability: Massively improved. Separation of concerns means developers can work on a single feature module with minimal impact on other parts of the system. The code is more organized, predictable, and easier to understand.

Testability: The new Service and Repository layers are plain TypeScript classes and can be easily unit-tested without needing a running bot instance.

5. Success Metrics / Validation Criteria

Zero-Loss Restarts: The bot can be stopped and restarted, and a scheduled reminder created before the restart is still sent at the correct time without any manual intervention.

Reduced bot.ts Complexity: The line count and logical complexity of bot.ts should be reduced by at least 75%.

Feature Addition Velocity: Adding a new, simple feature (e.g., a "Quote of the Day" command that saves user preferences) should be possible by only adding files within a new src/modules/quote/ directory and registering it in bot.ts, without changing any other module.

Successful Data Persistence: All tasks and reminders are correctly stored in and retrieved from the Deno KV database across multiple bot sessions.

6. Assumptions Made

The use of Deno KV is acceptable and sufficient for the project's current and near-future needs.

A temporary disruption or reset of user data (tasks, reminders) during the migration is acceptable. If not, a separate data migration task will be required.

The team is comfortable with architectural patterns like Dependency Injection (passing services/repositories to handlers) and Repository/Service patterns.

7. Open Questions / Areas for Further Investigation

Should a more formal logging library (e.g., Deno.log) be integrated as part of the core services in Phase 1?

What is the strategy for database backups and recovery for the Deno KV store?

For future high-scale scenarios, should we consider a cloud-native Deno KV provider (like Deno Deploy) or a different database technology (e.g., PostgreSQL)?
# Design Plan: The Path to a Freelance-Ready Telegram Bot

## 1. Executive Summary & Goals

This plan provides a strategic roadmap for evolving your current bot project
into a professional, freelance-ready application. It analyzes your progress
based on the completed plans (`plan_google.md`, `plan_google_2.md`,
`plan_google_tests.md`), identifies the most commercially valuable bot features,
and outlines the remaining technical and operational steps required to
confidently take on freelance work.

The primary objective is to bridge the gap between a well-architected personal
project and a production-grade, feature-rich bot that meets the demands of
paying clients.

### Key Goals:

1. **Solidify the Foundation:** Complete the planned architectural refactoring
   to create a fully modular, reliable, and testable bot application.
2. **Implement High-Value Features:** Develop a set of the most commonly
   requested freelance bot functionalities, such as payment processing, admin
   controls, and localization, turning your project into a powerful portfolio
   piece.
3. **Achieve Operational Excellence:** Master the non-functional requirements
   crucial for professional work, including security, advanced monitoring, and
   robust deployment practices.

## 2. Current Situation Analysis

Your project is in a strong but incomplete state. You have successfully applied
the principles from your previous plans to the `tasks` feature, resulting in an
excellent example of a modular, service-oriented architecture using Deno KV.

### Key Strengths:

- **Modern Architecture:** The `tasks` module (`src/modules/tasks/`)
  demonstrates a clean separation of concerns (Repository, Service, Handlers),
  which is highly maintainable and testable.
- **Solid Persistence Strategy:** You have adopted Deno KV, moving away from
  fragile file-based storage.
- **Clear Testing Plan:** You have a comprehensive strategy
  (`plan_google_tests.md`) for ensuring code quality.

### Key Gaps & Limitations:

1. **Incomplete Refactoring:** The `reminders` feature remains in `src/_legacy`,
   still relying on session-based storage and the in-memory `node-schedule`
   library. The core `bot.ts` is not yet a clean "composition root" and still
   contains legacy code.
2. **Missing Core Components:** The persistent, database-driven
   `SchedulerService` outlined in `plan_google_2.md` has not been implemented.
   This is the primary blocker to making reminders reliable.
3. **Lack of "Freelance-Grade" Features:** The current functionality (tasks,
   reminders) is typical for a personal assistant bot. Commercial bots require
   features that generate value for a business, such as processing payments,
   managing content, or integrating with business tools.
4. **Missing Production Polish:** While planned, critical operational components
   like advanced logging, error reporting (beyond `console.log`), security
   hardening (rate limiting), and an admin interface are not yet implemented.

## 3. Proposed Solution / Learning Plan

This plan is structured in three phases. The first completes your foundational
work. The subsequent phases focus on building the features and skills necessary
for freelance success.

### Phase 1: Complete the Foundation (Finish Previous Plans)

**Objective(s):** Stabilize the application by completing the architectural
refactoring. This is a mandatory prerequisite for all subsequent work.
**Priority:** Critical

- **Task 1.1: Implement the Core Scheduler Service**
  - **Rationale/Goal:** Replace the fragile `node-schedule` and `restoreJobs`
    script with a persistent, database-driven scheduler as detailed in
    `plan_google_2.md` (Task 3.1).
  - **Estimated Effort:** L
  - **Deliverable/Criteria for Completion:** A `src/core/scheduler.ts` is
    created and functional. It polls Deno KV for due reminders, sends them via
    `bot.api`, and updates their status. The service is started from the main
    `bot.ts`.

- **Task 1.2: Migrate the "Reminders" Feature**
  - **Rationale/Goal:** Refactor the entire `reminders` feature into its own
    module (`src/modules/reminders/`), mirroring the structure of the `tasks`
    module. This includes creating a repository, service, handlers, and module
    file.
  - **Estimated Effort:** L
  - **Deliverable/Criteria for Completion:** The `src/modules/reminders/`
    directory is fully populated. The `addReminder` service method writes to the
    database, relying on the `SchedulerService` to send the notification.

- **Task 1.3: Clean the Composition Root & Finalize**
  - **Rationale/Goal:** Remove all legacy code and dependencies from the main
    `bot.ts` file, making it a lean application assembler.
  - **Estimated Effort:** M
  - **Deliverable/Criteria for Completion:**
    - The `src/_legacy` directory is completely deleted.
    - The root `bot.ts` no longer contains any direct feature logic; it only
      initializes core services (bot, session, scheduler) and loads modules
      (`tasksModule`, `remindersModule`).
    - The `jobStore` and `restoreScheduledJobs` script are deleted.

- **Task 1.4: Implement the Test Suite**
  - **Rationale/Goal:** Implement the unit and integration tests for both the
    `tasks` and `reminders` modules as defined in `plan_google_tests.md`.
  - **Estimated Effort:** L
  - **Deliverable/Criteria for Completion:** `deno task test` runs successfully,
    covering the service and repository layers of both modules.

---

### Phase 2: Building the "Freelance MVP" - High-Value Features

**Objective(s):** Implement the features most frequently requested by freelance
clients. Each should be built as a new, self-contained module.

- **Task 2.1: Module: Advanced User Management & Localization (i18n)**
  - **Rationale/Goal:** Most commercial bots need to distinguish between user
    types (e.g., `admin`, `subscriber`, `user`) and often need to support
    multiple languages. This is a foundational step for paid features.
  - **Estimated Effort:** M
  - **Deliverable/Criteria for Completion:**
    1. **User Service:** Create a `users` module with a `UserService` and
       `UserRepository`. The user model should include a `role` (e.g.,
       `'admin' | 'user'`) and a `language` (e.g., `'en' | 'es'`).
    2. **i18n Library:** Integrate a localization library (e.g., `grammy-i18n`)
       and create language files (e.g., `locales/en.json`, `locales/es.json`).
    3. **Middleware:** Create middleware that identifies the user's language
       from their profile and makes the correct translation function available
       on the context (`ctx.t`).
    4. Refactor existing modules (`tasks`, `reminders`) to use
       `ctx.t("some_key")` instead of hardcoded strings.

- **Task 2.2: Module: Admin Panel**
  - **Rationale/Goal:** Clients need a way to manage their bot without code. An
    admin panel is a critical feature that adds immense value.
  - **Estimated Effort:** M
  - **Deliverable/Criteria for Completion:**
    1. Create an `admin` module.
    2. Create a command (e.g., `/admin`) that is only accessible to users with
       the `admin` role (checked via middleware).
    3. This command opens a special `Menu` with admin-only functions:
       - "Broadcast Message": Send a message to all bot users.
       - "User Stats": Show total users, new users this week, etc.
       - "View User": Look up a user by ID and see their details.

- **Task 2.3: Module: Payment Integration**
  - **Rationale/Goal:** The ability to accept payments is the most direct way a
    bot can generate revenue, making it a highly sought-after feature. We will
    use Stripe as an example.
  - **Estimated Effort:** L
  - **Deliverable/Criteria for Completion:**
    1. Create a `payments` module.
    2. Integrate the Stripe Node.js SDK. Store API keys securely in environment
       variables.
    3. Create a `/subscribe` command.
    4. When called, the bot generates a Stripe Checkout session and sends the
       user a payment link via an inline button.
    5. Set up a webhook endpoint (e.g., using a simple web server like `oak`) to
       listen for successful payment events from Stripe.
    6. When the `checkout.session.completed` event is received, the webhook
       handler updates the user's role in your database to `subscriber`.

---

### Phase 3: Production Polish & Freelance Readiness

**Objective(s):** Implement the non-functional requirements and operational
practices that distinguish a professional developer from a hobbyist.

- **Task 3.1: Implement Advanced Monitoring & Error Reporting**
  - **Rationale/Goal:** `console.log` is insufficient for production. You need
    automated, structured logging and real-time error alerts.
  - **Estimated Effort:** M
  - **Deliverable/Criteria for Completion:**
    1. **Structured Logging:** Implement `Deno.log` as planned, but ensure logs
       are output as JSON for easy parsing by a log management service.
    2. **Error Reporting:** Integrate a service like Sentry or Axiom. Use
       `bot.catch` to automatically send all unhandled errors to the service for
       real-time alerting and analysis.

- **Task 3.2: Security Hardening**
  - **Rationale/Goal:** A freelance-ready bot must be secure against common
    attacks and abuse.
  - **Estimated Effort:** M
  - **Deliverable/Criteria for Completion:**
    1. **Rate Limiting:** Implement the `grammy-ratelimiter` middleware to
       prevent users from spamming the bot with commands.
    2. **Input Validation:** For all user inputs (especially in conversations),
       implement strict validation to ensure data is in the expected format and
       to prevent injection-style attacks.
    3. **Admin Protection:** Ensure all admin-level functionality is robustly
       protected by role-based access control middleware.

- **Task 3.3: Master Deployment & Client Handoff**
  - **Rationale/Goal:** You need to be able to reliably deploy the bot and
    provide clear instructions for your client.
  - **Estimated Effort:** M
  - **Deliverable/Criteria for Completion:**
    1. **Deployment Practice:** Deploy the bot to a production-grade platform
       like Deno Deploy or Fly.io. Practice managing environment variables
       (`BOT_TOKEN`, `STRIPE_SECRET_KEY`, etc.) on the platform.
    2. **CI/CD Pipeline:** Create a GitHub Actions workflow that automatically
       runs `deno lint`, `deno test`, and then deploys the bot on every push to
       the `main` branch.
    3. **Client Documentation:** Write a simple `README.md` or PDF guide for a
       non-technical client. It should explain how to use the bot's features
       and, most importantly, how to use the `/admin` panel.

## 4. Key Considerations & Risk Mitigation

- **Portfolio Focus:** You don't need to build every feature for every client.
  The goal of this plan is to build a single, powerful portfolio bot that
  _demonstrates_ you have these skills. You can then enable/disable modules per
  client.
- **Learning Curve:** Integrating payments and webhooks (Task 2.3) involves
  concepts outside of the Telegram Bot API. Allocate extra time for this, as
  it's a significant but valuable learning step.
- **Client Communication:** A key freelance skill is managing expectations. Be
  clear about what a bot can and cannot do. The documentation from Task 3.3 is
  your first step in practicing this.

## 5. Success Metrics / Validation Criteria

You will be "freelance-ready" when you have:

1. **A Complete Portfolio Bot:** Your bot is deployed live and includes a
   working admin panel and at least one other high-value feature (e.g., payments
   or localization).
2. **Automated Workflow:** Your CI/CD pipeline automatically tests and deploys
   your bot, giving you and your future clients confidence in its stability.
3. **Demonstrable Expertise:** You can confidently explain your bot's
   architecture, security measures, and how a client can manage it.
4. **Project Estimation Ability:** Based on your experience building these
   modules, you can reasonably estimate the time and effort required to build
   similar features for a client.

## 6. Assumptions Made

- You will successfully complete Phase 1 before starting Phase 2. The
  foundational stability is non-negotiable.
- You are willing to create accounts with third-party services (like Stripe and
  Sentry) for learning purposes. Most offer generous free tiers.
- The goal is to become a proficient bot developer; this plan focuses on the
  technical and operational skills required to achieve that.

## 7. Open Questions / Areas for Further Investigation

- What type of freelance bot projects are you most interested in? (e.g.,
  e-commerce, community management, productivity tools). Your answer can help
  you prioritize which Phase 2 modules to focus on most deeply.
- Beyond the admin panel, what other web-based interfaces might be useful?
  (e.g., a full dashboard for analytics). This could be a future area of growth.

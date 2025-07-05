import * as chrono from "npm:chrono-node/ru";

import {
  assertSpyCall,
  Spy,
} from "https://deno.land/std@0.224.0/testing/mock.ts";
import { createMockContext, setupTestDb } from "../../../test/helpers.ts";
import { createReminderHandlers } from "./reminders.handlers.ts";
import { ReminderService } from "./reminders.service.ts";
import { ReminderRepository } from "./reminders.repository.ts";

Deno.test("ReminderHandlers - addReminderHandler", async () => {
  const mockService = {} as unknown as ReminderService;
  const handlers = createReminderHandlers(mockService);
  const ctx = createMockContext();

  await handlers.addReminderHandler(ctx);

  assertSpyCall(ctx.conversation.enter as Spy<Promise<void>>, 0, {
    args: ["addReminderConversation"],
  });
});

Deno.test("ReminderHandlers - deleteReminderHandler", async () => {
  const mockService = {} as unknown as ReminderService;
  const handlers = createReminderHandlers(mockService);
  const ctx = createMockContext();

  await handlers.deleteReminderHandler(ctx);

  assertSpyCall(ctx.conversation.enter as Spy<Promise<void>>, 0, {
    args: ["deleteReminderConversation"],
  });
});

Deno.test(
  "ReminderHandlers - remindersHandler",
  { sanitizeResources: false, sanitizeOps: false },
  async (t) => {
    const { clear, teardown } = await setupTestDb();
    try {
      const reminderRepository = new ReminderRepository();
      const reminderService = new ReminderService(reminderRepository);
      const handlers = createReminderHandlers(reminderService);
      const ctx = createMockContext();

      await t.step(
        "should reply with 'No reminders in the list' if no reminders exist",
        async () => {
          await clear();
          await handlers.remindersHandler(ctx);
          assertSpyCall(ctx.reply as Spy<Promise<void>>, 0, {
            args: ["No reminders in the list"],
          });
        },
      );

      await t.step(
        "should reply with a list of reminders if reminders exist",
        async () => {
          await clear();
          await reminderService.addReminder(
            ctx.from!.id,
            "Test Reminder 1 завтра",
          );
          await reminderService.addReminder(
            ctx.from!.id,
            "Test Reminder 2 через 2 дня",
          );
          await handlers.remindersHandler(ctx);

          const options: Intl.DateTimeFormatOptions = {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
          };

          const expectedDate1 = chrono.parseDate(
            "завтра",
            { timezone: "UTC +3" },
            {
              forwardDate: true,
            },
          );
          const expectedDate2 = chrono.parseDate(
            "через 2 дня",
            {
              timezone: "UTC +3",
            },
            { forwardDate: true },
          );

          const expectedReply = `1. Test Reminder 1 завтра (${
            expectedDate1!.toLocaleString("ru-RU", options)
          })\n2. Test Reminder 2 через 2 дня (${
            expectedDate2!.toLocaleString("ru-RU", options)
          })`;

          assertSpyCall(ctx.reply as Spy<Promise<void>>, 1, {
            args: [expectedReply],
          });
        },
      );
    } finally {
      teardown();
    }
  },
);

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { Spy, spy } from "https://deno.land/std@0.224.0/testing/mock.ts";
import { SchedulerService } from "./scheduler.ts";
import { ReminderRepository } from "../modules/reminders/reminders.repository.ts";
import { Bot } from "https://deno.land/x/grammy@v1.36.3/mod.ts";
import { MyContext } from "./types.ts";
import { kv } from "./database.ts";
import { setupTestDb } from "../../test/helpers.ts";
import { Message } from "https://deno.land/x/grammy_types@v3.20.0/message.ts";

Deno.test(
  "SchedulerService - checkAndSendReminders",
  { sanitizeResources: false, sanitizeOps: false },
  async (t) => {
    const { clear, teardown } = await setupTestDb();

    try {
      const mockBot = {
        api: {
          sendMessage: spy(() => Promise.resolve()),
        },
      } as unknown as Bot<MyContext>;

      const reminderRepo = new ReminderRepository();
      const scheduler = new SchedulerService(mockBot);

      await t.step("sends reminder and deletes it", async () => {
        await clear();
        const userId = 123;
        const reminderString = "Test Reminder 1 завтра в 10 часов";
        const reminder = await reminderRepo.create(userId, reminderString);

        // Manually set the reminder date to be in the past for testing
        await kv.set(
          ["reminders_by_time", new Date(0).toISOString(), reminder.reminderId],
          { reminderUserId: userId, reminderId: reminder.reminderId },
        );

        // @ts-ignore: Accessing private method for testing
        await scheduler.checkAndSendReminders();

        assertEquals(
          (mockBot.api.sendMessage as Spy<Promise<Message.TextMessage>>).calls
            .length,
          1,
        );
        assertEquals(
          (mockBot.api.sendMessage as Spy<Promise<Message.TextMessage>>)
            .calls[0].args[0],
          userId,
        );
        assertEquals(
          (mockBot.api.sendMessage as Spy<Promise<Message.TextMessage>>)
            .calls[0].args[1],
          `🔔 Reminder: ${reminderString}`,
        );

        const foundReminder = await reminderRepo.findById(
          userId,
          reminder.reminderId,
        );
        assertEquals(foundReminder, null);
      });

      await t.step("handles orphaned reminders", async () => {
        await clear();
        const userId = 456;
        const reminderId = "orphan-reminder-id";

        // Create an orphaned entry in reminders_by_time
        await kv.set(
          ["reminders_by_time", new Date(0).toISOString(), reminderId],
          { reminderUserId: userId, reminderId: reminderId },
        );

        // @ts-ignore: Accessing private method for testing
        await scheduler.checkAndSendReminders();

        const iter = kv.list({ prefix: ["reminders_by_time"] });
        const entries = [];
        for await (const entry of iter) {
          entries.push(entry);
        }
        assertEquals(entries.length, 0);
      });
    } finally {
      teardown();
    }
  },
);

import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ReminderRepository } from "./reminders.repository.ts";
import { setupTestDb } from "../../../test/helpers.ts"; // Import new helper

Deno.test(
  "ReminderRepository",
  { sanitizeResources: false, sanitizeOps: false },
  async (t) => {
    const { clear, teardown } = await setupTestDb();

    try {
      const repo = new ReminderRepository();
      const userId = 1;

      await t.step("create", async () => {
        await clear();
        const reminder = await repo.create(userId, "Test Reminder завтра");
        assertEquals(reminder.reminderString, "Test Reminder завтра");
        assertEquals(reminder.reminderUserId, userId);
        assertExists(reminder.reminderId);
      });

      await t.step("findByUser", async () => {
        await clear();
        await repo.create(userId, "Reminder 1 завтра");
        await repo.create(userId, "Reminder 2 через 2 дня");
        const reminders = await repo.findByUser(userId);
        assertEquals(reminders.length, 2);
      });

      await t.step("findById", async () => {
        await clear();
        const reminder = await repo.create(userId, "Test Reminder завтра");
        const found = await repo.findById(userId, reminder.reminderId);
        assertEquals(found?.reminderId, reminder.reminderId);
      });

      await t.step("delete", async () => {
        await clear();
        const reminder = await repo.create(userId, "Test Reminder завтра");
        const deleted = await repo.delete(userId, reminder.reminderId);
        assert(deleted);
        const found = await repo.findById(userId, reminder.reminderId);
        assertEquals(found, null);
      });

      await t.step("deleteAll", async () => {
        await clear();
        await repo.create(userId, "Reminder 1 завтра");
        await repo.create(userId, "Reminder 2 in через 2 дня");
        await repo.deleteAll(userId);
        const reminders = await repo.findByUser(userId);
        assertEquals(reminders.length, 0);
      });
    } finally {
      teardown();
    }
  },
);

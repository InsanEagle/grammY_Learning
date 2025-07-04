import {
  assertEquals,
  assertExists,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ReminderRepository } from "./reminders.repository.ts";
import { kv } from "../../core/database.ts";

async function clearDb() {
  const iter = kv.list({ prefix: [] });
  for await (const entry of iter) {
    await kv.delete(entry.key);
  }
}

Deno.test(
  "ReminderRepository",
  { sanitizeResources: false, sanitizeOps: false },
  async (t) => {
    const repo = new ReminderRepository();
    const userId = 1;

    await t.step("create", async () => {
      await clearDb();
      const reminder = await repo.create(userId, "Test Reminder завтра");
      assertEquals(reminder.reminderString, "Test Reminder завтра");
      assertEquals(reminder.reminderUserId, userId);
      assertExists(reminder.reminderId);
    });

    await t.step("findByUser", async () => {
      await clearDb();
      await repo.create(userId, "Reminder 1 завтра");
      await repo.create(userId, "Reminder 2 через 2 дня");
      const reminders = await repo.findByUser(userId);
      assertEquals(reminders.length, 2);
    });

    await t.step("findById", async () => {
      await clearDb();
      const reminder = await repo.create(userId, "Test Reminder завтра");
      const found = await repo.findById(userId, reminder.reminderId);
      assertEquals(found?.reminderId, reminder.reminderId);
    });

    await t.step("delete", async () => {
      await clearDb();
      const reminder = await repo.create(userId, "Test Reminder завтра");
      const deleted = await repo.delete(userId, reminder.reminderId);
      assert(deleted);
      const found = await repo.findById(userId, reminder.reminderId);
      assertEquals(found, null);
    });

    await t.step("deleteAll", async () => {
      await clearDb();
      await repo.create(userId, "Reminder 1 завтра");
      await repo.create(userId, "Reminder 2 in через 2 дня");
      await repo.deleteAll(userId);
      const reminders = await repo.findByUser(userId);
      assertEquals(reminders.length, 0);
    });
  },
);
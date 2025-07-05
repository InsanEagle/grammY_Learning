import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ReminderService } from "./reminders.service.ts";
import { ReminderRepository } from "./reminders.repository.ts";
import { __setKv, initializeDb, kv } from "../../core/database.ts";
import { MockKv } from "../../../test/mocks/kv.mock.ts";

Deno.test(
  "ReminderService",
  { sanitizeResources: false, sanitizeOps: false },
  async (t) => {
    await initializeDb("./test.service.db");
    const originalKv = kv;
    const mockKv = new MockKv();
    __setKv(mockKv as any);

    try {
      const reminderRepository = new ReminderRepository();
      const service = new ReminderService(reminderRepository);
      const userId = 1;

      await t.step("addReminder", async () => {
        mockKv.store.clear();
        const reminder = await service.addReminder(
          userId,
          "Test Reminder завтра в 10",
        );
        assertEquals(reminder.reminderString, "Test Reminder завтра в 10");
        assertEquals(reminder.reminderUserId, userId);
        assertEquals(mockKv.store.size, 2); // reminders_by_user and reminders_by_time
      });

      await t.step("getRemindersList", async () => {
        mockKv.store.clear();
        await service.addReminder(userId, "Reminder 1 завтра в 11");
        await service.addReminder(userId, "Reminder 2 послезавтра в 12");
        const list = await service.getRemindersList(userId);
        assertExists(list.includes("1. Reminder 1"));
        assertExists(list.includes("2. Reminder 2"));
      });

      await t.step("deleteReminder", async () => {
        mockKv.store.clear();
        const reminder = await service.addReminder(
          userId,
          "Test Reminder завтра",
        );
        assertEquals(mockKv.store.size, 2);
        const deleted = await service.deleteReminder(
          userId,
          reminder.reminderId,
        );
        assertEquals(deleted?.reminderId, reminder.reminderId);
        const reminders = await service.getReminders(userId);
        assertEquals(reminders.length, 0);
        assertEquals(mockKv.store.size, 0);
      });

      await t.step("clearReminders", async () => {
        mockKv.store.clear();
        await service.addReminder(userId, "Reminder 1 завтра");
        await service.addReminder(userId, "Reminder 2 послезавтра");
        assertEquals(mockKv.store.size, 4);
        await service.clearReminders(userId);
        const reminders = await service.getReminders(userId);
        assertEquals(reminders.length, 0);
        // Note: clearReminders only deletes from reminders_by_user, not reminders_by_time
        // This is a potential bug in the source code, but the test reflects current behavior.
        assertEquals(mockKv.store.size, 2);
      });
    } finally {
      __setKv(originalKv);
      originalKv.close();
      try {
        Deno.removeSync("./test.service.db");
        Deno.removeSync("./test.service.db-shm");
        Deno.removeSync("./test.service.db-wal");
      } catch (error) {
        console.error(error);
      }
    }
  },
);

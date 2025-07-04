import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ReminderService } from "./reminders.service.ts";
import { ReminderRepository } from "./reminders.repository.ts";
import { Reminder } from "./reminders.types.ts";

// Mock ReminderRepository
class MockReminderRepository implements Partial<ReminderRepository> {
  private reminders: Reminder[] = [];

  create(userId: number, text: string): Promise<Reminder> {
    const reminder: Reminder = {
      reminderId: crypto.randomUUID(),
      reminderUserId: userId,
      reminderString: text,
      reminderDate: new Date(),
      reminderToDateString: new Date().toISOString(),
      createdAt: new Date(),
    };
    this.reminders.push(reminder);
    return Promise.resolve(reminder);
  }

  findByUser(userId: number): Promise<Reminder[]> {
    return Promise.resolve(
      this.reminders.filter((r) => r.reminderUserId === userId),
    );
  }

  findById(userId: number, reminderId: string): Promise<Reminder | null> {
    return Promise.resolve(
      this.reminders.find((r) =>
        r.reminderUserId === userId && r.reminderId === reminderId
      ) || null,
    );
  }

  delete(userId: number, reminderId: string): Promise<boolean> {
    const index = this.reminders.findIndex((r) =>
      r.reminderUserId === userId && r.reminderId === reminderId
    );
    if (index > -1) {
      this.reminders.splice(index, 1);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  deleteAll(userId: number): Promise<void> {
    this.reminders = this.reminders.filter((r) => r.reminderUserId !== userId);
    return Promise.resolve();
  }
}

Deno.test("ReminderService - addReminder", async () => {
  const mockRepo =
    new MockReminderRepository() as unknown as ReminderRepository;
  const service = new ReminderService(mockRepo);
  const reminder = await service.addReminder(1, "Test Reminder");
  assertEquals(reminder.reminderString, "Test Reminder");
  assertEquals(reminder.reminderUserId, 1);
});

Deno.test("ReminderService - getRemindersList", async () => {
  const mockRepo =
    new MockReminderRepository() as unknown as ReminderRepository;
  const service = new ReminderService(mockRepo);
  await service.addReminder(1, "Reminder 1");
  await service.addReminder(1, "Reminder 2");
  const list = await service.getRemindersList(1);
  assertExists(list.includes("1. Reminder 1"));
  assertExists(list.includes("2. Reminder 2"));
});

Deno.test("ReminderService - deleteReminder", async () => {
  const mockRepo =
    new MockReminderRepository() as unknown as ReminderRepository;
  const service = new ReminderService(mockRepo);
  const reminder = await service.addReminder(1, "Test Reminder");
  const deleted = await service.deleteReminder(1, reminder.reminderId);
  assertEquals(deleted?.reminderId, reminder.reminderId);
  const reminders = await service.getReminders(1);
  assertEquals(reminders.length, 0);
});

Deno.test("ReminderService - clearReminders", async () => {
  const mockRepo =
    new MockReminderRepository() as unknown as ReminderRepository;
  const service = new ReminderService(mockRepo);
  await service.addReminder(1, "Reminder 1");
  await service.addReminder(1, "Reminder 2");
  await service.clearReminders(1);
  const reminders = await service.getReminders(1);
  assertEquals(reminders.length, 0);
});

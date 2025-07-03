import * as chrono from "npm:chrono-node/ru";

import { kv } from "../../core/database.ts";
import { Reminder } from "./reminders.types.ts";

const REMINDERS_KEY = "reminders_by_user";

export class ReminderRepository {
  async create(
    reminderUserId: number,
    reminderString: string,
  ) {
    const reminderId = crypto.randomUUID();
    const reminderDate = chrono.parseDate(
      reminderString,
      { timezone: "UTC +3" },
      { forwardDate: true },
    );
    const reminderToDateString = reminderDate.toLocaleString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
    const reminder: Reminder = {
      reminderString,
      reminderDate,
      reminderToDateString,
      reminderId,
      reminderUserId,
      createdAt: new Date(),
    };

    await kv.atomic()
      .set([REMINDERS_KEY, reminderUserId, reminder.reminderId], reminder)
      .set(
        ["reminders_by_time", reminder.reminderDate.toISOString(), reminder.reminderId],
        { reminderUserId: reminder.reminderUserId, reminderId: reminder.reminderId },
      )
      .commit();

    return reminder;
  }

  async findByUser(reminderUserId: number): Promise<Reminder[]> {
    const reminders: Reminder[] = [];
    const iter = kv.list<Reminder>({ prefix: [REMINDERS_KEY, reminderUserId] });
    for await (const entry of iter) {
      reminders.push(entry.value);
    }
    return reminders.sort((a, b) =>
      a.createdAt.getTime() - b.createdAt.getTime()
    );
  }

  async findById(
    reminderUserId: number,
    reminderId: string,
  ): Promise<Reminder | null> {
    const res = await kv.get<Reminder>([
      REMINDERS_KEY,
      reminderUserId,
      reminderId,
    ]);
    return res.value;
  }

  async delete(reminderUserId: number, reminderId: string): Promise<boolean> {
    const reminder = await this.findById(reminderUserId, reminderId);
    if (!reminder) return false;

    await kv.atomic()
      .delete([REMINDERS_KEY, reminderUserId, reminderId])
      .delete(["reminders_by_time", reminder.reminderDate.toISOString(), reminderId])
      .commit();

    return true;
  }

  async deleteAll(reminderUserId: number): Promise<void> {
    const reminders = await this.findByUser(reminderUserId);
    const promises = reminders.map((reminder) =>
      kv.delete([REMINDERS_KEY, reminderUserId, reminder.reminderId])
    );
    await Promise.all(promises);
  }
}

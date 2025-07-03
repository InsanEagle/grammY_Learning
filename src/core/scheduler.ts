import { Bot } from "https://deno.land/x/grammy@v1.36.3/mod.ts";
import { MyContext } from "./types.ts";
import { kv } from "./database.ts";
import { ReminderRepository } from "../modules/reminders/reminders.repository.ts";

export class SchedulerService {
  private readonly reminderRepository: ReminderRepository;

  constructor(private readonly bot: Bot<MyContext>) {
    this.reminderRepository = new ReminderRepository();
  }

  run(intervalMs: number) {
    setInterval(() => this.checkAndSendReminders(), intervalMs);
    console.log(
      `Scheduler started. Polling every ${intervalMs / 1000} seconds.`,
    );
  }

  private async checkAndSendReminders() {
    const now = new Date().toISOString();
    const iter = kv.list<{ reminderUserId: number; reminderId: string }>({
      prefix: ["reminders_by_time"],
      end: ["reminders_by_time", now],
    });

    for await (const entry of iter) {
      const { reminderUserId, reminderId } = entry.value;
      const reminder = await this.reminderRepository.findById(
        reminderUserId,
        reminderId,
      );

      if (reminder) {
        try {
          await this.bot.api.sendMessage(
            reminderUserId,
            `🔔 Reminder: ${reminder.reminderString}`,
          );
          console.log(
            `Sent reminder ${reminder.reminderId} for user ${reminder.reminderUserId}`,
          );
        } catch (error) {
          console.error(
            `Failed to send reminder ${reminder.reminderId}:`,
            error,
          );
        } finally {
          await this.reminderRepository.delete(
            reminder.reminderUserId,
            reminder.reminderId,
          );
        }
      } else {
        console.warn(
          `Orphaned reminder found in time index, deleting:`,
          entry.key,
        );
        await kv.delete(entry.key);
      }
    }
  }
}

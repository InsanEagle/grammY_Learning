import { Reminder } from "./reminders.types.ts";
import { ReminderRepository } from "./reminders.repository.ts";

export class ReminderService {
  constructor(private readonly reminderRepository: ReminderRepository) {}

  async addReminder(
    reminderUserId: number,
    reminderString: string,
  ): Promise<Reminder> {
    return await this.reminderRepository.create(
      reminderUserId,
      reminderString,
    );
  }

  async getReminders(reminderUserId: number): Promise<Reminder[]> {
    return await this.reminderRepository.findByUser(reminderUserId);
  }

  async getRemindersList(reminderUserId: number): Promise<string> {
    const reminders = await this.getReminders(reminderUserId);
    if (reminders.length === 0) {
      return "No reminders in the list";
    }
    return reminders
      .map(
        (reminder, index) =>
          `${
            index + 1
          }. ${reminder.reminderString} (${reminder.reminderToDateString})`,
      )
      .join("\n");
  }

  async deleteReminder(
    reminderUserId: number,
    reminderId: string,
  ): Promise<Reminder | null> {
    const reminderToDelete = await this.reminderRepository.findById(
      reminderUserId,
      reminderId,
    );
    if (!reminderToDelete) return null;
    await this.reminderRepository.delete(
      reminderUserId,
      reminderToDelete.reminderId,
    );
    return reminderToDelete;
  }

  async clearReminders(reminderUserId: number): Promise<void> {
    await this.reminderRepository.deleteAll(reminderUserId);
  }
}

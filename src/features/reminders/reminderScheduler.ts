import * as schedule from "node-schedule";

import { Bot } from "https://deno.land/x/grammy@v1.36.3/mod.ts";
import { MyContext, storage } from "../../../bot.ts";
import { SessionData, jobStore } from "../../db/freeStorage.ts";

export function createScheduleReminder(
  chatId: number,
  session: SessionData,
  bot: Bot<MyContext>,
  id: string
): Promise<void> {
  const reminder = session.remindersList[session.remindersList.length - 1];
  if (!reminder || reminder.reminderIsActive) {
    return Promise.reject("Reminder not found or already active");
  }

  const job = schedule.scheduleJob(reminder.reminderTime, async () => {
    try {
      await bot.api.sendMessage(
        chatId,
        `🔔 Reminder: ${reminder.reminderString}`
      );

      jobStore.delete(id);

      const session = await storage.read(String(chatId));
      if (session?.remindersList) {
        session.remindersList = session.remindersList.filter(
          (r) => r.id !== id
        );
        await storage.write(String(chatId), session);
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
    }
  });

  jobStore.set(id, {
    job,
    chatId,
    reminderString: reminder.reminderString,
  });

  reminder.reminderIsActive = true;

  return Promise.resolve();
}

import { Bot } from "https://deno.land/x/grammy@v1.36.3/mod.ts";

import { MyContext, SessionData } from "../../core/types.ts";
import { createScheduleReminder } from "../features/reminders/reminderScheduler.ts";
import { getActiveChatIdsFromSessions } from "./getActiveChatIdFromSessions.ts";

export async function restoreScheduledJobs(
  bot: Bot<MyContext>,
  storage: {
    read: (key: string) => Promise<SessionData | undefined>;
    write: (key: string, value: SessionData) => Promise<void>;
  },
): Promise<void> {
  try {
    const activeChatIds = await getActiveChatIdsFromSessions();

    for (const chatId of activeChatIds) {
      const session = await storage.read(String(chatId));

      if (!session?.remindersList?.length) continue;

      for (const reminder of session.remindersList) {
        if (!reminder.reminderIsActive || !reminder.reminderTime) continue;

        try {
          await createScheduleReminder(chatId, session, bot, reminder.id, {
            isRestore: true,
            reminder: reminder,
          });
        } catch (error) {
          console.error(`Failed to restore reminder ${reminder.id}:`, error);
          reminder.reminderIsActive = false;
          await storage.write(String(chatId), session);
        }
      }
    }
  } catch (error) {
    console.error("Error restoring scheduled jobs:", error);
  }
}

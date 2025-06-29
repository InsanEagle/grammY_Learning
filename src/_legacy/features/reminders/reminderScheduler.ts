import * as schedule from "node-schedule";

import { Bot } from "https://deno.land/x/grammy@v1.36.3/mod.ts";
import { storage } from "../../../core/database.ts";
import { jobStore, MyContext, SessionData } from "../../../core/types.ts";

// export function createScheduleReminder(
//   chatId: number,
//   session: SessionData,
//   bot: Bot<MyContext>,
//   id: string
// ): Promise<void> {
//   const reminder = session.remindersList[session.remindersList.length - 1];
//   if (!reminder || reminder.reminderIsActive) {
//     return Promise.reject("Reminder not found or already active");
//   }

//   const job = schedule.scheduleJob(reminder.reminderTime, async () => {
//     try {
//       await bot.api.sendMessage(
//         chatId,
//         `🔔 Reminder: ${reminder.reminderString}`
//       );

//       jobStore.delete(id);

//       const session = await storage.read(String(chatId));
//       if (session?.remindersList) {
//         session.remindersList = session.remindersList.filter(
//           (r) => r.id !== id
//         );
//         await storage.write(String(chatId), session);
//       }
//     } catch (error) {
//       console.error("Error sending reminder:", error);
//     }
//   });

//   jobStore.set(id, {
//     job,
//     chatId,
//     reminderString: reminder.reminderString,
//   });

//   reminder.reminderIsActive = true;

//   return Promise.resolve();
// }

export async function createScheduleReminder(
  chatId: number,
  session: SessionData,
  bot: Bot<MyContext>,
  id: string,
  options?: {
    isRestore?: boolean;
    reminder?: SessionData["remindersList"][0];
  },
): Promise<void> {
  const reminder = options?.reminder ||
    session.remindersList.find((r) => r.id === id);

  if (!reminder) {
    return Promise.reject("Reminder not found");
  }

  if (!options?.isRestore && reminder.reminderIsActive) {
    return Promise.reject("Reminder already active");
  }

  if (new Date(reminder.reminderTime) < new Date()) {
    session.remindersList = session.remindersList.filter((r) => r.id !== id);
    await storage.write(String(chatId), session);
    return Promise.reject("Reminder time has already passed");
  }

  const job = schedule.scheduleJob(reminder.reminderTime, async () => {
    try {
      await bot.api.sendMessage(
        chatId,
        `🔔 Reminder: ${reminder.reminderString}`,
      );

      jobStore.delete(id);

      const session = await storage.read(String(chatId));
      if (session?.remindersList) {
        session.remindersList = session.remindersList.filter(
          (r) => r.id !== id,
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

  if (!options?.isRestore) {
    reminder.reminderIsActive = true;
  }

  console.log("Reminder scheduled:", reminder.reminderString);

  return Promise.resolve();
}

import { type Context } from "https://deno.land/x/grammy@v1.36.3/mod.ts";

import { jobStore, MyConversation, SessionData } from "../../../core/types.ts";

export async function deleteReminderConversation(
  conversation: MyConversation,
  ctx: Context,
) {
  const session = await conversation.external((ctx) => ctx.session);
  const listString = session.remindersList
    .map((reminder, index) => `${index + 1}. ${reminder.reminderString}`)
    .join("\n");
  let reminderIndex: string | undefined;

  // Check if valid reminder index is provided inline
  if (ctx?.message?.text) {
    reminderIndex = ctx.message.text.substring("/deletereminder".length).trim();
    if (!isValidReminderIndex(reminderIndex)) {
      reminderIndex = undefined;
    }
  }

  // If not valid inline, wait for user input
  if (!reminderIndex) {
    await ctx.reply(
      `${listString}\n\nPlease provide a reminder number to delete.`,
    );
    const { message } = await conversation.waitUntil(
      (ctx) => isValidReminderIndex(ctx.msg?.text || ""),
      {
        otherwise: (ctx) =>
          ctx.reply("Please provide a reminder number to delete."),
      },
    );
    reminderIndex = message?.text;
  }

  // Process the valid reminder index
  if (reminderIndex) {
    const index = Number(reminderIndex) - 1;
    const reminder = deleteReminderFromSession(session, index);
    if (reminder) {
      await ctx.reply(
        `Reminder: ${reminder.reminderString} (${reminder.reminderToDateString}) successfully deleted`,
      );
    } else {
      await ctx.reply(`Reminder not found`);
    }

    await conversation.external((ctx) => {
      ctx.session = session;
    });
  }
}

function deleteReminderFromSession(session: SessionData, index: number) {
  const reminder = session.remindersList[index];
  if (!reminder) {
    return null;
  }

  const id = reminder.id;
  deleteJob(id);

  session.remindersList.splice(index, 1);

  return reminder;
}

function isValidReminderIndex(text: string): boolean {
  if (!text) return false;

  return /^\d+$/.test(text);
}

function deleteJob(id: string) {
  const job = jobStore.get(id);
  if (job) {
    job.job.cancel();
    jobStore.delete(id);
  }
}

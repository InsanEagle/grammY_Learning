import * as chrono from "npm:chrono-node/ru";

import { type Context } from "https://deno.land/x/grammy@v1.36.3/mod.ts";

import { MyConversation } from "../../core/types.ts";
import { ReminderService } from "./reminders.service.ts";

export const createReminderConversations = (
  reminderService: ReminderService,
) => {
  async function addReminderConversation(
    conversation: MyConversation,
    ctx: Context,
  ) {
    let reminderText: string | undefined;

    // Check if valid reminder is provided inline
    if (ctx?.message?.text) {
      reminderText = ctx.message.text.substring("/addreminder".length).trim();
      if (!isValidReminderText(reminderText)) {
        reminderText = undefined;
      }
    }

    // If not valid inline, wait for user input
    if (!reminderText) {
      await ctx.reply(
        "Please provide a reminder to add. It should be in the future",
      );
      const { message } = await conversation.waitUntil(
        (ctx) => isValidReminderText(ctx.msg?.text || ""),
        {
          otherwise: (ctx) =>
            ctx.reply(
              "Please provide a reminder to add. It should be in the future",
            ),
        },
      );
      reminderText = message?.text;
    }

    // Process the valid reminder
    if (reminderText && ctx.from) {
      const fromId = ctx.from.id;
      const reminder = await conversation.external(async () => {
        return await reminderService.addReminder(fromId, reminderText);
      });
      await ctx.reply(
        `Reminder: ${reminder.reminderString} (${reminder.reminderToDateString}) successfully added`,
      );
    }
  }

  function isValidReminderText(text: string): boolean {
    if (!text) return false;

    const reminderDate = chrono.parseDate(
      text,
      { timezone: "UTC +3" },
      { forwardDate: true },
    );

    return reminderDate != null && reminderDate > new Date();
  }

  async function deleteReminderConversation(
    conversation: MyConversation,
    ctx: Context,
  ) {
    if (!ctx.from) return;
    const fromId = ctx.from.id;
    const reminders = await conversation.external(async () => {
      return await reminderService.getReminders(fromId);
    });

    if (reminders.length === 0) {
      await ctx.reply("No reminders in the list");
      return;
    }

    const listString = reminders
      .map(
        (r, i) => `${i + 1}. ${r.reminderString} (${r.reminderToDateString})`,
      )
      .join("\n");

    let reminderIndex: string | undefined;

    // Check if valid reminder index is provided inline
    if (ctx?.message?.text) {
      reminderIndex = ctx.message.text.substring("/deletereminder".length)
        .trim();
      if (!isValidReminderIndex(reminderIndex, reminders.length)) {
        reminderIndex = undefined;
      }
    }

    // If not valid inline, wait for user input
    if (!reminderIndex) {
      await ctx.reply(
        `${listString}\n\nPlease provide a reminder number to delete.`,
      );
      const { message } = await conversation.waitUntil(
        (ctx) => isValidReminderIndex(ctx.msg?.text || "", reminders.length),
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
      const reminderToDelete = reminders[index];
      const reminder = await conversation.external(async () => {
        return await reminderService.deleteReminder(
          fromId,
          reminderToDelete.reminderId,
        );
      });
      if (reminder) {
        await ctx.reply(
          `Reminder: ${reminder.reminderString} (${reminder.reminderToDateString}) successfully deleted`,
        );
      } else {
        await ctx.reply(`Reminder not found`);
      }
    }
  }

  function isValidReminderIndex(text: string, max: number): boolean {
    if (!text) return false;
    const index = Number(text);
    return /^\d+$/.test(text) && index > 0 && index <= max;
  }

  return { deleteReminderConversation, addReminderConversation };
};

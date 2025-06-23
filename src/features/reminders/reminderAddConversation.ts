import * as chrono from "chrono-node/ru";

import { type Context } from "https://deno.land/x/grammy@v1.36.3/mod.ts";

import { MyConversation } from "../../../bot.ts";
import { bot } from "../../../bot.ts";
import { SessionData } from "../../db/freeStorage.ts";

import { createScheduleReminder } from "./reminderScheduler.ts";

export async function addReminderConversation(
  conversation: MyConversation,
  ctx: Context,
) {
  const session = await conversation.external((ctx) => ctx.session);
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
  if (reminderText) {
    const reminderObj = await addReminderToSession(ctx, session, reminderText);
    await conversation.external((ctx) => {
      ctx.session = session;
    });
    await ctx.reply(
      `Reminder: ${reminderObj.reminderString} (${reminderObj.reminderToDateString}) successfully added`,
    );
  }
}

async function addReminderToSession(
  ctx: Context,
  session: SessionData,
  text: string,
) {
  const reminderObj = createReminderObject(text);
  const id = reminderObj.id;
  session.remindersList.push(reminderObj);

  if (ctx.chatId) {
    await createScheduleReminder(ctx.chatId, session, bot, id);
  }

  return reminderObj;
}

function createReminderObject(text: string) {
  const reminderDate = chrono.parseDate(
    text,
    { timezone: "UTC +3" },
    { forwardDate: true },
  );

  const parsedDateIndex = chrono.parse(text, { timezone: "UTC +3" })[0].index;
  const parsedText = text.substring(0, parsedDateIndex).trim();

  const dateString = reminderDate.toLocaleString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });

  const id = generateId();

  return {
    reminderString: parsedText,
    reminderTime: reminderDate,
    reminderToDateString: dateString,
    reminderIsActive: false,
    id,
  };
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

function generateId(): string {
  return crypto.randomUUID();
}

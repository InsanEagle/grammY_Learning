import * as chrono from "chrono-node/ru";

import { MyContext } from "../../../bot.ts";

export async function addReminderHandler(ctx: MyContext) {
  const reminder = ctx.match;

  if (reminder && typeof reminder === "string") {
    const reminderDate = chrono.parseDate(
      reminder,
      { timezone: "UTC +3" },
      { forwardDate: true }
    );

    if (!reminderDate || reminderDate < new Date()) {
      await ctx.conversation.enter("waitForReminderToAdd");
      return;
    }

    const reminderObj = {
      reminderString: reminder,
      reminderTime: reminderDate,
    };

    if (!ctx.session.remindersList) {
      ctx.session.remindersList = [];
    }

    ctx.session.remindersList.push(reminderObj);
    ctx.reply(`Reminder: ${reminder} successfully added`);
  } else {
    await ctx.conversation.enter("waitForReminderToAdd");
  }
}

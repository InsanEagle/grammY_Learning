import { MySessionContext } from "../../db/freeStorage.ts";

export function remindersHandler(ctx: MySessionContext) {
  if (!ctx.session.remindersList) {
    ctx.session.remindersList = [];
  }
  if (ctx.session.remindersList.length === 0)
    return ctx.reply("No reminders in the list");
  const reminders = ctx.session.remindersList
    .map((reminder) => reminder.reminderString)
    .join("\n");
  ctx.reply(reminders);
}

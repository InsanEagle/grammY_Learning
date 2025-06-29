import { MySessionContext } from "../../../core/types.ts";

export function remindersHandler(ctx: MySessionContext) {
  let list = ctx.session.remindersList;
  if (!list) {
    list = [];
  }
  if (list.length === 0) {
    return ctx.reply("No reminders in the list");
  }
  const reminders = list
    .map(
      (reminder, index) =>
        `${
          index + 1
        }. ${reminder.reminderString} (${reminder.reminderToDateString})`,
    )
    .join("\n");
  ctx.reply(reminders);
}

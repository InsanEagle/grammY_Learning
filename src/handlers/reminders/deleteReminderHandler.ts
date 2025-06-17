import { MyContext } from "../../../bot.ts";

export async function deleteReminderHandler(ctx: MyContext) {
  const reminderNumber = ctx.match;
  if (
    typeof reminderNumber === "string" &&
    reminderNumber.length > 0 &&
    /^\d+$/.test(reminderNumber)
  ) {
    const reminder = ctx.session.remindersList[Number(reminderNumber) - 1];
    if (reminder) {
      ctx.session.remindersList.splice(Number(reminderNumber) - 1, 1);
      ctx.reply(`Reminder: ${reminder} successfully deleted`);
    } else {
      ctx.reply("Reminder not found");
    }
  } else {
    await ctx.conversation.enter("waitForRemindToDelete");
  }
}

import { MyContext } from "../../../bot.ts";

export async function deleteTaskHandler(ctx: MyContext) {
  const taskNumber = ctx.match;
  if (
    typeof taskNumber === "string" &&
    taskNumber.length > 0 &&
    /^\d+$/.test(taskNumber)
  ) {
    const task = ctx.session.tasksList[Number(taskNumber) - 1];
    if (task) {
      ctx.session.tasksList.splice(Number(taskNumber) - 1, 1);
      ctx.reply(`Task: ${task} successfully deleted`);
    } else {
      ctx.reply("Task not found");
    }
  } else {
    await ctx.conversation.enter("waitForTaskToDelete");
  }
}

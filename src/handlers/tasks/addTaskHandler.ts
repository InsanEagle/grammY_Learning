import { MyContext } from "../../../bot.ts";

export async function addTaskHandler(ctx: MyContext) {
  const task = ctx.match;

  if (task && typeof task === "string") {
    ctx.session.tasksList.push(task);
    ctx.reply(`Task: ${task} successfully added`);
  } else {
    await ctx.conversation.enter("waitForTaskToAdd");
  }
}

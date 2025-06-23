import { MySessionContext } from "../../db/freeStorage.ts";

export function tasksHandler(ctx: MySessionContext) {
  if (!ctx.session.tasksList) {
    ctx.session.tasksList = [];
  }
  if (ctx.session.tasksList.length === 0)
    return ctx.reply("No tasks in the list");
  const tasks = ctx.session.tasksList.join("\n");
  ctx.reply(tasks);
}

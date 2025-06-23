import { MySessionContext } from "../../db/freeStorage.ts";

export function tasksHandler(ctx: MySessionContext) {
  let list = ctx.session.tasksList;
  if (!list) {
    list = [];
  }
  if (list.length === 0) {
    return ctx.reply("No tasks in the list");
  }
  const tasks = list
    .map((task, index) => `${index + 1}. ${task.taskString}`)
    .join("\n");
  ctx.reply(tasks);
}

import { MySessionContext } from "../../db/freeStorage.ts";

export function tasksHandler(ctx: MySessionContext) {
  const tasks = ctx.session.tasksList.join("\n");
  ctx.reply(tasks);
}

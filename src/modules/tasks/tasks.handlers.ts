import { MyContext } from "../../core/types.ts";
import { TaskService } from "./tasks.service.ts";

export type TaskHandlers = ReturnType<typeof createTaskHandlers>;

export const createTaskHandlers = (taskService: TaskService) => {
  const addTaskHandler = async (ctx: MyContext) => {
    await ctx.conversation.enter("addTaskConversation");
  };

  const deleteTaskHandler = async (ctx: MyContext) => {
    await ctx.conversation.enter("deleteTaskConversation");
  };

  const doneTaskHandler = async (ctx: MyContext) => {
    await ctx.conversation.enter("doneTaskConversation");
  };

  const tasksHandler = async (ctx: MyContext) => {
    if (!ctx.from) return;
    const list = await taskService.getTasksList(ctx.from.id);
    await ctx.reply(list);
  };

  const clearTasksHandler = async (ctx: MyContext) => {
    if (!ctx.from) return;
    await taskService.clearTasks(ctx.from.id);
    await ctx.reply("All tasks have been cleared!");
  };

  return {
    addTaskHandler,
    deleteTaskHandler,
    doneTaskHandler,
    tasksHandler,
    clearTasksHandler,
  };
};

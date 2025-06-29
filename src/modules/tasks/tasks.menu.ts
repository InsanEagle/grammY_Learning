import { Menu } from "https://deno.land/x/grammy_menu@v1.3.0/mod.ts";
import { MyContext } from "../../core/types.ts";
import { TaskHandlers } from "./tasks.handlers.ts";

export const createTasksMenu = (handlers: TaskHandlers) => {
  return new Menu<MyContext>("tasks-menu")
    .text("Add task", (ctx) => handlers.addTaskHandler(ctx))
    .row()
    .text("Delete task", (ctx) => handlers.deleteTaskHandler(ctx))
    .row()
    .text("Make task done", (ctx) => handlers.doneTaskHandler(ctx))
    .row()
    .text("List of tasks", (ctx) => handlers.tasksHandler(ctx))
    .row()
    .back("Back to main menu");
};

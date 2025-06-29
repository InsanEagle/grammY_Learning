import { Menu } from "https://deno.land/x/grammy_menu@v1.3.0/mod.ts";

import { MyContext } from "../../core/types.ts";

import { addTaskHandler } from "../features/tasks/taskAddHandler.ts";
import { deleteTaskHandler } from "../features/tasks/taskDeleteHandler.ts";
import { tasksHandler } from "../features/tasks/taskHandler.ts";
import { doneTaskHandler } from "../features/tasks/taskDoneHandler.ts";

export const tasksMenu = new Menu<MyContext>("tasks-menu")
  .text("Add task", (ctx) => addTaskHandler(ctx))
  .row()
  .text("Delete task", (ctx) => deleteTaskHandler(ctx))
  .row()
  .text("Make task done", (ctx) => doneTaskHandler(ctx))
  .row()
  .text("List of tasks", (ctx) => tasksHandler(ctx))
  .row()
  .back("Back to main menu");

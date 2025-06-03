import { Menu } from "https://deno.land/x/grammy_menu@v1.3.0/mod.ts";

import { MyContext } from "../../bot.ts";

import { addTaskHandler } from "../handlers/tasks/addTaskHandler.ts";
import { deleteTaskHandler } from "../handlers/tasks/deleteTaskHandler.ts";
import { tasksHandler } from "../handlers/tasks/tasksHandler.ts";

export const tasksMenu = new Menu<MyContext>("tasks-menu")
  .text("Add task", (ctx) => addTaskHandler(ctx))
  .row()
  .text("Delete task", (ctx) => deleteTaskHandler(ctx))
  .row()
  .text("Make task done", (ctx) => ctx.reply("You clicked on Make task done!"))
  .row()
  .text("List of tasks", (ctx) => tasksHandler(ctx))
  .row()
  .back("Back to main menu");

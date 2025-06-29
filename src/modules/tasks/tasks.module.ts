import { Bot } from "https://deno.land/x/grammy@v1.36.3/mod.ts";
import { createConversation } from "https://deno.land/x/grammy_conversations@v2.0.1/mod.ts";

import { MyContext } from "../../core/types.ts";
import { TaskRepository } from "./tasks.repository.ts";
import { TaskService } from "./tasks.service.ts";
import { createTaskConversations } from "./tasks.conversations.ts";
import { createTaskHandlers } from "./tasks.handlers.ts";
import { createTasksMenu } from "./tasks.menu.ts";

import { mainMenu } from "../../_legacy/menus/mainMenu.ts";

export const tasksModule = (bot: Bot<MyContext>) => {
  const taskRepository = new TaskRepository();
  const taskService = new TaskService(taskRepository);

  const { addTaskConversation, deleteTaskConversation, doneTaskConversation } =
    createTaskConversations(taskService);

  const handlers = createTaskHandlers(taskService);

  const tasksMenu = createTasksMenu(handlers);

  // Register conversations
  bot.use(createConversation(addTaskConversation));
  bot.use(createConversation(deleteTaskConversation));
  bot.use(createConversation(doneTaskConversation));

  // Register menu
  mainMenu.register(tasksMenu);

  // Register command handlers
  bot.command("addtask", handlers.addTaskHandler);
  bot.command("tasks", handlers.tasksHandler);
  bot.command("deletetask", handlers.deleteTaskHandler);
  bot.command("donetask", handlers.doneTaskHandler);
  bot.command("cleartasks", handlers.clearTasksHandler);
};

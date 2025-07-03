import { Bot } from "https://deno.land/x/grammy@v1.36.3/mod.ts";
import { createConversation } from "https://deno.land/x/grammy_conversations@v2.0.1/mod.ts";

import { MyContext } from "../../core/types.ts";
import { ReminderRepository } from "./reminders.repository.ts";
import { ReminderService } from "./reminders.service.ts";
import { createReminderConversations } from "./reminders.conversations.ts";
import { createReminderHandlers } from "./reminders.handlers.ts";
import { createRemindersMenu } from "./reminders.menu.ts";

import { mainMenu } from "../menu/menu.module.ts";

export const remindersModule = (bot: Bot<MyContext>) => {
  const reminderRepository = new ReminderRepository();
  const reminderService = new ReminderService(reminderRepository);

  const { addReminderConversation, deleteReminderConversation } =
    createReminderConversations(reminderService);

  const handlers = createReminderHandlers(reminderService);

  const remindersMenu = createRemindersMenu(handlers);

  // Register conversations
  bot.use(createConversation(addReminderConversation));
  bot.use(createConversation(deleteReminderConversation));

  // Register menu
  mainMenu.register(remindersMenu);

  // Register command handlers
  bot.command("addreminder", handlers.addReminderHandler);
  bot.command("reminders", handlers.remindersHandler);
  bot.command("deletereminder", handlers.deleteReminderHandler);
};

// GrammY imports
import { Bot, session } from "https://deno.land/x/grammy@v1.36.3/mod.ts";

import {
  conversations,
  createConversation,
} from "https://deno.land/x/grammy_conversations@v2.0.1/mod.ts";

// Core imports
import { config } from "./src/core/config.ts";
import { MyContext } from "./src/core/types.ts";
import { storage } from "./src/core/database.ts";

import { tasksModule } from "./src/modules/tasks/tasks.module.ts";

// Menus import
import { mainMenu } from "./src/_legacy/menus/mainMenu.ts";

// Handlers import
import { addReminderHandler } from "./src/_legacy/features/reminders/reminderAddHandler.ts";
import { remindersHandler } from "./src/_legacy/features/reminders/reminderHandler.ts";
import { deleteReminderHandler } from "./src/_legacy/features/reminders/reminderDeleteHandler.ts";

// Conversations import
import { addReminderConversation } from "./src/_legacy/features/reminders/reminderAddConversation.ts";
import { deleteReminderConversation } from "./src/_legacy/features/reminders/reminderDeleteConversation.ts";

// Testing import
import { clearRemindersList } from "./src/_legacy/test/clearRemindersList.ts";
import { restoreScheduledJobs } from "./src/_legacy/test/restoreJobs.ts";

// Create an instance of the `Bot` class and pass your bot token to it.
export const bot = new Bot<MyContext>(config.BOT_API_KEY);

// You can now register listeners on your bot object `bot`.
// grammY will call the listeners when users send messages to your bot.

bot.use(
  session({
    initial: () => {
      const init = { remindersList: [] };
      console.log("Initializing session:", init);
      return init;
    },
    storage,
  }),
);

restoreScheduledJobs(bot, storage);

bot.use(conversations());

bot.use(createConversation(addReminderConversation));
bot.use(createConversation(deleteReminderConversation));

// Initialize modules
tasksModule(bot);

// Make it interactive.
bot.use(mainMenu);

// Setup menu commands
await bot.api.setMyCommands([
  { command: "start", description: "Start the bot" },
  { command: "help", description: "Show available commands" },
  { command: "menu", description: "Open menu" },
  { command: "addtask", description: "Add task to the list" },
  { command: "deletetask", description: "Delete task from the list" },
  { command: "tasks", description: "Open tasks list" },
  { command: "donetask", description: "Make task done or undone" },
  { command: "cleartasks", description: "Clear all tasks" },
  { command: "addreminder", description: "Add reminder to the list" },
  { command: "deletereminder", description: "Delete reminder from the list" },
  { command: "reminders", description: "Open reminders list" },
  { command: "clearreminders", description: "Clear all reminders" },
  { command: "currencies", description: "Open the list of currencies" },
  { command: "convert", description: "Convert currency to another one" },
]);

// Handle menu commands.
bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));
bot.command(
  "help",
  (ctx) => ctx.reply("There is a list of all available commands"),
);
bot.command("menu", async (ctx) => {
  // Send the menu.
  await ctx.reply("Main menu:", { reply_markup: mainMenu });
});

// Handle remind commands
bot.command("addreminder", (ctx) => addReminderHandler(ctx));
bot.command("reminders", (ctx) => remindersHandler(ctx));
bot.command("deletereminder", (ctx) => deleteReminderHandler(ctx));
bot.command("clearreminders", (ctx) => {
  clearRemindersList(ctx.session);
  return ctx.reply("All reminders have been cleared!");
});

// Handle currency converter commands
bot.command("currencies", (ctx) => ctx.reply("Interactive menu with buttons"));
bot.command("convert", (ctx) => ctx.reply("Interactive menu with buttons"));

// Handle other messages.
bot.on("message", (ctx) => ctx.reply("Got another message!"));

// Now that you specified how to handle messages, you can start your bot.
// This will connect to the Telegram servers and wait for messages.

// Start the bot.
bot.start();

// GrammY imports
import { Bot, session } from "https://deno.land/x/grammy@v1.36.3/mod.ts";
// import { freeStorage } from "https://deno.land/x/grammy_storages@v2.4.2/free/src/mod.ts";
import { FileAdapter } from "https://deno.land/x/grammy_storages/file/src/mod.ts";
import {
  conversations,
  createConversation,
} from "https://deno.land/x/grammy_conversations@v2.0.1/mod.ts";

// Core imports
import { config } from "./src/core/config.ts";
import { MyContext, SessionData } from "./src/core/types.ts";

// Menus import
import { mainMenu } from "./src/_legacy/menus/mainMenu.ts";

// Handlers import
import { addTaskHandler } from "./src/_legacy/features/tasks/taskAddHandler.ts";
import { tasksHandler } from "./src/_legacy/features/tasks/taskHandler.ts";
import { deleteTaskHandler } from "./src/_legacy/features/tasks/taskDeleteHandler.ts";
import { doneTaskHandler } from "./src/_legacy/features/tasks/taskDoneHandler.ts";

import { addReminderHandler } from "./src/_legacy/features/reminders/reminderAddHandler.ts";
import { remindersHandler } from "./src/_legacy/features/reminders/reminderHandler.ts";
import { deleteReminderHandler } from "./src/_legacy/features/reminders/reminderDeleteHandler.ts";

// Conversations import
import { addTaskConversation } from "./src/_legacy/features/tasks/taskAddConversation.ts";
import { deleteTaskConversation } from "./src/_legacy/features/tasks/taskDeleteConversation.ts";
import { doneTaskConversation } from "./src/_legacy/features/tasks/taskDoneConversation.ts";

import { addReminderConversation } from "./src/_legacy/features/reminders/reminderAddConversation.ts";
import { deleteReminderConversation } from "./src/_legacy/features/reminders/reminderDeleteConversation.ts";

// Testing import
import { clearRemindersList } from "./src/_legacy/test/clearRemindersList.ts";
import { clearTasksList } from "./src/_legacy/test/clearTasksList.ts";
import { restoreScheduledJobs } from "./src/_legacy/test/restoreJobs.ts";

// Create an instance of the `Bot` class and pass your bot token to it.
export const bot = new Bot<MyContext>(config.BOT_API_KEY);

// You can now register listeners on your bot object `bot`.
// grammY will call the listeners when users send messages to your bot.

export const storage = new FileAdapter<SessionData>({
  dirName: "sessions",
});

bot.use(
  session({
    initial: () => {
      const init = { tasksList: [], remindersList: [] };
      console.log("Initializing session:", init);
      return init;
    },
    storage,
  }),
);

restoreScheduledJobs(bot, storage);

// bot.use(
//   session({
//     initial: () => {
//       const init = { tasksList: [], remindersList: [] };
//       console.log("Initializing session:", init);
//       return init;
//     },
//     storage: freeStorage<SessionData>(bot.token),
//   })
// );

bot.use(conversations());

bot.use(createConversation(addTaskConversation));
bot.use(createConversation(deleteTaskConversation));
bot.use(createConversation(doneTaskConversation));

bot.use(createConversation(addReminderConversation));
bot.use(createConversation(deleteReminderConversation));

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

// Handle tasks commands
bot.command("addtask", (ctx) => addTaskHandler(ctx));
bot.command("tasks", (ctx) => tasksHandler(ctx));
bot.command("deletetask", (ctx) => deleteTaskHandler(ctx));
bot.command("donetask", (ctx) => doneTaskHandler(ctx));
bot.command("cleartasks", (ctx) => {
  clearTasksList(ctx.session);
  return ctx.reply("All reminders have been cleared!");
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

// GrammY imports
import { Bot } from "https://deno.land/x/grammy@v1.36.3/mod.ts";

import {
  conversations,
} from "https://deno.land/x/grammy_conversations@v2.0.1/mod.ts";

// Core imports
import { config } from "./config.ts";
import { MyContext } from "./types.ts";
import { SchedulerService } from "./scheduler.ts";

import { tasksModule } from "../modules/tasks/tasks.module.ts";
import { remindersModule } from "../modules/reminders/reminders.module.ts";
import { currenciesModule } from "../modules/currencies/currencies.module.ts";
import { quoteModule } from "../modules/quote/quote.module.ts";
import { settingsModule } from "../modules/settings/settings.module.ts";
import { weatherModule } from "../modules/weather/weather.module.ts";
import { translateModule } from "../modules/translate/translate.module.ts";

// Menus import
// import { mainMenu } from "../_legacy/menus/mainMenu.ts";
import { mainMenu } from "../modules/menu/menu.module.ts";

export async function createBot() {
  const bot = new Bot<MyContext>(config.BOT_API_KEY);

  bot.use(conversations());

  // Initialize modules
  tasksModule(bot);
  remindersModule(bot);
  currenciesModule();
  quoteModule();
  settingsModule();
  weatherModule();
  translateModule();

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
    await ctx.reply("Main menu:", { reply_markup: mainMenu });
  });

  bot.command(
    "currencies",
    (ctx) => ctx.reply("Interactive menu with buttons"),
  );
  bot.command("convert", (ctx) => ctx.reply("Interactive menu with buttons"));

  // Handle other messages.
  bot.on("message", (ctx) => ctx.reply("Got another message!"));

  const schedulerService = new SchedulerService(bot);
  schedulerService.run(5000);

  return bot;
}

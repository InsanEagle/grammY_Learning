import { Menu } from "https://deno.land/x/grammy_menu@v1.3.0/mod.ts";

import { MyContext } from "../../bot.ts";

import { tasksMenu } from "./tasksMenu.ts";
import { remindersMenu } from "./remindersMenu.ts";
import { currenciesMenu } from "./currenciesMenu.ts";
import { weatherMenu } from "./weatherMenu.ts";
import { translateMenu } from "./translateMenu.ts";
import { quoteMenu } from "./quoteMenu.ts";
import { settingsMenu } from "./settingsMenu.ts";

// ["Help", "Tasks"],
// ["Remind", "Currency"],
// ["Weather", "Translate"],
// ["Quote", "Wikipedia"],
// ["Random", "Settings"],

export const mainMenu = new Menu<MyContext>("root-menu")
  .text("Help", (ctx) => ctx.reply("You clicked on Help!"))
  .submenu("Tasks", "tasks-menu")
  .row()
  .submenu("Reminders", "reminders-menu")
  .submenu("Currencies", "currencies-menu")
  .row()
  .submenu("Weather", "weather-menu")
  .submenu("Translate", "translate-menu")
  .row()
  .submenu("Quote", "quote-menu")
  .text("Wikipedia", (ctx) => ctx.reply("You clicked on Wikipedia!"))
  .row()
  .text("Random", (ctx) => ctx.reply("You clicked on Random!"))
  .submenu("Settings", "settings-menu");

// Register submenus at mainMenu
mainMenu.register(tasksMenu);
mainMenu.register(remindersMenu);
mainMenu.register(currenciesMenu);
mainMenu.register(weatherMenu);
mainMenu.register(translateMenu);
mainMenu.register(quoteMenu);
mainMenu.register(settingsMenu);

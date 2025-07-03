import { Menu } from "https://deno.land/x/grammy_menu@v1.3.0/mod.ts";
import { MyContext } from "../../core/types.ts";

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

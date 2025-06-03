import { Menu } from "https://deno.land/x/grammy_menu@v1.3.0/mod.ts";

import { MyContext } from "../../bot.ts";

export const weatherMenu = new Menu<MyContext>("weather-menu")
  .text("Weather", (ctx) => ctx.reply("You clicked on Convert!"))
  .row()
  .text("Weather forecast", (ctx) => ctx.reply("You clicked on Currencies!"))
  .row()
  .back("Back to main menu");

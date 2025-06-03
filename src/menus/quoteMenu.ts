import { Menu } from "https://deno.land/x/grammy_menu@v1.3.0/mod.ts";

import { MyContext } from "../../bot.ts";

export const quoteMenu = new Menu<MyContext>("quote-menu")
  .text("Quote", (ctx) => ctx.reply("You clicked on Convert!"))
  .row()
  .text("Quote category", (ctx) => ctx.reply("You clicked on Currencies!"))
  .row()
  .back("Back to main menu");

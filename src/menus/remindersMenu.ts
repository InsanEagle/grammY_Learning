import { Menu } from "https://deno.land/x/grammy_menu@v1.3.0/mod.ts";

import { MyContext } from "../../bot.ts";

export const remindersMenu = new Menu<MyContext>("reminders-menu")
  .text("Remind", (ctx) => ctx.reply("You clicked on Remind!"))
  .row()
  .text("Delete remind", (ctx) => ctx.reply("You clicked on Delete remind!"))
  .row()
  .text("List of reminders", (ctx) =>
    ctx.reply("You clicked on List of reminders!")
  )
  .row()
  .back("Back to main menu");

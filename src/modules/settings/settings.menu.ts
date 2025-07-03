import { Menu } from "https://deno.land/x/grammy_menu@v1.3.0/mod.ts";
import { MyContext } from "../../core/types.ts";

export const createSettingsMenu = () => {
  return new Menu<MyContext>("settings-menu")
    .text("Language", (ctx) => ctx.reply("You clicked on Language!"))
    .row()
    .text("Notifications", (ctx) => ctx.reply("You clicked on Notifications!"))
    .row()
    .back("Back to main menu");
};

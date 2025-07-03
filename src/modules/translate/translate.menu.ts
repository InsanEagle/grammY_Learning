import { Menu } from "https://deno.land/x/grammy_menu@v1.3.0/mod.ts";
import { MyContext } from "../../core/types.ts";

export const createTranslateMenu = () => {
  return new Menu<MyContext>("translate-menu")
    .text("Translate", (ctx) => ctx.reply("You clicked on Translate!"))
    .row()
    .text(
      "Translate languages",
      (ctx) => ctx.reply("You clicked on Translate languages!"),
    )
    .row()
    .back("Back to main menu");
};

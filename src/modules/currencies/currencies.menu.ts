import { Menu } from "https://deno.land/x/grammy_menu@v1.3.0/mod.ts";
import { MyContext } from "../../core/types.ts";

export const createCurrenciesMenu = () => {
  return new Menu<MyContext>("currencies-menu")
    .text("Convert", (ctx) => ctx.reply("You clicked on Convert!"))
    .row()
    .text("Currencies", (ctx) => ctx.reply("You clicked on Currencies!"))
    .row()
    .back("Back to main menu");
};

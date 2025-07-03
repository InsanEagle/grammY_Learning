import { Menu } from "https://deno.land/x/grammy_menu@v1.3.0/mod.ts";
import { MyContext } from "../../core/types.ts";

export const createQuoteMenu = () => {
  return new Menu<MyContext>("quote-menu")
    .text("Quote", (ctx) => ctx.reply("You clicked on Quote!"))
    .row()
    .text(
      "Quote category",
      (ctx) => ctx.reply("You clicked on Quote category!"),
    )
    .row()
    .back("Back to main menu");
};

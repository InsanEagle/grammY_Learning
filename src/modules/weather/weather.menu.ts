import { Menu } from "https://deno.land/x/grammy_menu@v1.3.0/mod.ts";
import { MyContext } from "../../core/types.ts";

export const createWeatherMenu = () => {
  return new Menu<MyContext>("weather-menu")
    .text("Weather", (ctx) => ctx.reply("You clicked on Weather!"))
    .row()
    .text(
      "Weather forecast",
      (ctx) => ctx.reply("You clicked on Weather forecast!"),
    )
    .row()
    .back("Back to main menu");
};

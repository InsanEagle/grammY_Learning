import { Bot } from "https://deno.land/x/grammy@v1.36.3/mod.ts";
import { createConversation } from "https://deno.land/x/grammy_conversations@v2.0.1/mod.ts";

import { MyContext } from "../../core/types.ts";
import { createWeatherMenu } from "./weather.menu.ts";

import { mainMenu } from "../menu/menu.module.ts";

export const weatherModule = (bot: Bot<MyContext>) => {
  const weatherMenu = createWeatherMenu();

  // Register menu
  mainMenu.register(weatherMenu);
};

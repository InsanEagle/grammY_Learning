import { Bot } from "https://deno.land/x/grammy@v1.36.3/mod.ts";
import { createConversation } from "https://deno.land/x/grammy_conversations@v2.0.1/mod.ts";

import { MyContext } from "../../core/types.ts";
import { createCurrenciesMenu } from "./currencies.menu.ts";

import { mainMenu } from "../menu/menu.module.ts";

export const currenciesModule = (bot: Bot<MyContext>) => {
  const currenciesMenu = createCurrenciesMenu();

  // Register menu
  mainMenu.register(currenciesMenu);
};

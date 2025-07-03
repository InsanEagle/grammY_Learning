import { Bot } from "https://deno.land/x/grammy@v1.36.3/mod.ts";
import { createConversation } from "https://deno.land/x/grammy_conversations@v2.0.1/mod.ts";

import { MyContext } from "../../core/types.ts";
import { createQuoteMenu } from "./quote.menu.ts";

import { mainMenu } from "../menu/menu.module.ts";

export const quoteModule = (bot: Bot<MyContext>) => {
  const quoteMenu = createQuoteMenu();

  // Register menu
  mainMenu.register(quoteMenu);
};

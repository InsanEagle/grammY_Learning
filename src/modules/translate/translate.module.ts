import { Bot } from "https://deno.land/x/grammy@v1.36.3/mod.ts";
import { createConversation } from "https://deno.land/x/grammy_conversations@v2.0.1/mod.ts";

import { MyContext } from "../../core/types.ts";
import { createTranslateMenu } from "./translate.menu.ts";

import { mainMenu } from "../menu/menu.module.ts";

export const translateModule = (bot: Bot<MyContext>) => {
  const translateMenu = createTranslateMenu();

  // Register menu
  mainMenu.register(translateMenu);
};

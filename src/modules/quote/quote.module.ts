import { createQuoteMenu } from "./quote.menu.ts";

import { mainMenu } from "../menu/menu.module.ts";

export const quoteModule = () => {
  const quoteMenu = createQuoteMenu();

  // Register menu
  mainMenu.register(quoteMenu);
};

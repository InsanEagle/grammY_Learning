import { createCurrenciesMenu } from "./currencies.menu.ts";

import { mainMenu } from "../menu/menu.module.ts";

export const currenciesModule = () => {
  const currenciesMenu = createCurrenciesMenu();

  // Register menu
  mainMenu.register(currenciesMenu);
};

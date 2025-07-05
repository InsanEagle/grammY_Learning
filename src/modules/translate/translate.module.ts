import { createTranslateMenu } from "./translate.menu.ts";

import { mainMenu } from "../menu/menu.module.ts";

export const translateModule = () => {
  const translateMenu = createTranslateMenu();

  // Register menu
  mainMenu.register(translateMenu);
};

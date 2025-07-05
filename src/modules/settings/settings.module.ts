import { createSettingsMenu } from "./settings.menu.ts";

import { mainMenu } from "../menu/menu.module.ts";

export const settingsModule = () => {
  const settingsMenu = createSettingsMenu();

  // Register menu
  mainMenu.register(settingsMenu);
};

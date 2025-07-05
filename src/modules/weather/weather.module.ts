import { createWeatherMenu } from "./weather.menu.ts";

import { mainMenu } from "../menu/menu.module.ts";

export const weatherModule = () => {
  const weatherMenu = createWeatherMenu();

  // Register menu
  mainMenu.register(weatherMenu);
};

import { createBot } from "./src/core/app.ts";

export const bot = await createBot();

bot.start();

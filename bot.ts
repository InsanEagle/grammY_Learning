import { createBot } from "./src/core/app.ts";
import { initializeDb } from "./src/core/database.ts"; // Import the initializer

// Initialize the production database before creating the bot
await initializeDb("./sessions/kv.db");

export const bot = await createBot();

bot.start();

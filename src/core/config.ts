import "jsr:@std/dotenv/load";

const BOT_API_KEY = Deno.env.get("BOT_API_KEY");
if (!BOT_API_KEY) {
  throw new Error("Missing required environment variable: BOT_API_KEY");
}

export const config = {
  BOT_API_KEY,
};

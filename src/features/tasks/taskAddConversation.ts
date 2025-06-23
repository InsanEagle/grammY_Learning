import { type Context } from "https://deno.land/x/grammy@v1.36.3/mod.ts";

import { MyConversation } from "../../../bot.ts";

export async function addTaskConversation(
  conversation: MyConversation,
  ctx: Context
) {
  const session = await conversation.external((ctx) => ctx.session);

  if (
    ctx.has("message:text") &&
    ctx.message.text.substring("/addtask".length).trim()
  ) {
    session.tasksList.push(
      ctx.message.text.substring("/addtask".length).trim()
    );
  } else {
    await ctx.reply("Please provide a task to add.");
    const { message } = await conversation.waitFor("message:text", {
      otherwise: (ctx) => ctx.reply("Please send a text message!"),
    });
    session.tasksList.push(message.text);
  }

  await conversation.external((ctx) => {
    ctx.session = session;
  });
  await ctx.reply(
    `Task: ${
      session.tasksList[session.tasksList.length - 1]
    } successfully added`
  );
}

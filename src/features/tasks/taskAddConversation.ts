import { type Context } from "https://deno.land/x/grammy@v1.36.3/mod.ts";

import { MyConversation } from "../../../bot.ts";

export async function addTaskConversation(
  conversation: MyConversation,
  ctx: Context,
) {
  const session = await conversation.external((ctx) => ctx.session);

  if (
    ctx.has("message:text") &&
    ctx.message.text.substring("/addtask".length).trim()
  ) {
    const task = {
      taskString: ctx.message.text.substring("/addtask".length).trim(),
      taskIsDone: false,
    };
    session.tasksList.push(task);
  } else {
    await ctx.reply("Please provide a task to add.");
    const { message } = await conversation.waitFor("message:text", {
      otherwise: (ctx) => ctx.reply("Please send a text message!"),
    });
    const task = {
      taskString: message.text,
      taskIsDone: false,
    };
    session.tasksList.push(task);
  }

  await conversation.external((ctx) => {
    ctx.session = session;
  });
  await ctx.reply(
    `Task: ${
      session.tasksList[session.tasksList.length - 1].taskString
    } successfully added`,
  );
}

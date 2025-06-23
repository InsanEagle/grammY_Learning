import { type Context } from "https://deno.land/x/grammy@v1.36.3/mod.ts";

import { MyConversation } from "../../../bot.ts";
import { SessionData } from "../../db/freeStorage.ts";

export async function doneTaskConversation(
  conversation: MyConversation,
  ctx: Context
) {
  const session = await conversation.external((ctx) => ctx.session);
  const listString = session.tasksList
    .map((task, index) => {
      const mark = task.taskIsDone ? "✅" : "❌";
      const status = task.taskIsDone ? "Done" : "Undone";
      return `${mark}${index + 1}. ${task.taskString} ${status}`;
    })
    .join("\n");

  if (
    ctx.has("message:text") &&
    /^\d+$/.test(ctx.message.text.substring("/donetask".length).trim())
  ) {
    doneTaskByNumber(
      Number(ctx.message.text.substring("/donetask".length).trim()),
      session,
      ctx
    );
  } else {
    ctx.reply(
      `${listString}\n\nPlease provide a task number to make done/undone.`
    );
    const { message } = await conversation.waitUntil(
      (ctx) => {
        const text = ctx.msg?.text;
        return text !== undefined && text !== null && /^\d+$/.test(text);
      },
      {
        otherwise: (ctx) =>
          ctx.reply("Please provide a task number to make done/undone."),
      }
    );
    doneTaskByNumber(Number(message?.text), session, ctx);
  }

  await conversation.external((ctx) => {
    ctx.session = session;
  });
}

async function doneTaskByNumber(
  number: number,
  session: SessionData,
  ctx: Context
) {
  const task = session.tasksList[number - 1];
  if (task) {
    task.taskIsDone = !task.taskIsDone;
    task.taskIsDone
      ? await ctx.reply(
          `Task: ${task.taskString} successfully marked as done ✅`
        )
      : await ctx.reply(
          `Task: ${task.taskString} successfully marked as undone ❌`
        );
  } else {
    await ctx.reply(`Task not found`);
  }
}

// import { type Context } from "https://deno.land/x/grammy@v1.35.0/mod.ts";

// import {
//   type Conversation,
//   type ConversationFlavor,
//   conversations,
//   createConversation,
// } from "https://deno.land/x/grammy_conversations@v2.0.1/mod.ts";

// import { MySessionContext } from "../db/freeStorage.ts";

// export type ConversationContext = ConversationFlavor<Context>;
// export type MyConversationContext = MySessionContext;

// export type MyConversation = Conversation<MyContext, MyConversationContext>;

// bot.use(conversations());

// export async function waitForTask(
//   conversation: MyConversation,
//   ctx: MyConversationContext,
// ) {
//     await ctx.reply("Please provide a task to add.");
//     const { message } = await conversation.waitFor("message:text");
//     await ctx.session.tasksList.push(message.text)
//     await ctx.reply(`Task: ${message.text} successfully added`)
// }
// bot.use(createConversation(waitForTask));
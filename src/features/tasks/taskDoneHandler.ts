import { MyContext } from "../../../bot.ts";

export async function doneTaskHandler(ctx: MyContext) {
  await ctx.conversation.enter("doneTaskConversation");
}

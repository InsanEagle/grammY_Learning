import { MyContext } from "../../../bot.ts";

export async function addTaskHandler(ctx: MyContext) {
  await ctx.conversation.enter("addTaskConversation");
}

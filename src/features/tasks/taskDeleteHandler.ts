import { MyContext } from "../../../bot.ts";

export async function deleteTaskHandler(ctx: MyContext) {
  await ctx.conversation.enter("deleteTaskConversation");
}

import { MyContext } from "../../../bot.ts";

export async function addReminderHandler(ctx: MyContext) {
  await ctx.conversation.enter("addReminderConversation");
}

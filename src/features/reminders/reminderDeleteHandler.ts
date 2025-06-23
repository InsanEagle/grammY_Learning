import { MyContext } from "../../../bot.ts";

export async function deleteReminderHandler(ctx: MyContext) {
  await ctx.conversation.enter("deleteReminderConversation");
}

import { MyContext } from "../../../core/types.ts";

export async function addReminderHandler(ctx: MyContext) {
  await ctx.conversation.enter("addReminderConversation");
}

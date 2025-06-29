import { MyContext } from "../../../core/types.ts";

export async function deleteReminderHandler(ctx: MyContext) {
  await ctx.conversation.enter("deleteReminderConversation");
}

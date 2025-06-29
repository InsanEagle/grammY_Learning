import { MyContext } from "../../../core/types.ts";

export async function deleteTaskHandler(ctx: MyContext) {
  await ctx.conversation.enter("deleteTaskConversation");
}

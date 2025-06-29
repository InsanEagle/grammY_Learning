import { MyContext } from "../../../core/types.ts";

export async function addTaskHandler(ctx: MyContext) {
  await ctx.conversation.enter("addTaskConversation");
}

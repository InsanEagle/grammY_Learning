import { MyContext } from "../../core/types.ts";
import { ReminderService } from "./reminders.service.ts";

export type ReminderHandlers = ReturnType<typeof createReminderHandlers>;

export const createReminderHandlers = (reminderService: ReminderService) => {
  const addReminderHandler = async (ctx: MyContext) => {
    await ctx.conversation.enter("addReminderConversation");
  };

  const deleteReminderHandler = async (ctx: MyContext) => {
    await ctx.conversation.enter("deleteReminderConversation");
  };

  const remindersHandler = async (ctx: MyContext) => {
    if (!ctx.from) return;
    const list = await reminderService.getRemindersList(ctx.from.id);
    await ctx.reply(list);
  };

  return {
    addReminderHandler,
    deleteReminderHandler,
    remindersHandler,
  };
};

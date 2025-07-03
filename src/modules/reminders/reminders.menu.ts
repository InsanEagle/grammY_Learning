import { Menu } from "https://deno.land/x/grammy_menu@v1.3.0/mod.ts";
import { MyContext } from "../../core/types.ts";
import { ReminderHandlers } from "./reminders.handlers.ts";

export const createRemindersMenu = (handlers: ReminderHandlers) => {
  return new Menu<MyContext>("reminders-menu")
    .text("Add reminder", (ctx) => handlers.addReminderHandler(ctx))
    .row()
    .text("Delete reminder", (ctx) => handlers.deleteReminderHandler(ctx))
    .row()
    .text("List of reminders", (ctx) => handlers.remindersHandler(ctx))
    .row()
    .back("Back to main menu");
};

import { Menu } from "https://deno.land/x/grammy_menu@v1.3.0/mod.ts";

import { MyContext } from "../../bot.ts";

import { addReminderHandler } from "../handlers/reminders/addReminderHandler.ts";
import { remindersHandler } from "../handlers/reminders/remindersHandler.ts";
import { deleteReminderHandler } from "../handlers/reminders/deleteReminderHandler.ts";

export const remindersMenu = new Menu<MyContext>("reminders-menu")
  .text("Add reminder", (ctx) => addReminderHandler(ctx))
  .row()
  .text("Delete reminder", (ctx) => deleteReminderHandler(ctx))
  .row()
  .text("List of reminders", (ctx) => remindersHandler(ctx))
  .row()
  .back("Back to main menu");

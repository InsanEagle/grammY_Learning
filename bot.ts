import "@std/dotenv/load";
import * as chrono from "chrono-node/ru";

import {
  Bot,
  session,
  Context,
} from "https://deno.land/x/grammy@v1.36.3/mod.ts";
import { freeStorage } from "https://deno.land/x/grammy_storages@v2.4.2/free/src/mod.ts";
import {
  type Conversation,
  type ConversationFlavor,
  conversations,
  createConversation,
} from "https://deno.land/x/grammy_conversations@v2.0.1/mod.ts";

import { SessionData } from "./src/db/freeStorage.ts";
import { MySessionContext } from "./src/db/freeStorage.ts";

import { mainMenu } from "./src/menus/mainMenu.ts";

// Handlers import

import { addTaskHandler } from "./src/handlers/tasks/addTaskHandler.ts";
import { tasksHandler } from "./src/handlers/tasks/tasksHandler.ts";
import { deleteTaskHandler } from "./src/handlers/tasks/deleteTaskHandler.ts";

import { addReminderHandler } from "./src/handlers/reminders/addReminderHandler.ts";
import { remindersHandler } from "./src/handlers/reminders/remindersHandler.ts";
import { deleteReminderHandler } from "./src/handlers/reminders/deleteReminderHandler.ts";

// export type MyContext = MySessionContext & ConversationContext;
// export type ConversationContext = ConversationFlavor<Context>;

export type MyContext = ConversationFlavor<MySessionContext>;
// export type MyConversationContext = Context;
export type MyConversation = Conversation<MyContext>;

// Create an instance of the `Bot` class and pass your bot token to it.
const BOT_API_KEY = Deno.env.get("BOT_API_KEY");
if (!BOT_API_KEY) {
  throw new Error("Missing required environment variable: BOT_API_KEY");
}
export const bot = new Bot<MyContext>(BOT_API_KEY);

// You can now register listeners on your bot object `bot`.
// grammY will call the listeners when users send messages to your bot.

bot.use(
  session({
    initial: () => {
      const init = { tasksList: [], remindersList: [] };
      console.log("Initializing session:", init);
      return init;
    },
    storage: freeStorage<SessionData>(bot.token),
  })
);

bot.use(conversations());
export async function waitForTaskToAdd(
  conversation: MyConversation,
  ctx: Context
) {
  const session = await conversation.external((ctx) => ctx.session);

  await ctx.reply("Please provide a task to add.");
  const { message } = await conversation.waitFor("message:text", {
    otherwise: (ctx) => ctx.reply("Please send a text message!"),
  });
  session.tasksList.push(message.text);
  await conversation.external((ctx) => {
    ctx.session = session;
  });
  await ctx.reply(`Task: ${message.text} successfully added`);
}

export async function waitForTaskToDelete(
  conversation: MyConversation,
  ctx: Context
) {
  const session = await conversation.external((ctx) => ctx.session);

  await ctx.reply("Please provide a task number to delete.");
  const { message } = await conversation.waitUntil(
    (ctx) => {
      const text = ctx.msg?.text;
      return text !== undefined && text !== null && /^\d+$/.test(text);
    },
    { otherwise: (ctx) => ctx.reply("Please provide a task number to delete.") }
  );
  const task = session.tasksList[Number(message?.text) - 1];
  if (task) {
    session.tasksList.splice(Number(message?.text) - 1, 1);
    await ctx.reply(`Task: ${task} successfully deleted`);
  } else {
    await ctx.reply(`Task not found`);
  }
  await conversation.external((ctx) => {
    ctx.session = session;
  });
}

export async function waitForReminderToAdd(
  conversation: MyConversation,
  ctx: Context
) {
  const session = await conversation.external((ctx) => ctx.session);

  await ctx.reply(
    "Please provide a reminder to add. It should be in the future"
  );
  const { message } = await conversation.waitUntil(
    (ctx) => {
      const text = ctx.msg?.text;
      if (!text) return false;

      const reminderDate = chrono.parseDate(
        text,
        { timezone: "UTC +3" },
        { forwardDate: true }
      );
      if (!reminderDate || reminderDate < new Date()) {
        return false;
      }

      return true;
    },
    {
      otherwise: (ctx) =>
        ctx.reply(
          "Please provide a reminder to add. It should be in the future"
        ),
    }
  );

  if (message?.text) {
    const reminderDate = chrono.parseDate(
      message.text,
      { timezone: "UTC +3" },
      { forwardDate: true }
    );

    const reminderObj = {
      reminderString: message.text,
      reminderTime: reminderDate,
    };

    if (!session.remindersList) {
      session.remindersList = [];
    }

    session.remindersList.push(reminderObj);
    await ctx.reply(`Reminder: ${message.text} successfully added`);
  } else {
    await ctx.reply(`Reminder not found`);
  }

  await conversation.external((ctx) => {
    ctx.session = session;
  });
}

export async function waitForRemindToDelete(
  conversation: MyConversation,
  ctx: Context
) {
  const session = await conversation.external((ctx) => ctx.session);

  await ctx.reply("Please provide a reminder number to delete.");
  const { message } = await conversation.waitUntil(
    (ctx) => {
      const text = ctx.msg?.text;
      return text !== undefined && text !== null && /^\d+$/.test(text);
    },
    {
      otherwise: (ctx) =>
        ctx.reply("Please provide a reminder number to delete."),
    }
  );
  const reminder = session.remindersList[Number(message?.text) - 1];
  if (reminder) {
    session.remindersList.splice(Number(message?.text) - 1, 1);
    await ctx.reply(`Reminder: ${reminder} successfully deleted`);
  } else {
    await ctx.reply(`Reminder not found`);
  }
  await conversation.external((ctx) => {
    ctx.session = session;
  });
}

bot.use(createConversation(waitForTaskToAdd));
bot.use(createConversation(waitForTaskToDelete));

bot.use(createConversation(waitForReminderToAdd));
bot.use(createConversation(waitForRemindToDelete));

// Make it interactive.
bot.use(mainMenu);

// Setup menu commands
await bot.api.setMyCommands([
  { command: "start", description: "Start the bot" },
  { command: "help", description: "Show available commands" },
  { command: "menu", description: "Open menu" },
  { command: "addtask", description: "Add task to the list" },
  { command: "deletetask", description: "Delete task from the list" },
  { command: "tasks", description: "Open tasks list" },
  { command: "donetask", description: "Make task done or undone" },
  { command: "addreminder", description: "Add reminder to the list" },
  { command: "deletereminder", description: "Delete reminder from the list" },
  { command: "reminders", description: "Open reminders list" },
  { command: "currencies", description: "Open the list of currencies" },
  { command: "convert", description: "Convert currency to another one" },
]);

// Remove keyboard
// bot.command("remove", async (ctx) => {
//     await ctx.reply("Клавиатура удалена", {
//         reply_markup: {
//             remove_keyboard: true,
//         },
//     });
// });

// Handle menu commands.
bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));
bot.command("help", (ctx) =>
  ctx.reply("There is a list of all available commands")
);
bot.command("menu", async (ctx) => {
  // Send the menu.
  await ctx.reply("Main menu:", { reply_markup: mainMenu });
});

// Handle tasks commands
bot.command("addtask", (ctx) => addTaskHandler(ctx));
bot.command("tasks", (ctx) => tasksHandler(ctx));
bot.command("deletetask", (ctx) => deleteTaskHandler(ctx));
bot.command("donetask", (ctx) => ctx.reply("Interactive menu with buttons"));

// Handle remind commands
bot.command("addreminder", (ctx) => addReminderHandler(ctx));
bot.command("reminders", (ctx) => remindersHandler(ctx));
bot.command("deletereminder", (ctx) => deleteReminderHandler(ctx));

// Handle currency converter commands
bot.command("currencies", (ctx) => ctx.reply("Interactive menu with buttons"));
bot.command("convert", (ctx) => ctx.reply("Interactive menu with buttons"));

// Handle other messages.
bot.on("message", (ctx) => ctx.reply("Got another message!"));

// Now that you specified how to handle messages, you can start your bot.
// This will connect to the Telegram servers and wait for messages.

// Start the bot.
bot.start();

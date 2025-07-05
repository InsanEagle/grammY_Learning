import { type Context } from "https://deno.land/x/grammy@v1.36.3/mod.ts";

import { MyConversation } from "../../core/types.ts";
import { TaskService } from "./tasks.service.ts";

export const createTaskConversations = (taskService: TaskService) => {
  async function addTaskConversation(
    conversation: MyConversation,
    ctx: Context,
  ) {
    let taskText: string | undefined;

    if (
      ctx.has("message:text") &&
      ctx.message.text.substring("/addtask".length).trim()
    ) {
      taskText = ctx.message.text.substring("/addtask".length).trim();
    } else {
      await ctx.reply("Please provide a task to add.");
      const { message } = await conversation.waitFor("message:text", {
        otherwise: (ctx) => ctx.reply("Please send a text message!"),
      });
      taskText = message.text;
    }

    if (taskText && ctx.from) {
      const fromId = ctx.from.id;
      const task = await conversation.external(async () => {
        return await taskService.addTask(fromId, taskText);
      });
      await ctx.reply(`Task: ${task.text} successfully added`);
    }
  }

  async function deleteTaskConversation(
    conversation: MyConversation,
    ctx: Context,
  ) {
    if (!ctx.from) return;
    const fromId = ctx.from.id;
    const listString = await conversation.external(async () => {
      return await taskService.getTasksList(fromId);
    });
    if (listString === "No tasks in the list") {
      await ctx.reply(listString);
      return;
    }

    let taskIndex: string | undefined;

    if (
      ctx.has("message:text") &&
      /^\d+$/.test(ctx.message.text.substring("/deletetask".length).trim())
    ) {
      taskIndex = ctx.message.text.substring("/deletetask".length).trim();
    } else {
      await ctx.reply(
        `${listString}\n\nPlease provide a task number to delete.`,
      );
      const { message } = await conversation.waitUntil(
        (ctx) => /^\d+$/.test(ctx.msg?.text ?? ""),
        {
          otherwise: (ctx) =>
            ctx.reply("Please provide a valid task number to delete."),
        },
      );
      taskIndex = message?.text;
    }

    if (taskIndex && ctx.from) {
      const fromId = ctx.from.id;
      const deletedTask = await conversation.external(async () => {
        return await taskService.deleteTask(
          fromId,
          Number(taskIndex),
        );
      });
      if (deletedTask) {
        await ctx.reply(`Task: ${deletedTask.text} successfully deleted`);
      } else {
        await ctx.reply(`Task not found`);
      }
    }
  }

  async function doneTaskConversation(
    conversation: MyConversation,
    ctx: Context,
  ) {
    if (!ctx.from) return;

    const fromId = ctx.from.id;
    const listString = await conversation.external(async () => {
      return await taskService.getTasksList(fromId);
    });
    if (listString === "No tasks in the list") {
      await ctx.reply(listString);
      return;
    }
    //TODO: Add check for inline message
    await ctx.reply(
      `${listString}\n\nPlease provide a task number to make done/undone.`,
    );
    const { message } = await conversation.waitUntil(
      (ctx) => /^\d+$/.test(ctx.msg?.text ?? ""),
      {
        otherwise: (ctx) => ctx.reply("Please provide a valid task number."),
      },
    );

    const taskIndex = message?.text;
    if (taskIndex && ctx.from) {
      const fromId = ctx.from.id;
      const updatedTask = await conversation.external(async () => {
        return await taskService.toggleTask(
          fromId,
          Number(taskIndex),
        );
      });

      if (updatedTask) {
        const status = updatedTask.isDone ? "done ✅" : "undone ❌";
        await ctx.reply(`Task: ${updatedTask.text} marked as ${status}`);
      } else {
        await ctx.reply(`Task not found`);
      }
    }
  }

  return { addTaskConversation, deleteTaskConversation, doneTaskConversation };
};

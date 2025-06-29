// import { type Context } from "https://deno.land/x/grammy@v1.36.3/mod.ts";

// import { MyConversation, SessionData } from "../../../core/types.ts";

// export async function deleteTaskConversation(
//   conversation: MyConversation,
//   ctx: Context,
// ) {
//   const session = await conversation.external((ctx) => ctx.session);
//   const listString = session.tasksList
//     .map((task, index) => {
//       const mark = task.taskIsDone ? "✅" : "❌";
//       const status = task.taskIsDone ? "Done" : "Undone";
//       return `${mark}${index + 1}. ${task.taskString} ${status}`;
//     })
//     .join("\n");

//   if (
//     ctx.has("message:text") &&
//     /^\d+$/.test(ctx.message.text.substring("/deletetask".length).trim())
//   ) {
//     deleteTaskByNumber(
//       Number(ctx.message.text.substring("/deletetask".length).trim()),
//       session,
//       ctx,
//     );
//   } else {
//     ctx.reply(`${listString}\n\nPlease provide a task number to delete.`);
//     const { message } = await conversation.waitUntil(
//       (ctx) => {
//         const text = ctx.msg?.text;
//         return text !== undefined && text !== null && /^\d+$/.test(text);
//       },
//       {
//         otherwise: (ctx) =>
//           ctx.reply("Please provide a task number to delete."),
//       },
//     );
//     deleteTaskByNumber(Number(message?.text), session, ctx);
//   }

//   await conversation.external((ctx) => {
//     ctx.session = session;
//   });
// }

// async function deleteTaskByNumber(
//   number: number,
//   session: SessionData,
//   ctx: Context,
// ) {
//   const task = session.tasksList[number - 1];
//   if (task) {
//     session.tasksList.splice(number - 1, 1);
//     await ctx.reply(`Task: ${task.taskString} successfully deleted`);
//   } else {
//     await ctx.reply(`Task not found`);
//   }
// }

import {
  assertSpyCall,
  Spy,
} from "https://deno.land/std@0.224.0/testing/mock.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { clearDb, createMockContext } from "../../../test/helpers.ts";
import { createTaskHandlers } from "./tasks.handlers.ts";
import { TaskService } from "./tasks.service.ts";
import { TaskRepository } from "./tasks.repository.ts";

Deno.test("TaskHandlers - addTaskHandler", async () => {
  const mockService = {} as unknown as TaskService;
  const handlers = createTaskHandlers(mockService);
  const ctx = createMockContext();

  await handlers.addTaskHandler(ctx);

  assertSpyCall(ctx.conversation.enter as Spy<any>, 0, {
    args: ["addTaskConversation"],
  });
});

Deno.test("TaskHandlers - deleteTaskHandler", async () => {
  const mockService = {} as unknown as TaskService;
  const handlers = createTaskHandlers(mockService);
  const ctx = createMockContext();

  await handlers.deleteTaskHandler(ctx);

  assertSpyCall(ctx.conversation.enter as Spy<any>, 0, {
    args: ["deleteTaskConversation"],
  });
});

Deno.test("TaskHandlers - doneTaskHandler", async () => {
  const mockService = {} as unknown as TaskService;
  const handlers = createTaskHandlers(mockService);
  const ctx = createMockContext();

  await handlers.doneTaskHandler(ctx);

  assertSpyCall(ctx.conversation.enter as Spy<any>, 0, {
    args: ["doneTaskConversation"],
  });
});

Deno.test("TaskHandlers - tasksHandler", async (t) => {
  await clearDb();
  const taskRepository = new TaskRepository();
  const taskService = new TaskService(taskRepository);
  const handlers = createTaskHandlers(taskService);
  const ctx = createMockContext();

  await t.step(
    "should reply with 'No tasks in the list' if no tasks exist",
    async () => {
      await handlers.tasksHandler(ctx);
      assertSpyCall(ctx.reply as Spy<any>, 0, {
        args: ["No tasks in the list"],
      });
    },
  );

  await t.step("should reply with a list of tasks if tasks exist", async () => {
    await taskService.addTask(ctx.from!.id, "Test Task 1");
    await taskService.addTask(ctx.from!.id, "Test Task 2");
    await handlers.tasksHandler(ctx);
    assertSpyCall(ctx.reply as Spy<any>, 1, {
      args: ["❌ 1. Test Task 1 (undone)\n❌ 2. Test Task 2 (undone)"],
    });
  });
});

Deno.test("TaskHandlers - clearTasksHandler", async (t) => {
  await clearDb();
  const taskRepository = new TaskRepository();
  const taskService = new TaskService(taskRepository);
  const handlers = createTaskHandlers(taskService);
  const ctx = createMockContext();

  await t.step("should clear tasks and reply with confirmation", async () => {
    await taskService.addTask(ctx.from!.id, "Task to clear");
    await handlers.clearTasksHandler(ctx);
    assertSpyCall(ctx.reply as Spy<any>, 0, {
      args: ["All tasks have been cleared!"],
    });
    const tasks = await taskService.getTasks(ctx.from!.id);
    assertEquals(tasks.length, 0);
  });
});

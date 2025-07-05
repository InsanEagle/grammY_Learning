import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import { TaskService } from "./tasks.service.ts";
import { TaskRepository } from "./tasks.repository.ts";
import { __setKv, initializeDb, kv } from "../../core/database.ts";
import { MockKv } from "../../../test/mocks/kv.mock.ts";

Deno.test(
  "TaskService",
  { sanitizeResources: false, sanitizeOps: false },
  async (t) => {
    // Initialize a temporary, real DB instance just to have a valid object to swap.
    await initializeDb("./test.service.db");
    const originalKv = kv;
    const mockKv = new MockKv();
    __setKv(mockKv);

    try {
      const taskRepository = new TaskRepository();
      const service = new TaskService(taskRepository);
      const userId = 1;

      await t.step("addTask", async () => {
        mockKv.store.clear();
        const task = await service.addTask(userId, "Test Task");
        assertEquals(task.text, "Test Task");
        assertEquals(task.userId, userId);
        assertEquals(mockKv.store.size, 1);
      });

      await t.step("getTasksList", async () => {
        mockKv.store.clear();
        await service.addTask(userId, "Task 1");
        await service.addTask(userId, "Task 2");
        const list = await service.getTasksList(userId);
        assertExists(list.includes("1. Task 1"));
        assertExists(list.includes("2. Task 2"));
      });

      await t.step("deleteTask", async () => {
        mockKv.store.clear();
        await service.addTask(userId, "Test Task");
        assertEquals(mockKv.store.size, 1);
        const deleted = await service.deleteTask(userId, 1);
        assertExists(deleted);
        assertEquals(deleted.text, "Test Task");
        const tasks = await service.getTasks(userId);
        assertEquals(tasks.length, 0);
        assertEquals(mockKv.store.size, 0);
      });

      await t.step("toggleTask", async () => {
        mockKv.store.clear();
        await service.addTask(userId, "Test Task");
        const toggled = await service.toggleTask(userId, 1);
        assertEquals(toggled?.isDone, true);
        const toggledAgain = await service.toggleTask(userId, 1);
        assertEquals(toggledAgain?.isDone, false);
      });

      await t.step("clearTasks", async () => {
        mockKv.store.clear();
        await service.addTask(userId, "Task 1");
        await service.addTask(userId, "Task 2");
        assertEquals(mockKv.store.size, 2);
        await service.clearTasks(userId);
        const tasks = await service.getTasks(userId);
        assertEquals(tasks.length, 0);
        assertEquals(mockKv.store.size, 0);
      });
    } finally {
      __setKv(originalKv);
      originalKv.close();
      try {
        Deno.removeSync("./test.service.db");
        Deno.removeSync("./test.service.db-shm");
        Deno.removeSync("./test.service.db-wal");
      } catch (error) {
        console.error(error);
      }
    }
  },
);

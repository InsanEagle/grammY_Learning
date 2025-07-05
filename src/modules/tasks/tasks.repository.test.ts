import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { TaskRepository } from "./tasks.repository.ts";
import { setupTestDb } from "../../../test/helpers.ts";

Deno.test(
  "TaskRepository",
  { sanitizeResources: false, sanitizeOps: false },
  async (t) => {
    const { clear, teardown } = await setupTestDb();

    try {
      const repo = new TaskRepository();
      const userId = 1;

      await t.step("create", async () => {
        await clear();
        const task = await repo.create(userId, "Test Task");
        assertEquals(task.text, "Test Task");
        assertEquals(task.userId, userId);
        assertExists(task.id);
      });

      await t.step("findByUser", async () => {
        await clear();
        await repo.create(userId, "Task 1");
        await repo.create(userId, "Task 2");
        const tasks = await repo.findByUser(userId);
        assertEquals(tasks.length, 2);
      });

      await t.step("findById", async () => {
        await clear();
        const task = await repo.create(userId, "Test Task");
        const found = await repo.findById(userId, task.id);
        assertEquals(found?.id, task.id);
      });

      await t.step("update", async () => {
        await clear();
        const task = await repo.create(userId, "Test Task");
        const updated = await repo.update(userId, task.id, { isDone: true });
        assertEquals(updated?.isDone, true);
      });

      await t.step("delete", async () => {
        await clear();
        const task = await repo.create(userId, "Test Task");
        const deleted = await repo.delete(userId, task.id);
        assert(deleted);
        const found = await repo.findById(userId, task.id);
        assertEquals(found, null);
      });

      await t.step("deleteAll", async () => {
        await clear();
        await repo.create(userId, "Task 1");
        await repo.create(userId, "Task 2");
        await repo.deleteAll(userId);
        const tasks = await repo.findByUser(userId);
        assertEquals(tasks.length, 0);
      });
    } finally {
      teardown();
    }
  },
);

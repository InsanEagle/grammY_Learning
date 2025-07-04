import {
  assertEquals,
  assertExists,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { TaskRepository } from "./tasks.repository.ts";
import { kv } from "../../core/database.ts";

async function clearDb() {
  const iter = kv.list({ prefix: [] });
  for await (const entry of iter) {
    await kv.delete(entry.key);
  }
}

Deno.test(
  "TaskRepository",
  { sanitizeResources: false, sanitizeOps: false },
  async (t) => {
    const repo = new TaskRepository();
    const userId = 1;

    await t.step("create", async () => {
      await clearDb();
      const task = await repo.create(userId, "Test Task");
      assertEquals(task.text, "Test Task");
      assertEquals(task.userId, userId);
      assertExists(task.id);
    });

    await t.step("findByUser", async () => {
      await clearDb();
      await repo.create(userId, "Task 1");
      await repo.create(userId, "Task 2");
      const tasks = await repo.findByUser(userId);
      assertEquals(tasks.length, 2);
    });

    await t.step("findById", async () => {
      await clearDb();
      const task = await repo.create(userId, "Test Task");
      const found = await repo.findById(userId, task.id);
      assertEquals(found?.id, task.id);
    });

    await t.step("update", async () => {
      await clearDb();
      const task = await repo.create(userId, "Test Task");
      const updated = await repo.update(userId, task.id, { isDone: true });
      assertEquals(updated?.isDone, true);
    });

    await t.step("delete", async () => {
      await clearDb();
      const task = await repo.create(userId, "Test Task");
      const deleted = await repo.delete(userId, task.id);
      assert(deleted);
      const found = await repo.findById(userId, task.id);
      assertEquals(found, null);
    });

    await t.step("deleteAll", async () => {
      await clearDb();
      await repo.create(userId, "Task 1");
      await repo.create(userId, "Task 2");
      await repo.deleteAll(userId);
      const tasks = await repo.findByUser(userId);
      assertEquals(tasks.length, 0);
    });
  },
);

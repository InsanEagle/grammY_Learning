import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { TaskService } from "./tasks.service.ts";
import { TaskRepository } from "./tasks.repository.ts";
import { Task } from "./tasks.types.ts";

// Mock TaskRepository
class MockTaskRepository implements Partial<TaskRepository> {
  private tasks: Task[] = [];

  create(userId: number, text: string): Promise<Task> {
    const task: Task = {
      id: crypto.randomUUID(),
      userId,
      text,
      isDone: false,
      createdAt: new Date(),
    };
    this.tasks.push(task);
    return Promise.resolve(task);
  }

  findByUser(userId: number): Promise<Task[]> {
    return Promise.resolve(this.tasks.filter((t) => t.userId === userId));
  }

  findById(userId: number, taskId: string): Promise<Task | null> {
    return Promise.resolve(
      this.tasks.find((t) => t.userId === userId && t.id === taskId) || null,
    );
  }

  update(
    userId: number,
    taskId: string,
    data: Partial<Pick<Task, "isDone" | "text">>,
  ): Promise<Task | null> {
    const task = this.tasks.find((t) =>
      t.userId === userId && t.id === taskId
    );
    if (task) {
      Object.assign(task, data);
      return Promise.resolve(task);
    }
    return Promise.resolve(null);
  }

  delete(userId: number, taskId: string): Promise<boolean> {
    const index = this.tasks.findIndex((t) =>
      t.userId === userId && t.id === taskId
    );
    if (index > -1) {
      this.tasks.splice(index, 1);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  deleteAll(userId: number): Promise<void> {
    this.tasks = this.tasks.filter((t) => t.userId !== userId);
    return Promise.resolve();
  }
}

Deno.test("TaskService - addTask", async () => {
  const mockRepo = new MockTaskRepository() as unknown as TaskRepository;
  const service = new TaskService(mockRepo);
  const task = await service.addTask(1, "Test Task");
  assertEquals(task.text, "Test Task");
  assertEquals(task.userId, 1);
});

Deno.test("TaskService - getTasksList", async () => {
  const mockRepo = new MockTaskRepository() as unknown as TaskRepository;
  const service = new TaskService(mockRepo);
  await service.addTask(1, "Task 1");
  await service.addTask(1, "Task 2");
  const list = await service.getTasksList(1);
  assertExists(list.includes("1. Task 1"));
  assertExists(list.includes("2. Task 2"));
});

Deno.test("TaskService - deleteTask", async () => {
  const mockRepo = new MockTaskRepository() as unknown as TaskRepository;
  const service = new TaskService(mockRepo);
  const task = await service.addTask(1, "Test Task");
  const deleted = await service.deleteTask(1, 1);
  assertEquals(deleted?.id, task.id);
  const tasks = await service.getTasks(1);
  assertEquals(tasks.length, 0);
});

Deno.test("TaskService - toggleTask", async () => {
  const mockRepo = new MockTaskRepository() as unknown as TaskRepository;
  const service = new TaskService(mockRepo);
  await service.addTask(1, "Test Task");
  const toggled = await service.toggleTask(1, 1);
  assertEquals(toggled?.isDone, true);
  const toggledAgain = await service.toggleTask(1, 1);
  assertEquals(toggledAgain?.isDone, false);
});

Deno.test("TaskService - clearTasks", async () => {
  const mockRepo = new MockTaskRepository() as unknown as TaskRepository;
  const service = new TaskService(mockRepo);
  await service.addTask(1, "Task 1");
  await service.addTask(1, "Task 2");
  await service.clearTasks(1);
  const tasks = await service.getTasks(1);
  assertEquals(tasks.length, 0);
});

import { kv } from "../../core/database.ts";
import { Task } from "./tasks.types.ts";

const TASKS_KEY = "tasks_by_user";

export class TaskRepository {
  async create(userId: number, text: string): Promise<Task> {
    const task: Task = {
      id: crypto.randomUUID(),
      userId,
      text,
      isDone: false,
      createdAt: new Date(),
    };
    await kv.set([TASKS_KEY, userId, task.id], task);
    return task;
  }

  async findByUser(userId: number): Promise<Task[]> {
    const tasks: Task[] = [];
    const iter = kv.list<Task>({ prefix: [TASKS_KEY, userId] });
    for await (const entry of iter) {
      tasks.push(entry.value);
    }
    return tasks.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async findById(userId: number, taskId: string): Promise<Task | null> {
    const res = await kv.get<Task>([TASKS_KEY, userId, taskId]);
    return res.value;
  }

  async update(
    userId: number,
    taskId: string,
    data: Partial<Pick<Task, "isDone" | "text">>,
  ): Promise<Task | null> {
    const task = await this.findById(userId, taskId);
    if (!task) return null;

    const updatedTask = { ...task, ...data };
    await kv.set([TASKS_KEY, userId, updatedTask.id], updatedTask);
    return updatedTask;
  }

  async delete(userId: number, taskId: string): Promise<boolean> {
    const task = await this.findById(userId, taskId);
    if (!task) return false;
    await kv.delete([TASKS_KEY, userId, taskId]);
    return true;
  }

  async deleteAll(userId: number): Promise<void> {
    const tasks = await this.findByUser(userId);
    const promises = tasks.map((task) =>
      kv.delete([TASKS_KEY, userId, task.id])
    );
    await Promise.all(promises);
  }
}

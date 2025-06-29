import { TaskRepository } from "./tasks.repository.ts";
import { Task } from "./tasks.types.ts";

export class TaskService {
  constructor(private readonly taskRepository: TaskRepository) {}

  async addTask(userId: number, text: string): Promise<Task> {
    return await this.taskRepository.create(userId, text);
  }

  async getTasks(userId: number): Promise<Task[]> {
    return await this.taskRepository.findByUser(userId);
  }

  async getTasksList(userId: number): Promise<string> {
    const tasks = await this.getTasks(userId);
    if (tasks.length === 0) {
      return "No tasks in the list";
    }
    return tasks
      .map((task, index) => {
        const mark = task.isDone ? "✅" : "❌";
        const status = task.isDone ? "(done)" : "(undone)";
        return `${mark} ${index + 1}. ${task.text} ${status}`;
      })
      .join("\n");
  }

  async deleteTask(userId: number, index: number): Promise<Task | null> {
    const tasks = await this.taskRepository.findByUser(userId);
    const taskToDelete = tasks[index - 1];
    if (!taskToDelete) return null;
    await this.taskRepository.delete(userId, taskToDelete.id);
    return taskToDelete;
  }

  async toggleTask(userId: number, index: number): Promise<Task | null> {
    const tasks = await this.taskRepository.findByUser(userId);
    const taskToToggle = tasks[index - 1];
    if (!taskToToggle) return null;
    return this.taskRepository.update(userId, taskToToggle.id, {
      isDone: !taskToToggle.isDone,
    });
  }

  async clearTasks(userId: number): Promise<void> {
    await this.taskRepository.deleteAll(userId);
  }
}

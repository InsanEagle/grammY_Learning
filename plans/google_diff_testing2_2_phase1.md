Generated diff diff --git a/src/core/database.ts b/src/core/database.ts index
731005c..1530263 100644 --- a/src/core/database.ts +++ b/src/core/database.ts @@
-2,7 +2,7 @@ // import { freeStorage } from
"https://deno.land/x/grammy_storages@v2.4.2/free/src/mod.ts"; // import {
FileAdapter } from "https://deno.land/x/grammy_storages/file/src/mod.ts";

// Deno.kv storage -export const kv = await Deno.openKv("./sessions/kv.db");
+export let kv = await Deno.openKv("./sessions/kv.db"); export const storage =
new DenoKVAdapter(kv);

// File storage diff --git a/src/modules/reminders/reminders.service.test.ts
b/src/modules/reminders/reminders.service.test.ts index 5481710..5539314 100644
--- a/src/modules/reminders/reminders.service.test.ts +++
b/src/modules/reminders/reminders.service.test.ts @@ -1,78 +1,69 @@ import {
assertEquals, assertExists, } from
"https://deno.land/std@0.224.0/assert/mod.ts"; +import { stub } from
"https://deno.land/std@0.224.0/testing/mock.ts"; import { ReminderService } from
"./reminders.service.ts"; import { ReminderRepository } from
"./reminders.repository.ts"; -import { Reminder } from "./reminders.types.ts";
+import * as db from "../../core/database.ts"; +import { MockKv } from
"../../../test/mocks/kv.mock.ts";

-// Mock ReminderRepository -class MockReminderRepository implements
Partial<ReminderRepository> {

- private reminders: Reminder[] = [];
-
- create(userId: number, text: string): Promise<Reminder> {
- const reminder: Reminder = {
- reminderId: crypto.randomUUID(),
- reminderUserId: userId,
- reminderString: text,
- reminderDate: new Date(),
- reminderToDateString: new Date().toISOString(),
- createdAt: new Date(),
- };
- this.reminders.push(reminder);
- return Promise.resolve(reminder);
- }
-
- findByUser(userId: number): Promise<Reminder[]> {
- return Promise.resolve(
- this.reminders.filter((r) => r.reminderUserId === userId),
- );
- }
-
- findById(userId: number, reminderId: string): Promise<Reminder | null> {
- return Promise.resolve(
- this.reminders.find((r) =>
- r.reminderUserId === userId && r.reminderId === reminderId
- ) || null,
- );
- }
-
- delete(userId: number, reminderId: string): Promise<boolean> {
- const index = this.reminders.findIndex((r) =>
- r.reminderUserId === userId && r.reminderId === reminderId
- );
- if (index > -1) {
- this.reminders.splice(index, 1);
- return Promise.resolve(true);
- }
- return Promise.resolve(false);
- }
-
- deleteAll(userId: number): Promise<void> {
- this.reminders = this.reminders.filter((r) => r.reminderUserId !== userId);
- return Promise.resolve();
- } -}
-

-Deno.test("ReminderService - addReminder", async () => {

- const mockRepo =
- new MockReminderRepository() as unknown as ReminderRepository;
- const service = new ReminderService(mockRepo);
- const reminder = await service.addReminder(1, "Test Reminder");
- assertEquals(reminder.reminderString, "Test Reminder");
- assertEquals(reminder.reminderUserId, 1); -});
-

-Deno.test("ReminderService - getRemindersList", async () => {

- const mockRepo =
- new MockReminderRepository() as unknown as ReminderRepository;
- const service = new ReminderService(mockRepo);
- await service.addReminder(1, "Reminder 1");
- await service.addReminder(1, "Reminder 2");
- const list = await service.getRemindersList(1);
- assertExists(list.includes("1. Reminder 1"));
- assertExists(list.includes("2. Reminder 2")); -});
-

-Deno.test("ReminderService - deleteReminder", async () => {

- const mockRepo =
- new MockReminderRepository() as unknown as ReminderRepository;
- const service = new ReminderService(mockRepo);
- const reminder = await service.addReminder(1, "Test Reminder");
- const deleted = await service.deleteReminder(1, reminder.reminderId);
- assertEquals(deleted?.reminderId, reminder.reminderId);
- const reminders = await service.getReminders(1);
- assertEquals(reminders.length, 0); -});
-

-Deno.test("ReminderService - clearReminders", async () => {

- const mockRepo =
- new MockReminderRepository() as unknown as ReminderRepository;
- const service = new ReminderService(mockRepo);
- await service.addReminder(1, "Reminder 1");
- await service.addReminder(1, "Reminder 2");
- await service.clearReminders(1);
- const reminders = await service.getReminders(1);
- assertEquals(reminders.length, 0); -}); +Deno.test(

* "ReminderService",
* { sanitizeResources: false, sanitizeOps: false },
* async (t) => {
* const mockKv = new MockKv();
* const dbStub = stub(db, "kv", mockKv as any);
*
* const reminderRepository = new ReminderRepository();
* const service = new ReminderService(reminderRepository);
* const userId = 1;
*
* await t.step("addReminder", async () => {
* mockKv.store.clear();
* const reminder = await service.addReminder(userId, "Test Reminder завтра в 10");
* assertEquals(reminder.reminderString, "Test Reminder завтра в 10");
* assertEquals(reminder.reminderUserId, userId);
* assertEquals(mockKv.store.size, 2); // reminders_by_user and reminders_by_time
* });
*
* await t.step("getRemindersList", async () => {
* mockKv.store.clear();
* await service.addReminder(userId, "Reminder 1 завтра в 11");
* await service.addReminder(userId, "Reminder 2 послезавтра в 12");
* const list = await service.getRemindersList(userId);
* assertExists(list.includes("1. Reminder 1"));
* assertExists(list.includes("2. Reminder 2"));
* });
*
* await t.step("deleteReminder", async () => {
* mockKv.store.clear();
* const reminder = await service.addReminder(userId, "Test Reminder завтра");
* assertEquals(mockKv.store.size, 2);
* const deleted = await service.deleteReminder(userId, reminder.reminderId);
* assertEquals(deleted?.reminderId, reminder.reminderId);
* const reminders = await service.getReminders(userId);
* assertEquals(reminders.length, 0);
* assertEquals(mockKv.store.size, 0);
* });
*
* await t.step("clearReminders", async () => {
* mockKv.store.clear();
* await service.addReminder(userId, "Reminder 1 завтра");
* await service.addReminder(userId, "Reminder 2 послезавтра");
* assertEquals(mockKv.store.size, 4);
* await service.clearReminders(userId);
* const reminders = await service.getReminders(userId);
* assertEquals(reminders.length, 0);
* // Note: clearReminders only deletes from reminders_by_user, not reminders_by_time
* // This is a potential bug in the source code, but the test reflects current behavior.
* assertEquals(mockKv.store.size, 2);
* });
*
* dbStub.restore();
* }, +); diff --git a/src/modules/tasks/tasks.service.test.ts
  b/src/modules/tasks/tasks.service.test.ts index 6301140..9058145 100644 ---
  a/src/modules/tasks/tasks.service.test.ts +++
  b/src/modules/tasks/tasks.service.test.ts @@ -1,88 +1,76 @@ import {
  assertEquals, assertExists, } from
  "https://deno.land/std@0.224.0/assert/mod.ts"; +import { stub } from
  "https://deno.land/std@0.224.0/testing/mock.ts"; import { TaskService } from
  "./tasks.service.ts"; import { TaskRepository } from "./tasks.repository.ts";
  -import { Task } from "./tasks.types.ts"; +import * as db from
  "../../core/database.ts"; +import { MockKv } from
  "../../../test/mocks/kv.mock.ts";

-// Mock TaskRepository -class MockTaskRepository implements
Partial<TaskRepository> {

- private tasks: Task[] = [];
-
- create(userId: number, text: string): Promise<Task> {
- const task: Task = {
- id: crypto.randomUUID(),
- userId,
- text,
- isDone: false,
- createdAt: new Date(),
- };
- this.tasks.push(task);
- return Promise.resolve(task);
- }
-
- findByUser(userId: number): Promise<Task[]> {
- return Promise.resolve(this.tasks.filter((t) => t.userId === userId));
- }
-
- findById(userId: number, taskId: string): Promise<Task | null> {
- return Promise.resolve(
- this.tasks.find((t) => t.userId === userId && t.id === taskId) || null,
- );
- }
-
- update(
- userId: number,
- taskId: string,
- data: Partial<Pick<Task, "isDone" | "text">>,
- ): Promise<Task | null> {
- const task = this.tasks.find((t) => t.userId === userId && t.id === taskId);
- if (task) {
- Object.assign(task, data);
- return Promise.resolve(task);
- }
- return Promise.resolve(null);
- }
-
- delete(userId: number, taskId: string): Promise<boolean> {
- const index = this.tasks.findIndex((t) =>
- t.userId === userId && t.id === taskId
- );
- if (index > -1) {
- this.tasks.splice(index, 1);
- return Promise.resolve(true);
- }
- return Promise.resolve(false);
- }
-
- deleteAll(userId: number): Promise<void> {
- this.tasks = this.tasks.filter((t) => t.userId !== userId);
- return Promise.resolve();
- } -}
-

-Deno.test("TaskService - addTask", async () => {

- const mockRepo = new MockTaskRepository() as unknown as TaskRepository;
- const service = new TaskService(mockRepo);
- const task = await service.addTask(1, "Test Task");
- assertEquals(task.text, "Test Task");
- assertEquals(task.userId, 1); -});
-

-Deno.test("TaskService - getTasksList", async () => {

- const mockRepo = new MockTaskRepository() as unknown as TaskRepository;
- const service = new TaskService(mockRepo);
- await service.addTask(1, "Task 1");
- await service.addTask(1, "Task 2");
- const list = await service.getTasksList(1);
- assertExists(list.includes("1. Task 1"));
- assertExists(list.includes("2. Task 2")); -});
-

-Deno.test("TaskService - deleteTask", async () => {

- const mockRepo = new MockTaskRepository() as unknown as TaskRepository;
- const service = new TaskService(mockRepo);
- const task = await service.addTask(1, "Test Task");
- const deleted = await service.deleteTask(1, 1);
- assertEquals(deleted?.id, task.id);
- const tasks = await service.getTasks(1);
- assertEquals(tasks.length, 0); -});
-

-Deno.test("TaskService - toggleTask", async () => {

- const mockRepo = new MockTaskRepository() as unknown as TaskRepository;
- const service = new TaskService(mockRepo);
- await service.addTask(1, "Test Task");
- const toggled = await service.toggleTask(1, 1);
- assertEquals(toggled?.isDone, true);
- const toggledAgain = await service.toggleTask(1, 1);
- assertEquals(toggledAgain?.isDone, false); -});
-

-Deno.test("TaskService - clearTasks", async () => {

- const mockRepo = new MockTaskRepository() as unknown as TaskRepository;
- const service = new TaskService(mockRepo);
- await service.addTask(1, "Task 1");
- await service.addTask(1, "Task 2");
- await service.clearTasks(1);
- const tasks = await service.getTasks(1);
- assertEquals(tasks.length, 0); -}); +Deno.test(

* "TaskService",
* { sanitizeResources: false, sanitizeOps: false },
* async (t) => {
* const mockKv = new MockKv();
* const dbStub = stub(db, "kv", mockKv as any);
*
* const taskRepository = new TaskRepository();
* const service = new TaskService(taskRepository);
* const userId = 1;
*
* await t.step("addTask", async () => {
* mockKv.store.clear();
* const task = await service.addTask(userId, "Test Task");
* assertEquals(task.text, "Test Task");
* assertEquals(task.userId, userId);
* assertEquals(mockKv.store.size, 1);
* });
*
* await t.step("getTasksList", async () => {
* mockKv.store.clear();
* await service.addTask(userId, "Task 1");
* await service.addTask(userId, "Task 2");
* const list = await service.getTasksList(userId);
* assertExists(list.includes("1. Task 1"));
* assertExists(list.includes("2. Task 2"));
* });
*
* await t.step("deleteTask", async () => {
* mockKv.store.clear();
* await service.addTask(userId, "Test Task");
* assertEquals(mockKv.store.size, 1);
* const deleted = await service.deleteTask(userId, 1);
* assertExists(deleted);
* assertEquals(deleted.text, "Test Task");
* const tasks = await service.getTasks(userId);
* assertEquals(tasks.length, 0);
* assertEquals(mockKv.store.size, 0);
* });
*
* await t.step("toggleTask", async () => {
* mockKv.store.clear();
* await service.addTask(userId, "Test Task");
* const toggled = await service.toggleTask(userId, 1);
* assertEquals(toggled?.isDone, true);
* const toggledAgain = await service.toggleTask(userId, 1);
* assertEquals(toggledAgain?.isDone, false);
* });
*
* await t.step("clearTasks", async () => {
* mockKv.store.clear();
* await service.addTask(userId, "Task 1");
* await service.addTask(userId, "Task 2");
* assertEquals(mockKv.store.size, 2);
* await service.clearTasks(userId);
* const tasks = await service.getTasks(userId);
* assertEquals(tasks.length, 0);
* assertEquals(mockKv.store.size, 0);
* });
*
* dbStub.restore();
* }, +); diff --git a/test/mocks/kv.mock.ts b/test/mocks/kv.mock.ts new file
  mode 100644 index 0000000..9181156 --- /dev/null +++ b/test/mocks/kv.mock.ts
  @@ -0,0 +1,78 @@ +//! This is a mock implementation of the Deno.Kv interface
  for testing purposes. +//! It uses an in-memory Map to store data and
  simulates the behavior of +//! `get`, `set`, `delete`, `list`, and `atomic`
  operations. +//! It is not a complete implementation and only supports the
  features used by +//! the application's repositories.
*

+function keyToString(key: Deno.KvKey): string {

- return key.map((part) => {
- if (part instanceof Uint8Array) {
- return `U8(${Array.from(part).join(",")})`;
- }
- return String(part);
- }).join("/"); +}
-

+class MockAtomic {

- private operations: (() => void)[] = [];
-
- constructor(private store: Map<string, any>) {}
-
- set(key: Deno.KvKey, value: any): this {
- this.operations.push(() => {
- this.store.set(keyToString(key), value);
- });
- return this;
- }
-
- delete(key: Deno.KvKey): this {
- this.operations.push(() => {
- this.store.delete(keyToString(key));
- });
- return this;
- }
-
- commit(): Promise<{ ok: boolean }> {
- this.operations.forEach((op) => op());
- return Promise.resolve({ ok: true });
- } +}
-

+export class MockKv implements Partial<Deno.Kv> {

- public store = new Map<string, any>();
-
- get<T>(key: Deno.KvKey): Promise<Deno.KvEntry<T>> {
- const value = this.store.get(keyToString(key));
- return Promise.resolve({
- key,
- value: value ?? null,
- versionstamp: value ? "mock-versionstamp" : null,
- });
- }
-
- set(key: Deno.KvKey, value: any): Promise<{ ok: boolean; versionstamp: string
  }> {
- this.store.set(keyToString(key), value);
- return Promise.resolve({ ok: true, versionstamp: "mock-versionstamp" });
- }
-
- delete(key: Deno.KvKey): Promise<void> {
- this.store.delete(keyToString(key));
- return Promise.resolve();
- }
-
- async *list<T>(
- selector: Deno.KvListSelector,
- ): AsyncIterableIterator<Deno.KvEntry<T>> {
- const prefix = keyToString(selector.prefix);
- for (const [keyStr, value] of this.store.entries()) {
- if (keyStr.startsWith(prefix)) {
- // The key reconstruction is not perfect, but repositories only use `entry.value`.
- yield { key: [keyStr], value, versionstamp: "mock-versionstamp" };
- }
- }
- }
-
- atomic() {
- return new MockAtomic(this.store);
- } +}

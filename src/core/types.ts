import {
  Context,
  SessionFlavor,
} from "https://deno.land/x/grammy@v1.36.3/mod.ts";
import {
  type Conversation,
  type ConversationFlavor,
} from "https://deno.land/x/grammy_conversations@v2.0.1/mod.ts";
import * as schedule from "node-schedule";

interface Task {
  taskString: string;
  taskIsDone: boolean;
}

interface Reminder {
  reminderString: string;
  reminderTime: Date;
  reminderToDateString: string;
  reminderIsActive: boolean;
  id: string;
}

interface ScheduledJob {
  job: schedule.Job;
  chatId: number;
  reminderString: string;
}

// Define the session structure.
export interface SessionData {
  tasksList: Array<Task>;
  remindersList: Array<Reminder>;
}

export const jobStore = new Map<string, ScheduledJob>();

export type MySessionContext = Context & SessionFlavor<SessionData>;

export type MyContext = ConversationFlavor<MySessionContext>;
export type MyConversation = Conversation<MyContext>;

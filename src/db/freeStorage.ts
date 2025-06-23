import {
  Context,
  SessionFlavor,
} from "https://deno.land/x/grammy@v1.36.3/mod.ts";

import * as schedule from "node-schedule";

interface Reminder {
  reminderString: string;
  reminderTime: Date;
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
  tasksList: Array<string>;
  remindersList: Array<Reminder>;
}

export const jobStore = new Map<string, ScheduledJob>();

export type MySessionContext = Context & SessionFlavor<SessionData>;

import {
  Context,
  SessionFlavor,
} from "https://deno.land/x/grammy@v1.36.3/mod.ts";

interface Reminder {
  reminderString: string;
  reminderTime: Date;
}

// Define the session structure.
export interface SessionData {
  tasksList: Array<string>;
  remindersList: Array<Reminder>;
}
export type MySessionContext = Context & SessionFlavor<SessionData>;

import {
  Context,
  SessionFlavor,
} from "https://deno.land/x/grammy@v1.36.3/mod.ts";

// Define the session structure.
export interface SessionData {
  tasksList: Array<string>;
}
export type MySessionContext = Context & SessionFlavor<SessionData>;

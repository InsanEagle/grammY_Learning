import { SessionData } from "../db/freeStorage.ts";

export function clearRemindersList(session: SessionData) {
  session.remindersList = [];
}

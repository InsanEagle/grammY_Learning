import { SessionData } from "../../core/types.ts";

export function clearRemindersList(session: SessionData) {
  session.remindersList = [];
}

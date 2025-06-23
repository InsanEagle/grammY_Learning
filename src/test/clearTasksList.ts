import { SessionData } from "../db/freeStorage.ts";

export function clearTasksList(session: SessionData) {
  session.tasksList = [];
}

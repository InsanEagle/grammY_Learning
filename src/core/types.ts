import { Context } from "https://deno.land/x/grammy@v1.36.3/mod.ts";
import {
  type Conversation,
  type ConversationFlavor,
} from "https://deno.land/x/grammy_conversations@v2.0.1/mod.ts";

export type MyContext = ConversationFlavor<Context>;
export type MyConversation = Conversation<MyContext>;

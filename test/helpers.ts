import {
  Api,
  Context,
  RawApi,
} from "https://deno.land/x/grammy@v1.36.3/mod.ts";
import {
  type Conversation,
  type ConversationFlavor,
} from "https://deno.land/x/grammy_conversations@v2.0.1/mod.ts";
import { spy } from "https://deno.land/std@0.224.0/testing/mock.ts";
import { UserFromGetMe } from "https://deno.land/x/grammy@v1.36.3/types.ts";
import { kv } from "../src/core/database.ts";
import { ConversationControls } from "https://deno.land/x/grammy_conversations@v2.0.1/plugin.ts";

export type MyContext = Context & ConversationFlavor<Context>;
export type MyConversation = Conversation<MyContext>;

export const createMockContext = (messageText: string = "") => {
  const me: UserFromGetMe = {
    id: 12345,
    is_bot: true,
    first_name: "TestBot",
    username: "test_bot",
    can_join_groups: true,
    can_read_all_group_messages: true,
    supports_inline_queries: false,
    can_connect_to_business: false, // Added missing property
    has_main_web_app: false, // Added missing property
  };

  const ctx = new Context(
    {
      update_id: 1,
      message: {
        message_id: 1,
        date: Date.now() / 1000,
        chat: { id: 123, type: "private", first_name: "TestUser" },
        from: { id: 123, is_bot: false, first_name: "Test" },
        text: messageText,
      },
    },
    {} as Api<RawApi>,
    me, // Mock API
  ) as MyContext;

  ctx.reply = spy(() => Promise.resolve() as any);

  function mockActive(...args: [string?]): Record<string, number> | number {
    if (args.length === 0) {
      // Corresponds to `active()` call
      return {};
    }
    // Corresponds to `active(name)` call
    return 0;
  }

  // FIX 2.2: Assemble the mock object and use `as unknown as ...` to force the type.
  ctx.conversation = {
    enter: spy((_name: string) => Promise.resolve()),
    exit: spy(() => Promise.resolve()),
    exitAll: spy(() => Promise.resolve()),
    exitOne: spy(() => Promise.resolve()),
    active: spy(mockActive),
    wait: spy(() => Promise.resolve({} as any)),
    waitFor: spy(() => Promise.resolve({} as any)),
    waitUntil: spy(() => Promise.resolve({} as any)),
    external: spy((cb: () => any) => cb()),
  } as unknown as ConversationControls;

  return ctx;
};

export const createMockConversation = () => {
  const conversation = {
    wait: spy(() => Promise.resolve() as any),
    waitFor: spy(() => Promise.resolve() as any),
    waitUntil: spy(() => Promise.resolve() as any),
    external: spy((cb: any) => cb()),
  } as unknown as MyConversation;

  return conversation;
};

export async function clearDb() {
  const iter = kv.list({ prefix: [] });
  for await (const entry of iter) {
    await kv.delete(entry.key);
  }
}

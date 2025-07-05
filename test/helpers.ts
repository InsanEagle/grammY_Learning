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
import { initializeDb, kv } from "../src/core/database.ts";
import { ConversationControls } from "https://deno.land/x/grammy_conversations@v2.0.1/plugin.ts";
import { Message } from "https://deno.land/x/grammy_types@v3.20.0/message.ts";

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
    can_connect_to_business: false,
    has_main_web_app: false,
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
    me,
  ) as MyContext;

  ctx.reply = spy(() => Promise.resolve({} as Message.TextMessage));

  function mockActive(...args: [string?]): Record<string, number> | number {
    if (args.length === 0) {
      return {};
    }
    return 0;
  }

  ctx.conversation = {
    enter: spy((_name: string) => Promise.resolve()),
    exit: spy(() => Promise.resolve()),
    exitAll: spy(() => Promise.resolve()),
    exitOne: spy(() => Promise.resolve()),
    active: spy(mockActive),
    wait: spy(() => Promise.resolve({} as unknown)),
    waitFor: spy(() => Promise.resolve({} as unknown)),
    waitUntil: spy(() => Promise.resolve({} as unknown)),
    external: spy((cb: () => unknown) => cb()),
  } as ConversationControls;

  return ctx;
};

export const createMockConversation = () => {
  const conversation = {
    wait: spy(() => Promise.resolve() as unknown),
    waitFor: spy(() => Promise.resolve() as unknown),
    waitUntil: spy(() => Promise.resolve() as unknown),
    external: spy((cb: () => unknown) => Promise.resolve(cb())),
  } as unknown as MyConversation;

  return conversation;
};

const TEST_DB_PATH = "./test.kv.db";

/**
 * Sets up an isolated Deno KV database for integration tests.
 * It initializes the DB, provides a function to clear it between steps,
 * and returns a function to clean up (close and delete) the DB file afterward.
 */
export async function setupTestDb() {
  await initializeDb(TEST_DB_PATH);

  const clear = async () => {
    const iter = kv.list({ prefix: [] });
    for await (const entry of iter) {
      await kv.delete(entry.key);
    }
  };

  const teardown = () => {
    kv.close();
    // Deno.remove is unstable, but necessary for cleanup.
    // Ensure --allow-write is enabled for tests.
    try {
      Deno.removeSync(TEST_DB_PATH);
      Deno.removeSync(`${TEST_DB_PATH}-shm`);
      Deno.removeSync(`${TEST_DB_PATH}-wal`);
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        console.error("Error during test DB cleanup:", error);
      }
    }
  };

  return { clear, teardown };
}

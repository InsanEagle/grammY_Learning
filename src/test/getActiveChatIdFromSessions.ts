export async function getActiveChatIdsFromSessions() {
  const files = await Deno.readDir(Deno.cwd() + "/sessions/78");
  const chatIds = [];

  for await (const file of files) {
    if (file.isFile && file.name.endsWith(".json")) {
      const chatId = file.name.replace(".json", "");
      chatIds.push(Number(chatId));
    }
  }

  return chatIds;
}

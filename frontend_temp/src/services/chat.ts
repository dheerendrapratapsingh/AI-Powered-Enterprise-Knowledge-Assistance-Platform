import { fetchWithAuth } from "./api";

export async function sendMessage(question: string, conversationId?: string) {
  return fetchWithAuth("/chat", {
    method: "POST",
    body: JSON.stringify({
      question,
      conversation_id: conversationId || null
    })
  });
}

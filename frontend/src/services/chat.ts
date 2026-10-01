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

export async function submitFeedback(messageId: string, rating: number) {
  return fetchWithAuth("/chat/feedback", {
    method: "POST",
    body: JSON.stringify({
      message_id: messageId,
      rating
    })
  });
}

import { fetchWithAuth, API_URL } from "./api";

export async function sendMessage(question: string, conversationId?: string) {
  return fetchWithAuth("/chat", {
    method: "POST",
    body: JSON.stringify({
      question,
      conversation_id: conversationId || null
    })
  });
}

export async function sendMessageStream(
  question: string,
  conversationId: string | null | undefined,
  callbacks: {
    onMetadata: (metadata: { conversation_id: string; message_id: string; sources: any[] }) => void;
    onToken: (token: string) => void;
    onDone: () => void;
    onError: (error: string) => void;
  },
  signal?: AbortSignal
) {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${API_URL}/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        question,
        conversation_id: conversationId || null
      }),
      signal
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.detail || `Server returned ${response.status}`);
    }

    if (!response.body) {
      throw new Error("ReadableStream not supported by browser or empty body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      if (signal?.aborted) {
        await reader.cancel();
        break;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const block of lines) {
        const line = block.trim();
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "metadata") {
              callbacks.onMetadata(data);
            } else if (data.type === "token") {
              callbacks.onToken(data.token);
            } else if (data.type === "done") {
              callbacks.onDone();
            } else if (data.type === "error") {
              callbacks.onError(data.error);
            }
          } catch (e) {
            console.warn("Failed to parse SSE line:", line, e);
          }
        }
      }
    }
    callbacks.onDone();
  } catch (err: any) {
    if (err.name === "AbortError" || signal?.aborted) {
      callbacks.onDone();
      return;
    }
    callbacks.onError(err.message || "Failed to communicate with AI server");
  }
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

export async function getConversations() {
  return fetchWithAuth("/conversations");
}

export async function getConversationMessages(conversationId: string) {
  return fetchWithAuth(`/conversations/${conversationId}/messages`);
}

export async function deleteConversation(conversationId: string) {
  return fetchWithAuth(`/conversations/${conversationId}`, {
    method: "DELETE"
  });
}

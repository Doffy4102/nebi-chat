export interface StreamChunk {
  content: string;
  done: boolean;
}

interface SSEChoice {
  delta?: { content?: string };
}

interface SSEResponse {
  choices?: SSEChoice[];
}

async function* generateSSEChunks(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  decoder: TextDecoder
): AsyncGenerator<StreamChunk, void, unknown> {
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const data: string = trimmed.slice(6);
        if (data === "[DONE]") {
          yield { content: "", done: true };
          return;
        }

        try {
          const parsed: SSEResponse = JSON.parse(data) as SSEResponse;
          const delta: string | undefined = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            yield { content: delta, done: false };
          }
        } catch {
          // skip malformed JSON lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export function parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  decoder: TextDecoder
): AsyncGenerator<StreamChunk, void, unknown> {
  return generateSSEChunks(reader, decoder);
}

async function* concatenateChunks(
  generator: AsyncGenerator<StreamChunk, void, unknown>,
  onChunk: (text: string) => void
): AsyncGenerator<string> {
  let fullText = "";
  for await (const chunk of generator) {
    if (chunk.done) break;
    fullText += chunk.content;
    onChunk(fullText);
    yield chunk.content;
  }
}

export function concatenateStream(
  generator: AsyncGenerator<StreamChunk, void, unknown>,
  onChunk: (text: string) => void
): AsyncGenerator<string> {
  return concatenateChunks(generator, onChunk);
}

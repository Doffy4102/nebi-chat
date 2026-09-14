export interface StreamChunk {
  content: string;
  done: boolean;
}

export function parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  decoder: TextDecoder
): AsyncGenerator<StreamChunk> {
  return (async function* () {
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

          const data = trimmed.slice(6);
          if (data === "[DONE]") {
            yield { content: "", done: true };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
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
  })();
}

export function concatenateStream(
  generator: AsyncGenerator<StreamChunk>,
  onChunk: (text: string) => void
): AsyncGenerator<string> {
  return (async function* () {
    let fullText = "";
    for await (const chunk of generator) {
      if (chunk.done) break;
      fullText += chunk.content;
      onChunk(fullText);
      yield chunk.content;
    }
  })();
}

import { requestUrl } from "obsidian";
import { AIProvider, ChatRequest, ModelInfo } from "../../types";
import { parseSSEStream } from "../StreamingParser";

export abstract class BaseProvider implements AIProvider {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly models: ModelInfo[];
  protected abstract getBaseUrl(): string;

  protected apiKey: string = "";
  protected baseUrl: string = "";
  protected temperature: number = 0.7;
  protected maxTokens: number = 4096;

  setApiKey(key: string): void {
    this.apiKey = key;
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  setTemperature(temp: number): void {
    this.temperature = temp;
  }

  setMaxTokens(tokens: number): void {
    this.maxTokens = tokens;
  }

  isConfigured(): boolean {
    return this.apiKeyRequired() ? this.apiKey.length > 0 : true;
  }

  protected apiKeyRequired(): boolean {
    return true;
  }

  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "text/event-stream",
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  protected buildRequestBody(request: ChatRequest): Record<string, unknown> {
    const messages: Array<{ role: string; content: string }> = [];

    if (request.systemPrompt) {
      messages.push({ role: "system", content: request.systemPrompt });
    }

    for (const msg of request.messages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    const model = request.model || this.models[0]?.id;

    return {
      model,
      messages,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      stream: true,
    };
  }

  async *chat(request: ChatRequest): AsyncGenerator<string> {
    const url = `${this.baseUrl || this.getBaseUrl()}/chat/completions`;
    const body = this.buildRequestBody(request);

    let arrayBuffer: ArrayBuffer;
    let status: number;
    try {
      const response = await requestUrl({
        url,
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        contentType: "application/json",
      });
      arrayBuffer = response.arrayBuffer;
      status = response.status;
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string };
      console.error(`[Nebi Chat] ${this.name} fetch error:`, err);
      throw new Error(`[${this.name}] Network error: ${e.message || String(err)}`);
    }

    if (status < 200 || status >= 300) {
      const errText = new TextDecoder().decode(arrayBuffer).substring(0, 500);
      console.error(`[Nebi Chat] ${this.name} error body:`, errText);
      throw new Error(`[${this.name}] HTTP ${status}: ${errText}`);
    }

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(arrayBuffer));
        controller.close();
      },
    });
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    try {
      for await (const chunk of parseSSEStream(reader, decoder)) {
        if (chunk.done) return;
        if (chunk.content) {
          yield chunk.content;
        }
      }
    } catch (err: unknown) {
      const e = err as { name?: string };
      if (e.name === "AbortError") {
        throw err;
      }
      throw err;
    } finally {
      reader.releaseLock();
    }
  }

  async fetchModels(): Promise<ModelInfo[]> {
    const baseUrl = this.baseUrl || this.getBaseUrl();
    const url = `${baseUrl}/models`;
    const headers: Record<string, string> = { "Accept": "application/json" };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    try {
      const res = await requestUrl({ url, method: "GET", headers });
      if (res.status < 200 || res.status >= 300) return this.models;

      const data = res.json as { data?: Array<{ id: string; context_window?: number }> };
      const models: ModelInfo[] = [];

      if (data.data && Array.isArray(data.data)) {
        for (const m of data.data) {
          if (m.id) {
            models.push({
              id: m.id,
              name: m.id,
              maxTokens: this.maxTokens,
              contextWindow: m.context_window || 131072,
            });
          }
        }
      }

      if (models.length > 0) {
        return models;
      }
    } catch (err: unknown) {
      console.warn(`[Nebi Chat] ${this.name} model discovery failed:`, err);
    }

    return this.models;
  }
}

import { BaseProvider } from "./BaseProvider";
import { ModelInfo } from "../../types";

export class OllamaProvider extends BaseProvider {
  readonly id = "ollama";
  readonly name = "Ollama (Local)";
  readonly models: ModelInfo[] = [
    {
      id: "llama3.2",
      name: "Llama 3.2",
      maxTokens: 4096,
      contextWindow: 128000,
    },
    {
      id: "llama3.1",
      name: "Llama 3.1",
      maxTokens: 4096,
      contextWindow: 128000,
    },
    {
      id: "mistral",
      name: "Mistral",
      maxTokens: 4096,
      contextWindow: 32768,
    },
    {
      id: "qwen3",
      name: "Qwen3",
      maxTokens: 4096,
      contextWindow: 32768,
    },
  ];

  protected getBaseUrl(): string {
    return "http://localhost:11434/v1";
  }

  protected apiKeyRequired(): boolean {
    return false;
  }
}

import { BaseProvider } from "./BaseProvider";
import { ModelInfo } from "../../types";

export class GroqProvider extends BaseProvider {
  readonly id = "groq";
  readonly name = "Groq";
  readonly models: ModelInfo[] = [
    {
      id: "openai/gpt-oss-120b",
      name: "GPT-OSS 120B",
      maxTokens: 65536,
      contextWindow: 131072,
    },
    {
      id: "openai/gpt-oss-20b",
      name: "GPT-OSS 20B",
      maxTokens: 65536,
      contextWindow: 131072,
    },
    {
      id: "qwen/qwen3.8-27b",
      name: "Qwen3.8 27B",
      maxTokens: 16384,
      contextWindow: 131072,
    },
  ];

  protected getBaseUrl(): string {
    return "https://api.groq.com/openai/v1";
  }
}

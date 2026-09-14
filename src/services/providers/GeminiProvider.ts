import { BaseProvider } from "./BaseProvider";
import { ModelInfo } from "../../types";

export class GeminiProvider extends BaseProvider {
  readonly id = "gemini";
  readonly name = "Google Gemini";
  readonly models: ModelInfo[] = [
    {
      id: "gemini-3.5-flash",
      name: "Gemini 3.5 Flash",
      maxTokens: 8192,
      contextWindow: 1000000,
    },
    {
      id: "gemini-3.6-flash",
      name: "Gemini 3.6 Flash",
      maxTokens: 8192,
      contextWindow: 1000000,
    },
    {
      id: "gemini-3.5-flash-lite",
      name: "Gemini 3.5 Flash-Lite",
      maxTokens: 8192,
      contextWindow: 1000000,
    },
    {
      id: "gemini-3.1-flash-lite",
      name: "Gemini 3.1 Flash-Lite",
      maxTokens: 8192,
      contextWindow: 1000000,
    },
    {
      id: "gemini-2.5-pro",
      name: "Gemini 2.5 Pro",
      maxTokens: 8192,
      contextWindow: 1000000,
    },
    {
      id: "gemini-2.5-flash",
      name: "Gemini 2.5 Flash",
      maxTokens: 8192,
      contextWindow: 1000000,
    },
    {
      id: "gemini-2.5-flash-lite",
      name: "Gemini 2.5 Flash-Lite",
      maxTokens: 8192,
      contextWindow: 1000000,
    },
  ];

  protected getBaseUrl(): string {
    return "https://generativelanguage.googleapis.com/v1beta/openai";
  }
}
